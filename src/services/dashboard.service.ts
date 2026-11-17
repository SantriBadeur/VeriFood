import { prisma } from '../lib/db';
import { foodService } from './food.service';

export interface EvaluatedStockItem {
  unit: string;
  remainingQuantity: number;
  evaluation: {
    status: 'AMAN' | 'MENDEKATI_KEDALUWARSA' | 'KEDALUWARSA' | 'DITOLAK';
  };
}

export const dashboardService = {
  calculateAggregates(items: EvaluatedStockItem[]) {
    let totalPorsi = 0;
    let totalKg = 0;
    const unitBreakdown: Record<string, number> = {};

    let countAman = 0;
    let countMendekati = 0;
    let countKedaluwarsa = 0;

    for (const item of items) {
      const u = (item.unit || '').toLowerCase().trim();
      unitBreakdown[u] = (unitBreakdown[u] || 0) + item.remainingQuantity;

      if (u === 'porsi') {
        totalPorsi += item.remainingQuantity;
      } else if (u === 'kg') {
        totalKg += item.remainingQuantity;
      }

      if (item.evaluation?.status === 'AMAN') {
        countAman++;
      } else if (item.evaluation?.status === 'MENDEKATI_KEDALUWARSA') {
        countMendekati++;
      } else if (item.evaluation?.status === 'KEDALUWARSA') {
        countKedaluwarsa++;
      }
    }

    return {
      totalPorsi,
      totalKg,
      unitBreakdown,
      countAman,
      countMendekati,
      countKedaluwarsa,
    };
  },

  async getStats() {
    // 1. FEFO stocks
    const fefoStocks = await foodService.getFEFODashboard();
    const aggregates = this.calculateAggregates(fefoStocks as any);

    // 2. Distributions completed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const distributionsToday = await prisma.distribution.findMany({
      where: {
        status: 'DITERIMA',
        updatedAt: { gte: startOfToday },
      },
      include: {
        items: true,
      },
    });

    let disalurkanHariIni = 0;
    for (const dist of distributionsToday) {
      for (const item of dist.items) {
        disalurkanHariIni += item.quantity;
      }
    }

    // 3. Active donors count (non-deleted)
    const activeDonorsCount = await prisma.donor.count({
      where: { isDeleted: false },
    });

    // 4. Recent distributions
    const recentDistributions = await prisma.distribution.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        beneficiary: true,
        items: {
          include: { foodStock: true },
        },
      },
    });

    return {
      ...aggregates,
      disalurkanHariIni,
      activeDonorsCount,
      recentDistributions,
    };
  },
};
