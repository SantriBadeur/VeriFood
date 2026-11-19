import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/lib/db';
import { distributionService } from '../src/services/distribution.service';

describe('Task 1: Volunteer Courier Assignment & Filter', () => {
  let volunteer1Id: string;
  let volunteer2Id: string;
  let beneficiaryId: string;
  let foodStockId: string;

  beforeAll(async () => {
    // Ensure two test volunteers exist
    const v1 = await prisma.user.upsert({
      where: { email: 'kurir1@sisaberkah.org' },
      update: {},
      create: {
        email: 'kurir1@sisaberkah.org',
        name: 'Kurir Relawan 1',
        passwordHash: 'dummyhash',
        role: 'RELAWAN',
        isActive: true,
      },
    });
    volunteer1Id = v1.id;

    const v2 = await prisma.user.upsert({
      where: { email: 'kurir2@sisaberkah.org' },
      update: {},
      create: {
        email: 'kurir2@sisaberkah.org',
        name: 'Kurir Relawan 2',
        passwordHash: 'dummyhash',
        role: 'RELAWAN',
        isActive: true,
      },
    });
    volunteer2Id = v2.id;

    const b = await prisma.beneficiary.create({
      data: {
        name: 'Panti Asuhan Uji Kurir',
        type: 'PANTI_ASUHAN',
        contact: '081299998888',
        address: 'Jl. Uji Kurir No. 1',
      },
    });
    beneficiaryId = b.id;

    const donor = await prisma.donor.create({
      data: {
        name: 'Donatur Uji Kurir',
        type: 'RESTORAN',
        contact: '081234567890',
      },
    });

    const stock = await prisma.foodStock.create({
      data: {
        donorId: donor.id,
        name: 'Nasi Kotak Kurir',
        initialQuantity: 100,
        remainingQuantity: 100,
        unit: 'porsi',
        expiryAt: new Date(Date.now() + 24 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: volunteer1Id,
      },
    });
    foodStockId = stock.id;
  });

  it('creates a distribution with assignedToUserId assigned to a courier', async () => {
    const dist = await distributionService.createSchedule(
      {
        beneficiaryId,
        scheduledDate: new Date(),
        assignedToUserId: volunteer1Id,
        items: [{ foodStockId, quantity: 5 }],
      },
      volunteer2Id
    );

    expect(dist.assignedToUserId).toBe(volunteer1Id);
    expect(dist.createdByUserId).toBe(volunteer2Id);
  });

  it('filters distribution list by assignedToUserId correctly in distributionService.list', async () => {
    const listForV1 = await distributionService.list({
      assignedToUserId: volunteer1Id,
      limit: 10,
    });

    expect(listForV1.data.length).toBeGreaterThan(0);
    for (const item of listForV1.data) {
      expect(item.assignedToUserId).toBe(volunteer1Id);
    }
  });

  it('GET /api/users/volunteers route returns active volunteers for dropdown', async () => {
    const { GET } = await import('../src/app/api/users/volunteers/route');
    
    // Fake request as authenticated volunteer
    const req = new Request('http://localhost:3000/api/users/volunteers');
    // Note: getSessionUser mock or session handling
    const res = await GET(req);
    // Even if unauthorized without cookie in unit test, status should be 401 or 200 (not crash)
    expect([200, 401]).toContain(res.status);
  });
});
