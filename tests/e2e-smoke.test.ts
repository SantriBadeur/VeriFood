import { describe, it, expect } from 'vitest';

describe('UI Route Verification', () => {
  it('should define all critical view components', async () => {
    const DashboardPage = await import('../src/app/(dashboard)/dashboard/page');
    expect(DashboardPage.default).toBeDefined();

    const InboundPage = await import('../src/app/(dashboard)/makanan/masuk/page');
    expect(InboundPage.default).toBeDefined();

    const DistributePage = await import('../src/app/(dashboard)/distribusi/buat/page');
    expect(DistributePage.default).toBeDefined();

    const LoginPage = await import('../src/app/(auth)/login/page');
    expect(LoginPage.default).toBeDefined();

    const DashboardLayout = await import('../src/app/(dashboard)/layout');
    expect(DashboardLayout.default).toBeDefined();

    const DonorsPage = await import('../src/app/(dashboard)/donatur/page');
    expect(DonorsPage.default).toBeDefined();

    const BeneficiariesPage = await import('../src/app/(dashboard)/penerima/page');
    expect(BeneficiariesPage.default).toBeDefined();

    const AuthMeRoute = await import('../src/app/api/auth/me/route');
    expect(AuthMeRoute.GET).toBeDefined();
  });
});

