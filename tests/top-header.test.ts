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
});
