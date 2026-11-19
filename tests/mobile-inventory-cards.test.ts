import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 1: Mobile Card Stack for Food Inventory Management (/makanan/kelola)', () => {
  it('imports StockManagePage cleanly', async () => {
    const pageModule = await import('../src/app/(dashboard)/makanan/kelola/page');
    expect(pageModule.default).toBeDefined();
  });

  it('verifies responsive table hiding and mobile card stack container', () => {
    const filePath = path.join(process.cwd(), 'src/app/(dashboard)/makanan/kelola/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Desktop table should be hidden on mobile (< 768px)
    expect(content).toMatch(/hidden\s+md:(table|block)/);
    // Mobile cards container should be visible on mobile and hidden on desktop (>= 768px)
    expect(content).toContain('block md:hidden');
  });

  it('verifies mobile card stack contains all 4 key action triggers for mobile users', () => {
    const filePath = path.join(process.cwd(), 'src/app/(dashboard)/makanan/kelola/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract the mobile card stack section (between block md:hidden and hidden md:block)
    const mobileSectionIndex = content.indexOf('block md:hidden');
    expect(mobileSectionIndex).toBeGreaterThan(-1);

    const desktopSectionIndex = content.indexOf('hidden md:block');
    expect(desktopSectionIndex).toBeGreaterThan(mobileSectionIndex);

    const mobileSection = content.substring(mobileSectionIndex, desktopSectionIndex);

    // Must have all 4 action buttons within the mobile view
    expect(mobileSection).toContain('Cetak Label');
    expect(mobileSection).toContain('Edit Info');
    expect(mobileSection).toContain('Koreksi');
    expect(mobileSection).toContain('Buang');

    // Must display critical inventory info in mobile card
    expect(mobileSection).toContain('Sisa Stok');
    expect(mobileSection).toContain('evaluation.label');
  });
});
