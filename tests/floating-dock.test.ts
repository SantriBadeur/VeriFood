import { describe, it, expect } from 'vitest';
import { getDockNavItems } from '@/components/layout/floating-dock';

describe('Floating Dock Navigation & RBAC', () => {
  it('returns all navigation items for ADMIN role', () => {
    const items = getDockNavItems('ADMIN');
    expect(items.length).toBe(6);
    expect(items.map((i) => i.href)).toEqual([
      '/dashboard',
      '/makanan/masuk',
      '/distribusi',
      '/donatur',
      '/pengguna',
      '/laporan',
    ]);
  });

  it('filters out adminOnly items for RELAWAN role', () => {
    const items = getDockNavItems('RELAWAN');
    expect(items.length).toBe(4);
    expect(items.map((i) => i.href)).toEqual([
      '/dashboard',
      '/makanan/masuk',
      '/distribusi',
      '/donatur',
    ]);
    expect(items.some((i) => i.href === '/pengguna')).toBe(false);
    expect(items.some((i) => i.href === '/laporan')).toBe(false);
  });

  it('defaults to safe filtered items when no role is provided', () => {
    const items = getDockNavItems(undefined);
    expect(items.length).toBe(4);
  });
});
