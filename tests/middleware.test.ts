import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';
import { createSessionToken } from '../src/lib/auth';

function createMockRequest(pathname: string, token?: string) {
  const url = `http://localhost:3000${pathname}`;
  const req = new NextRequest(url);
  if (token) {
    req.cookies.set('sb_session', token);
  }
  return req;
}

describe('Task 2: Next.js Security Middleware', () => {
  const adminToken = createSessionToken({
    id: 'admin_1',
    email: 'admin@sisaberkah.org',
    name: 'Admin',
    role: 'ADMIN',
  });

  const relawanToken = createSessionToken({
    id: 'relawan_1',
    email: 'relawan@sisaberkah.org',
    name: 'Relawan',
    role: 'RELAWAN',
  });

  describe('Unauthenticated Visitors', () => {
    it('should allow access to public routes (/login, /register, /)', async () => {
      const resLogin = await middleware(createMockRequest('/login'));
      expect(resLogin.headers.get('location')).toBeNull();

      const resHome = await middleware(createMockRequest('/'));
      expect(resHome.headers.get('location')).toBeNull();

      const resRegister = await middleware(createMockRequest('/register'));
      expect(resRegister.headers.get('location')).toBeNull();
    });

    it('should redirect unauthenticated users to /login when accessing protected pages', async () => {
      const resDashboard = await middleware(createMockRequest('/dashboard'));
      expect(resDashboard.headers.get('location')).toContain('/login');

      const resPengguna = await middleware(createMockRequest('/pengguna'));
      expect(resPengguna.headers.get('location')).toContain('/login');

      const resMakananKelola = await middleware(createMockRequest('/makanan/kelola'));
      expect(resMakananKelola.headers.get('location')).toContain('/login');

      const resLaporan = await middleware(createMockRequest('/laporan'));
      expect(resLaporan.headers.get('location')).toContain('/login');
    });
  });

  describe('Authenticated Relawan', () => {
    it('should allow relawan to access permitted dashboard routes (/dashboard, /makanan/masuk, /distribusi)', async () => {
      const resDashboard = await middleware(createMockRequest('/dashboard', relawanToken));
      expect(resDashboard.headers.get('location')).toBeNull();

      const resMakananMasuk = await middleware(createMockRequest('/makanan/masuk', relawanToken));
      expect(resMakananMasuk.headers.get('location')).toBeNull();

      const resDistribusi = await middleware(createMockRequest('/distribusi', relawanToken));
      expect(resDistribusi.headers.get('location')).toBeNull();
    });

    it('should BLOCK relawan and redirect to /dashboard when accessing admin-only routes', async () => {
      // /pengguna
      const resPengguna = await middleware(createMockRequest('/pengguna', relawanToken));
      expect(resPengguna.headers.get('location')).toContain('/dashboard');

      // /makanan/kelola
      const resMakananKelola = await middleware(createMockRequest('/makanan/kelola', relawanToken));
      expect(resMakananKelola.headers.get('location')).toContain('/dashboard');

      // /laporan
      const resLaporan = await middleware(createMockRequest('/laporan', relawanToken));
      expect(resLaporan.headers.get('location')).toContain('/dashboard');
    });
  });

  describe('Authenticated Admin', () => {
    it('should allow admin to access all admin-only routes (/pengguna, /makanan/kelola, /laporan)', async () => {
      const resPengguna = await middleware(createMockRequest('/pengguna', adminToken));
      expect(resPengguna.headers.get('location')).toBeNull();

      const resMakananKelola = await middleware(createMockRequest('/makanan/kelola', adminToken));
      expect(resMakananKelola.headers.get('location')).toBeNull();

      const resLaporan = await middleware(createMockRequest('/laporan', adminToken));
      expect(resLaporan.headers.get('location')).toBeNull();
    });
  });

  describe('Logged-in Redirect from Auth Pages', () => {
    it('should redirect logged-in user away from /login to /dashboard', async () => {
      const res = await middleware(createMockRequest('/login', relawanToken));
      expect(res.headers.get('location')).toContain('/dashboard');
    });
  });
});
