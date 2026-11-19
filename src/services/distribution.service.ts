import { prisma } from '../lib/db';
import { DistributionStatus } from '@prisma/client';
import { computeExpiryStatus } from '../lib/fefo';
import { auditService } from './audit.service';

export interface DistributionItemInput {
  foodStockId: string;
  quantity: number;
}

export interface CreateDistributionInput {
  beneficiaryId: string;
  scheduledDate: Date | string;
  assignedToUserId?: string;
  notes?: string;
  forceBypassCapacity?: boolean;
  items: DistributionItemInput[];
}

export const distributionService = {
  async createSchedule(input: CreateDistributionInput, userId: string) {
    if (!input.items || input.items.length === 0) {
      throw new Error('Distribusi harus memiliki minimal satu jenis makanan');
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: input.beneficiaryId },
    });

    if (!beneficiary) {
      throw new Error(`Penerima manfaat dengan ID ${input.beneficiaryId} tidak ditemukan`);
    }

    const totalQuantity = input.items.reduce((acc, curr) => acc + curr.quantity, 0);

    if (
      beneficiary.capacity !== null &&
      beneficiary.capacity !== undefined &&
      beneficiary.capacity > 0 &&
      totalQuantity > beneficiary.capacity
    ) {
      if (!input.forceBypassCapacity) {
        throw new Error(
          `Alokasi (${totalQuantity} porsi) melebihi kapasitas kuota penerima (${beneficiary.capacity} porsi). Konfirmasi izin khusus diperlukan untuk melanjutkan.`
        );
      }
    }

    // Verify each item safety and available reservation quantity
    for (const item of input.items) {
      const stock = await prisma.foodStock.findUnique({
        where: { id: item.foodStockId },
      });

      if (!stock) {
        throw new Error(`Stok makanan dengan ID ${item.foodStockId} tidak ditemukan`);
      }

      const evaluation = computeExpiryStatus(stock.expiryAt, stock.physicalStatus as 'DITERIMA' | 'DITOLAK');
      if (!evaluation.canDistribute) {
        throw new Error(`Makanan ${stock.name} tidak aman untuk didistribusikan (${evaluation.label})`);
      }

      // Check current reserved quantity in TERJADWAL status
      const activeReservations = await prisma.distributionItem.aggregate({
        where: {
          foodStockId: stock.id,
          distribution: { status: 'TERJADWAL' },
        },
        _sum: { quantity: true },
      });

      const reservedQty = activeReservations._sum.quantity || 0;
      const availableStock = stock.remainingQuantity - reservedQty;

      if (item.quantity > availableStock) {
        throw new Error(
          `Jumlah yang diminta (${item.quantity} ${stock.unit}) melebihi stok yang tersedia (${availableStock} ${stock.unit}) setelah memperhitungkan jadwal aktif.`
        );
      }
    }

    const distribution = await prisma.distribution.create({
      data: {
        beneficiaryId: input.beneficiaryId,
        scheduledDate: new Date(input.scheduledDate),
        assignedToUserId: input.assignedToUserId || null,
        notes: input.notes || null,
        status: DistributionStatus.TERJADWAL,
        createdByUserId: userId,
        items: {
          create: input.items.map((i) => ({
            foodStockId: i.foodStockId,
            quantity: i.quantity,
          })),
        },
      },
      include: {
        items: { include: { foodStock: true } },
        beneficiary: true,
      },
    });

    await auditService.record({
      userId,
      action: 'DISTRIBUTION_CREATE',
      entity: 'Distribution',
      entityId: distribution.id,
      details: {
        beneficiaryId: input.beneficiaryId,
        beneficiaryName: beneficiary.name,
        beneficiaryCapacity: beneficiary.capacity,
        capacityBypassed: Boolean(input.forceBypassCapacity),
        itemCount: input.items.length,
        totalQuantity,
      },
    });

    return distribution;
  },

  async updateStatus(distributionId: string, newStatus: DistributionStatus, userId: string) {
    const current = await prisma.distribution.findUnique({
      where: { id: distributionId },
      include: { items: { include: { foodStock: true } } },
    });

    if (!current) {
      throw new Error('Distribusi tidak ditemukan');
    }

    // Check valid transitions
    if (current.status === 'DITERIMA' || current.status === 'DIBATALKAN') {
      throw new Error(`Distribusi yang sudah ${current.status} tidak dapat diubah lagi`);
    }

    if (newStatus === 'DIKIRIM') {
      if (current.status !== 'TERJADWAL') {
        throw new Error('Hanya distribusi TERJADWAL yang dapat diubah ke DIKIRIM');
      }

      // Check expiry guard at dispatch time (Review Focus 2)
      for (const item of current.items) {
        const evaluation = computeExpiryStatus(item.foodStock.expiryAt, item.foodStock.physicalStatus as 'DITERIMA' | 'DITOLAK');
        if (evaluation.status === 'KEDALUWARSA') {
          throw new Error(
            `Makanan ${item.foodStock.name} tidak aman untuk dikirim karena telah kedaluwarsa`
          );
        }
      }

      // Decrement stock inside transaction
      await prisma.$transaction(async (tx) => {
        for (const item of current.items) {
          const freshStock = await tx.foodStock.findUnique({ where: { id: item.foodStockId } });
          if (!freshStock || freshStock.remainingQuantity < item.quantity) {
            throw new Error(`Stok ${item.foodStock.name} tidak mencukupi untuk dikirim`);
          }

          await tx.foodStock.update({
            where: { id: item.foodStockId },
            data: { remainingQuantity: freshStock.remainingQuantity - item.quantity },
          });
        }

        await tx.distribution.update({
          where: { id: distributionId },
          data: {
            status: 'DIKIRIM',
            dispatchedByUserId: userId,
          },
        });
      });
    } else if (newStatus === 'DITERIMA') {
      if (current.status !== 'DIKIRIM') {
        throw new Error('Hanya distribusi DIKIRIM yang dapat diubah ke DITERIMA');
      }

      await prisma.distribution.update({
        where: { id: distributionId },
        data: {
          status: 'DITERIMA',
          deliveredByUserId: userId,
        },
      });
    } else if (newStatus === 'DIBATALKAN') {
      // If was DIKIRIM, restore stock inside transaction
      await prisma.$transaction(async (tx) => {
        if (current.status === 'DIKIRIM') {
          for (const item of current.items) {
            await tx.foodStock.update({
              where: { id: item.foodStockId },
              data: { remainingQuantity: { increment: item.quantity } },
            });
          }
        }

        await tx.distribution.update({
          where: { id: distributionId },
          data: { status: 'DIBATALKAN' },
        });
      });
    }

    await auditService.record({
      userId,
      action: 'DISTRIBUTION_STATUS_CHANGE',
      entity: 'Distribution',
      entityId: distributionId,
      details: {
        from: current.status,
        to: newStatus,
      },
    });

    return prisma.distribution.findUnique({
      where: { id: distributionId },
      include: {
        items: { include: { foodStock: true } },
        beneficiary: true,
        createdByUser: { select: { name: true } },
        dispatchedByUser: { select: { name: true } },
        deliveredByUser: { select: { name: true } },
      },
    });
  },

  async list(params?: { status?: DistributionStatus; assignedToUserId?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.assignedToUserId) {
      where.assignedToUserId = params.assignedToUserId;
    }

    const [data, total] = await Promise.all([
      prisma.distribution.findMany({
        where,
        include: {
          beneficiary: true,
          items: { include: { foodStock: true } },
          createdByUser: { select: { name: true, role: true } },
          assignedToUser: { select: { name: true } },
          dispatchedByUser: { select: { name: true } },
          deliveredByUser: { select: { name: true } },
        },
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.distribution.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  },

  async getHistoryByBeneficiary(beneficiaryId: string) {
    return prisma.distribution.findMany({
      where: { beneficiaryId },
      include: {
        items: { include: { foodStock: true } },
        createdByUser: { select: { name: true } },
        dispatchedByUser: { select: { name: true } },
        deliveredByUser: { select: { name: true } },
      },
      orderBy: { scheduledDate: 'desc' },
    });
  },
};

