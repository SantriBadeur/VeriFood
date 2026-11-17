import { describe, it, expect } from 'vitest';

describe('Bento Widgets Module Imports', () => {
  it('imports HeroMetricCard cleanly', async () => {
    const mod = await import('@/components/dashboard/hero-metric-card');
    expect(mod.HeroMetricCard).toBeDefined();
  });

  it('imports BentoStatCard cleanly', async () => {
    const mod = await import('@/components/dashboard/bento-stat-card');
    expect(mod.BentoStatCard).toBeDefined();
  });

  it('imports AnalyticBarChart cleanly', async () => {
    const mod = await import('@/components/dashboard/analytic-bar-chart');
    expect(mod.AnalyticBarChart).toBeDefined();
  });

  it('imports RecentActivityCard cleanly', async () => {
    const mod = await import('@/components/dashboard/recent-activity-card');
    expect(mod.RecentActivityCard).toBeDefined();
  });
});
