import { describe, it, expect } from 'vitest';
import { getHeaderTabs, isTabActive } from '@/components/layout/top-header';

describe('Top Header Capsule Tabs & RBAC', () => {
  it('returns all 6 capsule tabs for ADMIN role', () => {
    const tabs = getHeaderTabs('ADMIN');
    expect(tabs.length).toBe(6);
    expect(tabs.map((t) => t.label)).toEqual([
      'Ringkasan',
      'Pangan Masuk',
      'Kelola Stok',
      'Distribusi',
      'Data Master',
      'Laporan',
    ]);
  });

  it('filters out adminOnly tabs for RELAWAN role', () => {
    const tabs = getHeaderTabs('RELAWAN');
    expect(tabs.length).toBe(4);
    expect(tabs.map((t) => t.label)).toEqual([
      'Ringkasan',
      'Pangan Masuk',
      'Distribusi',
      'Data Master',
    ]);
    expect(tabs.some((t) => t.label === 'Kelola Stok')).toBe(false);
    expect(tabs.some((t) => t.label === 'Laporan')).toBe(false);
  });

  it('correctly matches active paths including nested sub-routes', () => {
    expect(isTabActive('/dashboard', '/dashboard')).toBe(true);
    expect(isTabActive('/makanan/masuk', '/makanan/masuk')).toBe(true);
    expect(isTabActive('/distribusi', '/distribusi/buat')).toBe(true);
    expect(isTabActive('/distribusi', '/distribusi/riwayat/123')).toBe(true);
    expect(isTabActive('/donatur', '/penerima')).toBe(true);
    expect(isTabActive('/donatur', '/donatur')).toBe(true);
    expect(isTabActive('/dashboard', '/distribusi')).toBe(false);
  });

  it('verifies mobile 360px responsiveness in TopHeader markup', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'src/components/layout/top-header.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // User profile chip hides text on mobile < sm to prevent overflow on 360px
    expect(content).toContain('hidden sm:flex flex-col');

    // Bell notification dropdown uses responsive width safe for 360px
    expect(content).toMatch(/w-\[calc\(100vw-.*\)\]/);

    // Bell notification dropdown is centered on mobile to prevent left-side text clipping
    expect(content).toContain('fixed top-16 left-1/2 -translate-x-1/2');

    // Contains accessible close button and backdrop
    expect(content).toContain('aria-label="Tutup Notifikasi"');
    expect(content).toContain('setIsBellOpen(false)');

    // Closes on route change and keeps desktop backdrop non-obtrusive
    expect(content).toContain('sm:bg-transparent');
    expect(content).toMatch(/useEffect\(\(\)\s*=>\s*\{\s*setIsBellOpen\(false\);\s*\}\s*,\s*\[pathname\]\);/);
  });
});
