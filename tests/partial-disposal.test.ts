import { describe, it, expect } from 'vitest';
import { foodService } from '../src/services/food.service';
import { prisma } from '../src/lib/db';
import { createSessionToken } from '../src/lib/auth';
import * as DisposeRoute from '../src/app/api/food/dispose/route';

describe('Partial Food Stock Disposal (Prioritas 3)', () => {
  it('should support partial disposal, retaining remaining stock and active status', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const donor = await prisma.donor.findFirst();

    if (!admin || !donor) throw new Error('Missing seed user or donor');

    // Create a fresh batch with 50 items
    const stock = await prisma.foodStock.create({
      data: {
        donorId: donor.id,
        name: 'Nasi Kotak Ayam Geprek Partial Test',
        initialQuantity: 50,
        remainingQuantity: 50,
        unit: 'porsi',
        expiryAt: new Date(Date.now() + 24 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin.id,
      },
    });

    // 1. Dispose partial amount (10 porsi damaged)
    const partialResult = await foodService.disposeStock(
      stock.id,
      '10 porsi basi terkena air hujan',
      admin.id,
      10
    );

    expect(partialResult.remainingQuantity).toBe(40);
    expect(partialResult.isDisposed).toBe(false);

    // Verify FEFO dashboard still includes this item because remaining > 0 and isDisposed is false
    const fefoList = await foodService.getFEFODashboard();
    const itemInFefo = fefoList.find((f) => f.id === stock.id);
    expect(itemInFefo).toBeDefined();
    expect(itemInFefo?.remainingQuantity).toBe(40);

    // Verify audit log has the disposal details
    const audit = await prisma.auditLog.findFirst({
      where: {
        entityId: stock.id,
        action: 'STOCK_DISPOSAL',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeDefined();
    const details = JSON.parse(audit!.details);
    expect(details.previousRemaining).toBe(50);
    expect(details.disposedQuantity).toBe(10);
    expect(details.newRemaining).toBe(40);

    // 2. Dispose remaining 40 porsi
    const fullResult = await foodService.disposeStock(
      stock.id,
      'Sisa 40 porsi kedaluwarsa',
      admin.id,
      40
    );

    expect(fullResult.remainingQuantity).toBe(0);
    expect(fullResult.isDisposed).toBe(true);
    expect(fullResult.disposedAt).toBeDefined();

    // Verify item is now excluded from FEFO
    const fefoListAfter = await foodService.getFEFODashboard();
    const itemInFefoAfter = fefoListAfter.find((f) => f.id === stock.id);
    expect(itemInFefoAfter).toBeUndefined();
  });

  it('should reject disposal when quantity <= 0 or exceeds remaining quantity', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const donor = await prisma.donor.findFirst();

    const stock = await prisma.foodStock.create({
      data: {
        donorId: donor!.id,
        name: 'Roti Gandum Validasi Test',
        initialQuantity: 20,
        remainingQuantity: 15,
        unit: 'buah',
        expiryAt: new Date(Date.now() + 48 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin!.id,
      },
    });

    // Quantity <= 0
    await expect(
      foodService.disposeStock(stock.id, 'Test invalid', admin!.id, 0)
    ).rejects.toThrow('Jumlah yang dibuang harus lebih dari 0');

    await expect(
      foodService.disposeStock(stock.id, 'Test invalid negative', admin!.id, -5)
    ).rejects.toThrow('Jumlah yang dibuang harus lebih dari 0');

    // Quantity > remainingQuantity
    await expect(
      foodService.disposeStock(stock.id, 'Test exceeds', admin!.id, 25)
    ).rejects.toThrow('Jumlah yang dibuang tidak boleh melebihi sisa stok');
  });

  it('should default to full disposal if quantity is omitted (backward compatibility)', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const donor = await prisma.donor.findFirst();

    const stock = await prisma.foodStock.create({
      data: {
        donorId: donor!.id,
        name: 'Sayur Bayam Backward Compat Test',
        initialQuantity: 12,
        remainingQuantity: 12,
        unit: 'ikat',
        expiryAt: new Date(Date.now() + 12 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin!.id,
      },
    });

    const result = await foodService.disposeStock(stock.id, 'Semua layu', admin!.id);
    expect(result.remainingQuantity).toBe(0);
    expect(result.isDisposed).toBe(true);
  });

  describe('POST /api/food/dispose route handler', () => {
    it('should handle partial disposal via HTTP request body with quantity', async () => {
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const donor = await prisma.donor.findFirst();

      const stock = await prisma.foodStock.create({
        data: {
          donorId: donor!.id,
          name: 'Nasi Kuning Kotak API Test',
          initialQuantity: 30,
          remainingQuantity: 30,
          unit: 'kotak',
          expiryAt: new Date(Date.now() + 24 * 3600 * 1000),
          packagingIntact: true,
          temperatureSafe: true,
          visualSmellOk: true,
          physicalStatus: 'DITERIMA',
          createdByUserId: admin!.id,
        },
      });

      const token = createSessionToken({
        id: admin!.id,
        email: admin!.email,
        name: admin!.name,
        role: admin!.role,
      });

      // Partial dispose 5 portions
      const req = new Request('http://localhost:3000/api/food/dispose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sb_session=${token}`,
        },
        body: JSON.stringify({
          stockId: stock.id,
          reason: '5 kotak rusak kemasan bocor',
          quantity: 5,
        }),
      });

      const res = await DisposeRoute.POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.remainingQuantity).toBe(25);
      expect(data.isDisposed).toBe(false);
    });

    it('should return 400 when quantity exceeds remaining stock in HTTP route', async () => {
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const donor = await prisma.donor.findFirst();

      const stock = await prisma.foodStock.create({
        data: {
          donorId: donor!.id,
          name: 'Kue Lapis API Validasi',
          initialQuantity: 10,
          remainingQuantity: 10,
          unit: 'potong',
          expiryAt: new Date(Date.now() + 24 * 3600 * 1000),
          packagingIntact: true,
          temperatureSafe: true,
          visualSmellOk: true,
          physicalStatus: 'DITERIMA',
          createdByUserId: admin!.id,
        },
      });

      const token = createSessionToken({
        id: admin!.id,
        email: admin!.email,
        name: admin!.name,
        role: admin!.role,
      });

      const req = new Request('http://localhost:3000/api/food/dispose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sb_session=${token}`,
        },
        body: JSON.stringify({
          stockId: stock.id,
          reason: 'Melebihi sisa',
          quantity: 99,
        }),
      });

      const res = await DisposeRoute.POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('tidak boleh melebihi sisa stok');
    });
  });
});
