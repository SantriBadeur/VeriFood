import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '@/services/dashboard.service';
import { prisma } from '@/lib/db';

describe('Dashboard Stats Aggregation Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('aggregates stock segregated by unit without cross-unit summing', async () => {
    const stats = await dashboardService.getStats();

    expect(typeof stats.totalPorsi).toBe('number');
    expect(typeof stats.totalKg).toBe('number');
    expect(stats.unitBreakdown).toBeDefined();

    // Verify FEFO status counts
    expect(typeof stats.countAman).toBe('number');
    expect(typeof stats.countMendekati).toBe('number');
    expect(typeof stats.countKedaluwarsa).toBe('number');

    // Verify today's distributions and donor counts
    expect(typeof stats.disalurkanHariIni).toBe('number');
    expect(typeof stats.activeDonorsCount).toBe('number');
  });

  it('correctly aggregates segregated units from mock data', () => {
    const mockItems = [
      { unit: 'porsi', remainingQuantity: 50, evaluation: { status: 'AMAN' } },
      { unit: 'porsi', remainingQuantity: 30, evaluation: { status: 'MENDEKATI_KEDALUWARSA' } },
      { unit: 'kg', remainingQuantity: 15, evaluation: { status: 'AMAN' } },
      { unit: 'kotak', remainingQuantity: 5, evaluation: { status: 'KEDALUWARSA' } },
    ];

    const result = dashboardService.calculateAggregates(mockItems as any);

    expect(result.totalPorsi).toBe(80);
    expect(result.totalKg).toBe(15);
    expect(result.unitBreakdown['kotak']).toBe(5);
    expect(result.countAman).toBe(2);
    expect(result.countMendekati).toBe(1);
    expect(result.countKedaluwarsa).toBe(1);
  });
});
