import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/db';
import { createSessionToken } from '../src/lib/auth';
import * as UsersRoute from '../src/app/api/users/route';

describe('Task 5: /api/users Endpoint RBAC Lockdown', () => {
  let adminToken: string;
  let relawanToken: string;
  let targetUser: any;

  it('Setup test tokens and user', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    expect(admin).toBeDefined();

    let relawan = await prisma.user.findFirst({ where: { role: 'RELAWAN' } });
    if (!relawan) {
      relawan = await prisma.user.create({
        data: {
          email: `relawan_lock_${Date.now()}@test.org`,
          name: 'Relawan Lock Test',
          passwordHash: 'dummyhash',
          role: 'RELAWAN',
        },
      });
    }

    targetUser = relawan;

    adminToken = createSessionToken({
      id: admin!.id,
      email: admin!.email,
      name: admin!.name,
      role: admin!.role,
    });

    relawanToken = createSessionToken({
      id: relawan!.id,
      email: relawan!.email,
      name: relawan!.name,
      role: relawan!.role,
    });
  });

  describe('GET /api/users', () => {
    it('should reject unauthenticated request with 401', async () => {
      const req = new Request('http://localhost:3000/api/users');
      const res = await UsersRoute.GET(req);
      expect(res.status).toBe(401);
    });

    it('should reject non-admin (RELAWAN) request with 403', async () => {
      const req = new Request('http://localhost:3000/api/users', {
        headers: { cookie: `sb_session=${relawanToken}` },
      });
      const res = await UsersRoute.GET(req);
      expect(res.status).toBe(403);
    });

    it('should allow ADMIN request with 200', async () => {
      const req = new Request('http://localhost:3000/api/users', {
        headers: { cookie: `sb_session=${adminToken}` },
      });
      const res = await UsersRoute.GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
    });
  });

  describe('POST /api/users', () => {
    it('should reject unauthenticated user creation with 401', async () => {
      const req = new Request('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Unauthorized User',
          email: `anon_${Date.now()}@test.org`,
          password: 'password123',
          role: 'ADMIN',
        }),
      });
      const res = await UsersRoute.POST(req);
      expect(res.status).toBe(401);
    });

    it('should reject non-admin (RELAWAN) creating admin/user with 403', async () => {
      const req = new Request('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sb_session=${relawanToken}`,
        },
        body: JSON.stringify({
          name: 'Rogue Admin',
          email: `rogue_${Date.now()}@test.org`,
          password: 'password123',
          role: 'ADMIN',
        }),
      });
      const res = await UsersRoute.POST(req);
      expect(res.status).toBe(403);
    });

    it('should allow ADMIN to create user with 201', async () => {
      const email = `legit_user_${Date.now()}@test.org`;
      const req = new Request('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sb_session=${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Legit User',
          email,
          password: 'password123',
          role: 'RELAWAN',
        }),
      });
      const res = await UsersRoute.POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.email).toBe(email);
    });
  });

  describe('PATCH /api/users', () => {
    it('should reject unauthenticated user toggle with 401', async () => {
      const req = new Request('http://localhost:3000/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUser.id,
          isActive: false,
        }),
      });
      const res = await UsersRoute.PATCH(req);
      expect(res.status).toBe(401);
    });

    it('should reject non-admin (RELAWAN) user toggle with 403', async () => {
      const req = new Request('http://localhost:3000/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sb_session=${relawanToken}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          isActive: false,
        }),
      });
      const res = await UsersRoute.PATCH(req);
      expect(res.status).toBe(403);
    });

    it('should allow ADMIN to toggle user active status with 200', async () => {
      const req = new Request('http://localhost:3000/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sb_session=${adminToken}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          isActive: true,
        }),
      });
      const res = await UsersRoute.PATCH(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe(targetUser.id);
    });
  });
});
