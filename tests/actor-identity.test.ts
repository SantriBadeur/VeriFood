import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/db';
import { createSessionToken } from '../src/lib/auth';
import * as InboundFoodRoute from '../src/app/api/food/inbound/route';
import * as DistributionsRoute from '../src/app/api/distributions/route';
import * as DistributionStatusRoute from '../src/app/api/distributions/[id]/status/route';
import * as CorrectFoodRoute from '../src/app/api/food/correct/route';
import * as DisposeFoodRoute from '../src/app/api/food/dispose/route';

describe('Task 4: Actor Identity & Hardcoded Admin ID Removal', () => {
  let donor: any;
  let adminUser: any;
  let relawanUser: any;
  let adminToken: string;
  let relawanToken: string;

  it('Setup test actors in database', async () => {
    adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    expect(adminUser).toBeDefined();

    relawanUser = await prisma.user.findFirst({ where: { role: 'RELAWAN' } });
    if (!relawanUser) {
      relawanUser = await prisma.user.create({
        data: {
          email: `relawan_${Date.now()}@test.org`,
          name: 'Relawan Penolong',
          passwordHash: 'dummyhash',
          role: 'RELAWAN',
        },
      });
    }

    donor = await prisma.donor.findFirst({ where: { isDeleted: false } });
    expect(donor).toBeDefined();

    adminToken = createSessionToken({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    });

    relawanToken = createSessionToken({
      id: relawanUser.id,
      email: relawanUser.email,
      name: relawanUser.name,
      role: relawanUser.role,
    });
  });

  describe('POST /api/food/inbound', () => {
    it('should reject unauthenticated request with 401', async () => {
      const req = new Request('http://localhost:3000/api/food/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId: donor.id,
          name: 'Makanan Tanpa Auth',
          quantity: 10,
          unit: 'porsi',
          expiryAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          packagingIntact: true,
          temperatureSafe: true,
          visualSmellOk: true,
        }),
      });

      const res = await InboundFoodRoute.POST(req);
      expect(res.status).toBe(401);
    });

    it('should attribute inbound food to the REAL logged-in RELAWAN user, NOT admin', async () => {
      const req = new Request('http://localhost:3000/api/food/inbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sb_session=${relawanToken}`,
        },
        body: JSON.stringify({
          donorId: donor.id,
          name: 'Makanan Catatan Relawan Asli',
          quantity: 25,
          unit: 'kotak',
          expiryAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          packagingIntact: true,
          temperatureSafe: true,
          visualSmellOk: true,
        }),
      });

      const res = await InboundFoodRoute.POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBeDefined();

      // Verify in DB that createdByUserId is the Relawan, NOT Admin!
      const dbRecord = await prisma.foodStock.findUnique({ where: { id: json.id } });
      expect(dbRecord?.createdByUserId).toBe(relawanUser.id);
      expect(dbRecord?.createdByUserId).not.toBe(adminUser.id);
    });
  });

  describe('POST /api/distributions', () => {
    it('should reject unauthenticated request with 401', async () => {
      const ben = await prisma.beneficiary.findFirst({ where: { isDeleted: false } });
      const req = new Request('http://localhost:3000/api/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: ben!.id,
          scheduledDate: new Date().toISOString(),
          items: [],
        }),
      });

      const res = await DistributionsRoute.POST(req);
      expect(res.status).toBe(401);
    });

    it('should record the REAL logged-in user in distribution schedule creation', async () => {
      const ben = await prisma.beneficiary.findFirst({ where: { isDeleted: false } });
      const food = await prisma.foodStock.findFirst({
        where: {
          remainingQuantity: { gt: 5 },
          physicalStatus: 'DITERIMA',
          expiryAt: { gt: new Date() },
        },
      });

      const req = new Request('http://localhost:3000/api/distributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sb_session=${relawanToken}`,
        },
        body: JSON.stringify({
          beneficiaryId: ben!.id,
          scheduledDate: new Date().toISOString(),
          items: [{ foodStockId: food!.id, quantity: 1 }],
        }),
      });

      const res = await DistributionsRoute.POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();

      const dbDist = await prisma.distribution.findUnique({ where: { id: json.id } });
      expect(dbDist?.createdByUserId).toBe(relawanUser.id);
    });
  });

  describe('PATCH /api/distributions/[id]/status', () => {
    it('should reject unauthenticated status update with 401', async () => {
      const dist = await prisma.distribution.findFirst({ where: { status: 'TERJADWAL' } });
      const req = new Request(`http://localhost:3000/api/distributions/${dist!.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DIKIRIM' }),
      });

      const res = await DistributionStatusRoute.PATCH(req, {
        params: Promise.resolve({ id: dist!.id }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/food/correct', () => {
    it('should reject unauthenticated correction with 401', async () => {
      const food = await prisma.foodStock.findFirst();
      const req = new Request('http://localhost:3000/api/food/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockId: food!.id, newInitialQty: 50 }),
      });

      const res = await CorrectFoodRoute.POST(req);
      expect(res.status).toBe(401);
    });

    it('should reject non-admin (RELAWAN) stock correction with 403', async () => {
      const food = await prisma.foodStock.findFirst();
      const req = new Request('http://localhost:3000/api/food/correct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sb_session=${relawanToken}`,
        },
        body: JSON.stringify({ stockId: food!.id, newInitialQty: 50 }),
      });

      const res = await CorrectFoodRoute.POST(req);
      expect(res.status).toBe(403);
    });
  });
});
