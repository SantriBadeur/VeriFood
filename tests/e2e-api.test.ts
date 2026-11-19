import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/db';

// Import all API Route Handlers
import * as LoginRoute from '../src/app/api/auth/login/route';
import * as LogoutRoute from '../src/app/api/auth/logout/route';
import * as DonorsRoute from '../src/app/api/donors/route';
import * as DonorIdRoute from '../src/app/api/donors/[id]/route';
import * as BeneficiariesRoute from '../src/app/api/beneficiaries/route';
import * as BeneficiaryIdRoute from '../src/app/api/beneficiaries/[id]/route';
import * as InboundFoodRoute from '../src/app/api/food/inbound/route';
import * as FefoFoodRoute from '../src/app/api/food/fefo/route';
import * as CorrectFoodRoute from '../src/app/api/food/correct/route';
import * as DisposeFoodRoute from '../src/app/api/food/dispose/route';
import * as DistributionsRoute from '../src/app/api/distributions/route';
import * as DistributionStatusRoute from '../src/app/api/distributions/[id]/status/route';
import * as DistributionHistoryRoute from '../src/app/api/distributions/history/[beneficiaryId]/route';
import * as RescuedReportRoute from '../src/app/api/reports/rescued/route';
import * as DonorsReportRoute from '../src/app/api/reports/donors/route';
import * as CsvReportRoute from '../src/app/api/reports/csv/route';
import * as UsersRoute from '../src/app/api/users/route';
import * as AuditRoute from '../src/app/api/audit/route';

describe('SisaBerkah End-to-End API Route Handlers Suite', () => {
  let createdDonorId: string;
  let createdBeneficiaryId: string;
  let createdFoodStockId: string;
  let createdDistributionId: string;
  let authCookie: string;

  // 1. Auth API
  describe('POST /api/auth/login & /api/auth/logout', () => {
    it('should return 400 if email or password missing', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@sisaberkah.org' }),
      });
      const res = await LoginRoute.POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 401 on wrong credentials', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@sisaberkah.org', password: 'wrong' }),
      });
      const res = await LoginRoute.POST(req);
      expect(res.status).toBe(401);
    });

    it('should return 200 and set cookie on successful admin login', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@sisaberkah.org', password: 'admin123' }),
      });
      const res = await LoginRoute.POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.user.role).toBe('ADMIN');
      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toContain('sb_session=');
      authCookie = setCookie?.split(';')[0] || '';
    });

    it('should clear session on POST /api/auth/logout', async () => {
      const res = await LogoutRoute.POST();
      expect(res.status).toBe(200);
      expect(res.headers.get('set-cookie')).toContain('sb_session=');
    });
  });

  // 2. Donors API
  describe('/api/donors CRUD', () => {
    it('POST /api/donors should create a new donor', async () => {
      const req = new Request('http://localhost:3000/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Donatur API Test ${Date.now()}`,
          type: 'RESTORAN',
          contact: '0812345678',
          address: 'Jl. Merdeka No. 1',
        }),
      });
      const res = await DonorsRoute.POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      createdDonorId = json.id;
      expect(createdDonorId).toBeDefined();
    });

    it('GET /api/donors should list donors with pagination', async () => {
      const req = new Request('http://localhost:3000/api/donors?page=1&limit=10');
      const res = await DonorsRoute.GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.total).toBeGreaterThan(0);
    });

    it('PUT /api/donors/[id] should update donor data', async () => {
      const req = new Request(`http://localhost:3000/api/donors/${createdDonorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: '08999999999' }),
      });
      const res = await DonorIdRoute.PUT(req, {
        params: Promise.resolve({ id: createdDonorId }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.contact).toBe('08999999999');
    });

    it('DELETE /api/donors/[id] should soft-delete donor', async () => {
      const req = new Request(`http://localhost:3000/api/donors/${createdDonorId}`, {
        method: 'DELETE',
      });
      const res = await DonorIdRoute.DELETE(req, {
        params: Promise.resolve({ id: createdDonorId }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.isDeleted).toBe(true);
    });
  });

  // 3. Beneficiaries API
  describe('/api/beneficiaries CRUD', () => {
    it('POST /api/beneficiaries should create beneficiary', async () => {
      const req = new Request('http://localhost:3000/api/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Panti Asuhan API Test ${Date.now()}`,
          type: 'PANTI_ASUHAN',
          contact: '08555666777',
          address: 'Jl. Kenanga No. 5',
        }),
      });
      const res = await BeneficiariesRoute.POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      createdBeneficiaryId = json.id;
      expect(createdBeneficiaryId).toBeDefined();
    });

    it('GET /api/beneficiaries should return list with filters', async () => {
      const req = new Request('http://localhost:3000/api/beneficiaries?type=PANTI_ASUHAN');
      const res = await BeneficiariesRoute.GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('PUT /api/beneficiaries/[id] should update beneficiary details', async () => {
      const req = new Request(`http://localhost:3000/api/beneficiaries/${createdBeneficiaryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: '08555000111' }),
      });
      const res = await BeneficiaryIdRoute.PUT(req, {
        params: Promise.resolve({ id: createdBeneficiaryId }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.contact).toBe('08555000111');
    });
  });

  // 4. Food Inbound & FEFO API
  describe('/api/food/*', () => {
    it('POST /api/food/inbound should record inbound food with inspection checklist', async () => {
      const donor = await prisma.donor.findFirst({ where: { isDeleted: false } });
      const req = new Request('http://localhost:3000/api/food/inbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: authCookie,
        },
        body: JSON.stringify({
          donorId: donor!.id,
          name: 'Nasi Kuning Kotak Spesial',
          quantity: 80,
          unit: 'porsi',
          expiryAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          packagingIntact: true,
          temperatureSafe: true,
          visualSmellOk: true,
        }),
      });
      const res = await InboundFoodRoute.POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      createdFoodStockId = json.id;
      expect(json.physicalStatus).toBe('DITERIMA');
      expect(json.remainingQuantity).toBe(80);
    });

    it('GET /api/food/fefo should return inventory items ordered by FEFO', async () => {
      const res = await FefoFoodRoute.GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
    });

    it('POST /api/food/correct should correct stock quantity upward', async () => {
      const req = new Request('http://localhost:3000/api/food/correct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: authCookie,
        },
        body: JSON.stringify({
          stockId: createdFoodStockId,
          newInitialQty: 90,
        }),
      });
      const res = await CorrectFoodRoute.POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.initialQuantity).toBe(90);
      expect(json.remainingQuantity).toBe(90);
    });

    it('POST /api/food/dispose should dispose stock item', async () => {
      const donor = await prisma.donor.findFirst({ where: { isDeleted: false } });
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const tempStock = await prisma.foodStock.create({
        data: {
          donorId: donor!.id,
          name: 'Makanan Uji Buang API',
          initialQuantity: 10,
          remainingQuantity: 10,
          unit: 'kotak',
          expiryAt: new Date(Date.now() + 24 * 3600 * 1000),
          packagingIntact: true,
          temperatureSafe: true,
          visualSmellOk: true,
          physicalStatus: 'DITERIMA',
          createdByUserId: admin!.id,
        },
      });

      const req = new Request('http://localhost:3000/api/food/dispose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: authCookie,
        },
        body: JSON.stringify({
          stockId: tempStock.id,
          reason: 'Dibuang untuk tes API',
        }),
      });
      const res = await DisposeFoodRoute.POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.remainingQuantity).toBe(0);
    });
  });

  // 5. Distributions API
  describe('/api/distributions/*', () => {
    it('POST /api/distributions should create scheduled distribution', async () => {
      const req = new Request('http://localhost:3000/api/distributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: authCookie,
        },
        body: JSON.stringify({
          beneficiaryId: createdBeneficiaryId,
          scheduledDate: new Date().toISOString(),
          items: [{ foodStockId: createdFoodStockId, quantity: 30 }],
        }),
      });
      const res = await DistributionsRoute.POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      createdDistributionId = json.id;
      expect(json.status).toBe('TERJADWAL');
    });

    it('GET /api/distributions should list distributions', async () => {
      const req = new Request('http://localhost:3000/api/distributions?page=1&limit=10', {
        headers: { cookie: authCookie },
      });
      const res = await DistributionsRoute.GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.total).toBeGreaterThan(0);
    });

    it('PATCH /api/distributions/[id]/status should transition to DIKIRIM and DITERIMA', async () => {
      // Step 1: TERJADWAL -> DIKIRIM
      const req1 = new Request(`http://localhost:3000/api/distributions/${createdDistributionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: authCookie,
        },
        body: JSON.stringify({ status: 'DIKIRIM' }),
      });
      const res1 = await DistributionStatusRoute.PATCH(req1, {
        params: Promise.resolve({ id: createdDistributionId }),
      });
      expect(res1.status).toBe(200);
      const json1 = await res1.json();
      expect(json1.status).toBe('DIKIRIM');

      // Step 2: DIKIRIM -> DITERIMA
      const req2 = new Request(`http://localhost:3000/api/distributions/${createdDistributionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: authCookie,
        },
        body: JSON.stringify({ status: 'DITERIMA' }),
      });
      const res2 = await DistributionStatusRoute.PATCH(req2, {
        params: Promise.resolve({ id: createdDistributionId }),
      });
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.status).toBe('DITERIMA');
    });

    it('GET /api/distributions/history/[beneficiaryId] should return beneficiary history', async () => {
      const req = new Request(`http://localhost:3000/api/distributions/history/${createdBeneficiaryId}`);
      const res = await DistributionHistoryRoute.GET(req, {
        params: Promise.resolve({ beneficiaryId: createdBeneficiaryId }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
    });
  });

  // 6. Reports API
  describe('/api/reports/*', () => {
    it('GET /api/reports/rescued should return segregated metric aggregates', async () => {
      const res = await RescuedReportRoute.GET(new Request('http://localhost:3000/api/reports/rescued'));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
    });

    it('GET /api/reports/donors should return transparency metrics', async () => {
      const res = await DonorsReportRoute.GET(new Request('http://localhost:3000/api/reports/donors'));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
    });

    it('GET /api/reports/csv?type=rescued should return RFC-compliant CSV with attachment header', async () => {
      const req = new Request('http://localhost:3000/api/reports/csv?type=rescued');
      const res = await CsvReportRoute.GET(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/csv');
      const text = await res.text();
      expect(text).toContain('Satuan,Total Makanan Terselamatkan');
    });
  });

  // 7. Users & Audit API
  describe('/api/users & /api/audit', () => {
    it('GET /api/users should list all users', async () => {
      const req = new Request('http://localhost:3000/api/users', {
        headers: { cookie: authCookie },
      });
      const res = await UsersRoute.GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThanOrEqual(2);
    });

    it('POST /api/users should create a new user', async () => {
      const testEmail = `user_api_${Date.now()}@sisaberkah.org`;
      const req = new Request('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: authCookie,
        },
        body: JSON.stringify({
          name: 'Relawan Baru API',
          email: testEmail,
          password: 'password123',
          role: 'RELAWAN',
        }),
      });
      const res = await UsersRoute.POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.email).toBe(testEmail);
    });

    it('GET /api/audit should return audit trail log records', async () => {
      const req = new Request('http://localhost:3000/api/audit?page=1&limit=20');
      const res = await AuditRoute.GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.total).toBeGreaterThan(0);
    });
  });
});
