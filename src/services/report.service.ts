import { prisma } from '../lib/db';

export interface GroupedRescuedMetrics {
  unit: string;
  totalQuantity: number;
  itemCount: number;
}

export interface DonorReportItem {
  donorId: string;
  donorName: string;
  donorType: string;
  unit: string;
  totalReceived: number;
  totalDistributed: number;
}

export const reportService = {
  async getRescuedFoodReport(startDate?: Date, endDate?: Date): Promise<GroupedRescuedMetrics[]> {
    const whereDistribution: Record<string, unknown> = {
      status: 'DITERIMA',
    };

    if (startDate || endDate) {
      whereDistribution.scheduledDate = {};
      if (startDate) (whereDistribution.scheduledDate as Record<string, unknown>).gte = startDate;
      if (endDate) (whereDistribution.scheduledDate as Record<string, unknown>).lte = endDate;
    }

    const items = await prisma.distributionItem.findMany({
      where: {
        distribution: whereDistribution,
      },
      include: {
        foodStock: true,
      },
    });

    // Group strictly by unit without cross-unit summing
    const unitMap = new Map<string, { totalQuantity: number; itemCount: number }>();

    for (const item of items) {
      const unit = item.foodStock.unit.toLowerCase().trim();
      const current = unitMap.get(unit) || { totalQuantity: 0, itemCount: 0 };
      unitMap.set(unit, {
        totalQuantity: current.totalQuantity + item.quantity,
        itemCount: current.itemCount + 1,
      });
    }

    return Array.from(unitMap.entries()).map(([unit, data]) => ({
      unit,
      totalQuantity: data.totalQuantity,
      itemCount: data.itemCount,
    }));
  },

  async getDonorTransparencyReport(): Promise<DonorReportItem[]> {
    const donors = await prisma.donor.findMany({
      where: { isDeleted: false },
      include: {
        foods: {
          include: {
            distributionItems: {
              where: {
                distribution: { status: 'DITERIMA' },
              },
            },
          },
        },
      },
    });

    const results: DonorReportItem[] = [];

    for (const donor of donors) {
      // Group per unit for each donor
      const unitMap = new Map<string, { received: number; distributed: number }>();

      for (const food of donor.foods) {
        const unit = food.unit.toLowerCase().trim();
        const current = unitMap.get(unit) || { received: 0, distributed: 0 };
        const distributed = food.distributionItems.reduce((acc, curr) => acc + curr.quantity, 0);

        unitMap.set(unit, {
          received: current.received + food.initialQuantity,
          distributed: current.distributed + distributed,
        });
      }

      for (const [unit, data] of unitMap.entries()) {
        results.push({
          donorId: donor.id,
          donorName: donor.name,
          donorType: donor.type,
          unit,
          totalReceived: data.received,
          totalDistributed: data.distributed,
        });
      }
    }

    return results;
  },

  async exportReportToCSV(type: 'rescued' | 'donor', startDate?: Date, endDate?: Date): Promise<string> {
    if (type === 'rescued') {
      const metrics = await this.getRescuedFoodReport(startDate, endDate);
      const rows = ['Satuan,Total Makanan Terselamatkan,Jumlah Transaksi Distribusi'];
      for (const m of metrics) {
        rows.push(`"${m.unit}",${m.totalQuantity},${m.itemCount}`);
      }
      return rows.join('\n');
    } else {
      const report = await this.getDonorTransparencyReport();
      const rows = ['Nama Donatur,Kategori,Satuan,Total Diterima,Total Disalurkan'];
      for (const r of report) {
        rows.push(`"${r.donorName}","${r.donorType}","${r.unit}",${r.totalReceived},${r.totalDistributed}`);
      }
      return rows.join('\n');
    }
  },
};

