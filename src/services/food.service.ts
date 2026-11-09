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

  async disposeStock(stockId: string, reason: string, userId: string) {
    const current = await prisma.foodStock.findUnique({ where: { id: stockId } });
    if (!current) {
      throw new Error('Data stok makanan tidak ditemukan');
    }

    const disposed = await prisma.foodStock.update({
      where: { id: stockId },
      data: {
        remainingQuantity: 0,
        isDisposed: true,
        disposalReason: reason,
        disposedAt: new Date(),
      },
    });

    await auditService.record({
      userId,
      action: 'STOCK_DISPOSAL',
      entity: 'FoodStock',
      entityId: stockId,
      details: {
        previousRemaining: current.remainingQuantity,
        reason,
      },
    });

    return disposed;
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

