import { prisma } from '../lib/db';
import { computeExpiryStatus } from '../lib/fefo';
import { auditService } from './audit.service';

export interface InboundFoodInput {
  donorId: string;
  name: string;
  quantity: number;
  unit: string;
  expiryAt: Date | string;
  packagingIntact: boolean;
  temperatureSafe: boolean;
  visualSmellOk: boolean;
  notes?: string;
}

export interface BatchInboundItemInput {
  name: string;
  quantity: number;
  unit: string;
  expiryAt: Date | string;
  packagingIntact?: boolean;
  temperatureSafe?: boolean;
  visualSmellOk?: boolean;
  notes?: string;
}

export interface BatchInboundInput {
  donorId: string;
  items: BatchInboundItemInput[];
}

export interface UpdateFoodMetadataInput {
  name?: string;
  donorId?: string;
  expiryAt?: Date | string;
  notes?: string;
}

export const foodService = {
  async recordInbound(input: InboundFoodInput, userId: string) {
    const isAccepted = input.packagingIntact && input.temperatureSafe && input.visualSmellOk;
    const physicalStatus = isAccepted ? 'DITERIMA' : 'DITOLAK';
    const remainingQuantity = isAccepted ? input.quantity : 0;

    const food = await prisma.foodStock.create({
      data: {
        donorId: input.donorId,
        name: input.name,
        initialQuantity: input.quantity,
        remainingQuantity,
        unit: input.unit,
        expiryAt: new Date(input.expiryAt),
        packagingIntact: input.packagingIntact,
        temperatureSafe: input.temperatureSafe,
        visualSmellOk: input.visualSmellOk,
        physicalStatus,
        notes: input.notes || null,
        createdByUserId: userId,
      },
      include: {
        donor: true,
      },
    });

    await auditService.record({
      userId,
      action: 'INBOUND_FOOD_RECORD',
      entity: 'FoodStock',
      entityId: food.id,
      details: {
        name: food.name,
        initialQuantity: food.initialQuantity,
        physicalStatus: food.physicalStatus,
        remainingQuantity: food.remainingQuantity,
      },
    });

    return food;
  },

  async createBatchInbound(input: BatchInboundInput, userId: string) {
    if (!input.items || input.items.length === 0) {
      throw new Error('Batch penerimaan harus memiliki minimal 1 item makanan');
    }

    const donor = await prisma.donor.findUnique({
      where: { id: input.donorId },
    });

    if (!donor) {
      throw new Error(`Donatur dengan ID ${input.donorId} tidak ditemukan`);
    }

    const createdFoods = await prisma.$transaction(async (tx) => {
      const itemsResult = [];

      for (const item of input.items) {
        if (!item.name || !item.name.trim()) {
          throw new Error('Nama makanan tidak boleh kosong');
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Jumlah makanan untuk "${item.name}" harus lebih dari 0`);
        }

        const intact = item.packagingIntact ?? true;
        const tempSafe = item.temperatureSafe ?? true;
        const smellOk = item.visualSmellOk ?? true;

        const isAccepted = intact && tempSafe && smellOk;
        const physicalStatus = isAccepted ? 'DITERIMA' : 'DITOLAK';
        const remainingQuantity = isAccepted ? item.quantity : 0;

        const food = await tx.foodStock.create({
          data: {
            donorId: input.donorId,
            name: item.name.trim(),
            initialQuantity: item.quantity,
            remainingQuantity,
            unit: item.unit || 'porsi',
            expiryAt: new Date(item.expiryAt),
            packagingIntact: intact,
            temperatureSafe: tempSafe,
            visualSmellOk: smellOk,
            physicalStatus,
            notes: item.notes || null,
            createdByUserId: userId,
          },
          include: {
            donor: true,
          },
        });

        itemsResult.push(food);
      }

      return itemsResult;
    });

    // Record audit logs after transaction successfully completes to avoid SQLite lock contention
    for (const food of createdFoods) {
      await auditService.record({
        userId,
        action: 'INBOUND_FOOD_RECORD',
        entity: 'FoodStock',
        entityId: food.id,
        details: {
          batchInbound: true,
          donorName: donor.name,
          name: food.name,
          initialQuantity: food.initialQuantity,
          physicalStatus: food.physicalStatus,
          remainingQuantity: food.remainingQuantity,
        },
      });
    }

    return createdFoods;
  },

  async getFEFODashboard() {
    const stocks = await prisma.foodStock.findMany({
      where: {
        remainingQuantity: { gt: 0 },
        physicalStatus: 'DITERIMA',
        isDisposed: false,
      },
      include: {
        donor: true,
      },
      orderBy: {
        expiryAt: 'asc',
      },
    });

    return stocks.map((stock) => {
      const evaluation = computeExpiryStatus(stock.expiryAt, stock.physicalStatus as 'DITERIMA' | 'DITOLAK');
      return {
        ...stock,
        evaluation,
      };
    });
  },

  async correctStock(stockId: string, newInitialQty: number, userId: string, role: string) {
    if (role !== 'ADMIN') {
      throw new Error('Hanya Admin yang dapat mengoreksi stok makanan');
    }

    const current = await prisma.foodStock.findUnique({ where: { id: stockId } });
    if (!current) {
      throw new Error('Data stok makanan tidak ditemukan');
    }

    const totalDisalurkan = current.initialQuantity - current.remainingQuantity;
    if (newInitialQty < totalDisalurkan) {
      throw new Error('Jumlah baru tidak boleh lebih kecil dari jumlah yang sudah disalurkan');
    }

    const newRemainingQty = newInitialQty - totalDisalurkan;

    const updated = await prisma.foodStock.update({
      where: { id: stockId },
      data: {
        initialQuantity: newInitialQty,
        remainingQuantity: newRemainingQty,
      },
    });

    await auditService.record({
      userId,
      action: 'STOCK_CORRECTION',
      entity: 'FoodStock',
      entityId: stockId,
      details: {
        previousInitial: current.initialQuantity,
        newInitial: newInitialQty,
        previousRemaining: current.remainingQuantity,
        newRemaining: newRemainingQty,
        totalDisalurkan,
      },
    });

    return updated;
  },

  async disposeStock(stockId: string, reason: string, userId: string, quantityToDispose?: number) {
    const current = await prisma.foodStock.findUnique({ where: { id: stockId } });
    if (!current) {
      throw new Error('Data stok makanan tidak ditemukan');
    }

    const qtyToDispose = quantityToDispose !== undefined ? quantityToDispose : current.remainingQuantity;

    if (qtyToDispose <= 0) {
      throw new Error('Jumlah yang dibuang harus lebih dari 0');
    }

    if (qtyToDispose > current.remainingQuantity) {
      throw new Error('Jumlah yang dibuang tidak boleh melebihi sisa stok');
    }

    const newRemaining = current.remainingQuantity - qtyToDispose;
    const isFullyDisposed = newRemaining === 0;

    const disposed = await prisma.foodStock.update({
      where: { id: stockId },
      data: {
        remainingQuantity: newRemaining,
        isDisposed: isFullyDisposed,
        disposalReason: reason,
        disposedAt: isFullyDisposed ? new Date() : current.disposedAt,
      },
    });

    await auditService.record({
      userId,
      action: 'STOCK_DISPOSAL',
      entity: 'FoodStock',
      entityId: stockId,
      details: {
        previousRemaining: current.remainingQuantity,
        disposedQuantity: qtyToDispose,
        newRemaining,
        reason,
      },
    });

    return disposed;
  },

  async updateMetadata(
    stockId: string,
    input: UpdateFoodMetadataInput,
    userId: string,
    userRole: string
  ) {
    if (userRole !== 'ADMIN') {
      throw new Error('Hanya Admin yang dapat mengoreksi informasi metadata makanan');
    }

    const current = await prisma.foodStock.findUnique({
      where: { id: stockId },
      include: { donor: true },
    });

    if (!current) {
      throw new Error('Data stok makanan tidak ditemukan');
    }

    if (input.donorId && input.donorId !== current.donorId) {
      const donor = await prisma.donor.findUnique({ where: { id: input.donorId } });
      if (!donor) {
        throw new Error('Donatur tidak ditemukan');
      }
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (input.name !== undefined) dataToUpdate.name = input.name.trim();
    if (input.donorId !== undefined) dataToUpdate.donorId = input.donorId;
    if (input.expiryAt !== undefined) dataToUpdate.expiryAt = new Date(input.expiryAt);
    if (input.notes !== undefined) dataToUpdate.notes = input.notes;

    const updated = await prisma.foodStock.update({
      where: { id: stockId },
      data: dataToUpdate,
      include: { donor: true },
    });

    await auditService.record({
      userId,
      action: 'STOCK_METADATA_UPDATE',
      entity: 'FoodStock',
      entityId: stockId,
      details: {
        previous: {
          name: current.name,
          donorId: current.donorId,
          expiryAt: current.expiryAt,
          notes: current.notes,
        },
        updated: {
          name: updated.name,
          donorId: updated.donorId,
          expiryAt: updated.expiryAt,
          notes: updated.notes,
        },
      },
    });

    return updated;
  },

  async listInventory(params?: { search?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (params?.search) {
      where.name = { contains: params.search };
    }

    const items = await prisma.foodStock.findMany({
      where,
      include: {
        donor: true,
        createdByUser: { select: { name: true, role: true } },
      },
      orderBy: { expiryAt: 'asc' },
    });

    return items.map((item) => ({
      ...item,
      evaluation: computeExpiryStatus(item.expiryAt, item.physicalStatus as 'DITERIMA' | 'DITOLAK'),
    }));
  },
};

