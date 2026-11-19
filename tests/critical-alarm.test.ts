import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/db';
import * as CriticalNotificationRoute from '../src/app/api/notifications/critical/route';

describe('Critical Expiry Notification Alarm (Task 6)', () => {
  it('should identify food stocks expiring in <= 2 hours without scheduled distribution', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const donor = await prisma.donor.findFirst();
    const beneficiary = await prisma.beneficiary.findFirst();

    if (!admin || !donor || !beneficiary) throw new Error('Missing seed data');

    // 1. Critical stock expiring in 60 minutes, remaining 30 portions, unscheduled
    const criticalStock = await prisma.foodStock.create({
      data: {
        donorId: donor.id,
        name: 'Sup Ayam Hangat Kritis 1 Jam',
        initialQuantity: 30,
        remainingQuantity: 30,
        unit: 'porsi',
        expiryAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin.id,
      },
    });

    // 2. Safe stock expiring in 24 hours
    const safeStock = await prisma.foodStock.create({
      data: {
        donorId: donor.id,
        name: 'Beras Premium Aman 24 Jam',
        initialQuantity: 100,
        remainingQuantity: 100,
        unit: 'kg',
        expiryAt: new Date(Date.now() + 24 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin.id,
      },
    });

    // 3. Stock expiring in 90 minutes but FULLY scheduled
    const scheduledExpiringStock = await prisma.foodStock.create({
      data: {
        donorId: donor.id,
        name: 'Nasi Kuning Terjadwal',
        initialQuantity: 20,
        remainingQuantity: 20,
        unit: 'porsi',
        expiryAt: new Date(Date.now() + 90 * 60 * 1000), // 1.5 hours from now
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin.id,
      },
    });

    await prisma.distribution.create({
      data: {
        beneficiaryId: beneficiary.id,
        scheduledDate: new Date(),
        status: 'TERJADWAL',
        createdByUserId: admin.id,
        items: {
          create: [{ foodStockId: scheduledExpiringStock.id, quantity: 20 }],
        },
      },
    });

    const req = new Request('http://localhost:3000/api/notifications/critical');
    const res = await CriticalNotificationRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.criticalItems).toBeDefined();

    const foundCritical = data.criticalItems.find(
      (item: { id: string }) => item.id === criticalStock.id
    );
    expect(foundCritical).toBeDefined();
    expect(foundCritical.name).toBe('Sup Ayam Hangat Kritis 1 Jam');
    expect(foundCritical.unreservedQuantity).toBe(30);
    expect(foundCritical.minutesLeft).toBeLessThanOrEqual(60);

    // Safe stock must not be in critical alarm
    const foundSafe = data.criticalItems.find(
      (item: { id: string }) => item.id === safeStock.id
    );
    expect(foundSafe).toBeUndefined();

    // Fully scheduled stock must not trigger unreserved emergency alarm
    const foundScheduled = data.criticalItems.find(
      (item: { id: string }) => item.id === scheduledExpiringStock.id
    );
    expect(foundScheduled).toBeUndefined();
  });
});
