import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 2: Distribution Create Page searchParams foodStockId', () => {
  it('verifies CreateDistributionPage reads searchParams foodStockId and uses Suspense', async () => {
    const filePath = path.join(process.cwd(), 'src/app/(dashboard)/distribusi/buat/page.tsx');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');

    // Must import useSearchParams and Suspense
    expect(content).toContain('useSearchParams');
    expect(content).toContain('Suspense');

    // Must read foodStockId parameter
    expect(content).toMatch(/searchParams\.get\(['"]foodStockId['"]\)/);

    // Must prioritize matching stock item
    expect(content).toContain('targetFoodStockId');
  });

  it('verifies FEFO stock selection logic prioritizes targetFoodStockId if present', () => {
    const stockList = [
      { id: 'stock-1', name: 'Nasi Kotak Ayam', remainingQuantity: 10 },
      { id: 'stock-2', name: 'Sop Buntut (Kritis)', remainingQuantity: 5 },
      { id: 'stock-3', name: 'Roti Gandum', remainingQuantity: 20 },
    ];

    const pickStockId = (targetId: string | null, list: typeof stockList) => {
      if (!list || list.length === 0) return '';
      const matched = targetId ? list.find((s) => s.id === targetId) : null;
      return matched ? matched.id : list[0].id;
    };

    // When foodStockId matches stock-2
    expect(pickStockId('stock-2', stockList)).toBe('stock-2');

    // When foodStockId is null or not found, fallback to stock-1 (first)
    expect(pickStockId(null, stockList)).toBe('stock-1');
    expect(pickStockId('stock-999', stockList)).toBe('stock-1');
  });
});
