import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getBottomNavItems, isBottomNavActive } from '@/components/layout/bottom-nav';

describe('Bottom Navigation Bar for Mobile POV (Gojek/Tokopedia style)', () => {
  it('returns appropriate items based on role', () => {
    const relawanItems = getBottomNavItems('RELAWAN');
    expect(relawanItems.length).toBe(4);
    expect(relawanItems.map((i) => i.href)).toEqual([
      '/dashboard',
      '/makanan/masuk',
      '/distribusi',
      '/donatur',
    ]);

    const adminItems = getBottomNavItems('ADMIN');
    expect(adminItems.length).toBe(5);
    expect(adminItems.map((i) => i.href)).toEqual([
      '/dashboard',
      '/makanan/masuk',
      '/distribusi',
      '/donatur',
      '/laporan',
    ]);
  });

  it('correctly matches active pathname for bottom tabs', () => {
    expect(isBottomNavActive('/dashboard', '/dashboard')).toBe(true);
    expect(isBottomNavActive('/makanan/masuk', '/makanan/kelola')).toBe(true);
    expect(isBottomNavActive('/makanan/masuk', '/makanan/masuk')).toBe(true);
    expect(isBottomNavActive('/distribusi', '/distribusi/buat')).toBe(true);
    expect(isBottomNavActive('/donatur', '/penerima')).toBe(true);
    expect(isBottomNavActive('/donatur', '/donatur')).toBe(true);
    expect(isBottomNavActive('/laporan', '/laporan/cetak')).toBe(true);
    expect(isBottomNavActive('/dashboard', '/distribusi')).toBe(false);
  });

  it('verifies DashboardLayout integrates BottomNav component with mobile-safe padding', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/(dashboard)/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');

    expect(content).toContain('BottomNav');
    expect(content).toContain('pb-24');
  });

  it('verifies TopHeader has click-outside/backdrop to close notification popup on scroll/touch', () => {
    const headerPath = path.join(process.cwd(), 'src/components/layout/top-header.tsx');
    const content = fs.readFileSync(headerPath, 'utf-8');

    // Should have backdrop or click-outside handler to close bell dropdown
    expect(content).toContain('setIsBellOpen(false)');
    expect(content).toMatch(/fixed\s+inset-0.*setIsBellOpen\(false\)/s);
  });
});
