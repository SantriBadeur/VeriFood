import { describe, it, expect } from 'vitest';

describe('UI Route Verification', () => {
  it('should define all critical view components', async () => {
    const DashboardPage = await import('../src/app/(dashboard)/dashboard/page');
    expect(DashboardPage.default).toBeDefined();

    const InboundPage = await import('../src/app/(dashboard)/makanan/masuk/page');
    expect(InboundPage.default).toBeDefined();

    const DistributePage = await import('../src/app/(dashboard)/distribusi/buat/page');
    expect(DistributePage.default).toBeDefined();
  });
});

