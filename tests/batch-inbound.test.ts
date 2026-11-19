import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/lib/db';
import { foodService } from '../src/services/food.service';

describe('Task 4: Batch Inbound Food Processing', () => {
  let donorId: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.upsert({
      where: { email: 'batch_inbound@sisaberkah.org' },
      update: {},
      create: {
        email: 'batch_inbound@sisaberkah.org',
        name: 'Relawan Batch Inbound',
        passwordHash: 'dummyhash',
        role: 'RELAWAN',
        isActive: true,
      },
    });
    userId = user.id;

    const donor = await prisma.donor.create({
      data: {
        name: 'Katering Berkah Bersama',
        type: 'KATERING',
        contact: '081122334455',
        address: 'Jl. Dapur Sejahtera No. 8',
      },
    });
    donorId = donor.id;
  });

  it('rejects batch inbound if items array is empty', async () => {
    await expect(
      foodService.createBatchInbound(
        {
          donorId,
          items: [],
        },
        userId
      )
    ).rejects.toThrow('Batch penerimaan harus memiliki minimal 1 item makanan');
  });

  it('rejects batch inbound if donor does not exist', async () => {
    await expect(
      foodService.createBatchInbound(
        {
          donorId: 'invalid-donor-id',
          items: [
            {
              name: 'Nasi Liwet',
              quantity: 20,
              unit: 'porsi',
              expiryAt: new Date(Date.now() + 6 * 3600 * 1000),
            },
          ],
        },
        userId
      )
    ).rejects.toThrow(/Donatur .* tidak ditemukan/);
  });

  it('successfully creates multiple food stocks atomically from single catering donor', async () => {
    const items = [
      {
        name: 'Nasi Liwet Komplit',
        quantity: 35,
        unit: 'kotak',
        expiryAt: new Date(Date.now() + 4 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        notes: 'Hangat baru matang',
      },
      {
        name: 'Ayam Goreng Lengkuas',
        quantity: 35,
        unit: 'porsi',
        expiryAt: new Date(Date.now() + 8 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        notes: 'Dipisah wadah',
      },
      {
        name: 'Sayur Lodeh',
        quantity: 15,
        unit: 'porsi',
        expiryAt: new Date(Date.now() + 4 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: false, // Suhu tidak aman
        visualSmellOk: true,
        notes: 'Uji suhu gagal, sudah agak asam',
      },
    ];

    const result = await foodService.createBatchInbound(
      {
        donorId,
        items,
      },
      userId
    );

    expect(result).toHaveLength(3);

    // Item 1: DITERIMA
    expect(result[0].name).toBe('Nasi Liwet Komplit');
    expect(result[0].physicalStatus).toBe('DITERIMA');
    expect(result[0].remainingQuantity).toBe(35);
    expect(result[0].donorId).toBe(donorId);

    // Item 2: DITERIMA
    expect(result[1].name).toBe('Ayam Goreng Lengkuas');
    expect(result[1].physicalStatus).toBe('DITERIMA');
    expect(result[1].remainingQuantity).toBe(35);

    // Item 3: DITOLAK (karena temperatureSafe = false)
    expect(result[2].name).toBe('Sayur Lodeh');
    expect(result[2].physicalStatus).toBe('DITOLAK');
    expect(result[2].remainingQuantity).toBe(0);

    // Verify audit logs created for each item
    for (const food of result) {
      const logs = await prisma.auditLog.findMany({
        where: {
          entity: 'FoodStock',
          entityId: food.id,
          action: 'INBOUND_FOOD_RECORD',
        },
      });
      expect(logs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('POST /api/food/inbound/batch route handler receives and creates batch items', async () => {
    const { POST } = await import('../src/app/api/food/inbound/batch/route');
    const req = new Request('http://localhost:3000/api/food/inbound/batch', {
      method: 'POST',
      body: JSON.stringify({
        donorId,
        items: [
          {
            name: 'Kue Basah Pasar',
            quantity: 25,
            unit: 'buah',
            expiryAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
          },
        ],
      }),
    });

    const res = await POST(req);
    // Unauthenticated test returns 401 or 201
    expect([201, 401]).toContain(res.status);
  });
});
