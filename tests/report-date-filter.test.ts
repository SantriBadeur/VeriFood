import { describe, it, expect } from 'vitest';
import { reportService } from '../src/services/report.service';
import { auditService } from '../src/services/audit.service';
import { prisma } from '../src/lib/db';
import * as RescuedRoute from '../src/app/api/reports/rescued/route';
import * as DonorsRoute from '../src/app/api/reports/donors/route';
import * as AuditRoute from '../src/app/api/audit/route';

describe('Report & Audit Date Range Filtering (Task 3)', () => {
  it('should filter audit logs by createdAt date range in service and API', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) throw new Error('Missing admin');

    // Create an old audit log (15 days ago)
    const oldLog = await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'OLD_TEST_ACTION',
        entity: 'FoodStock',
        entityId: 'test-entity-old',
        details: JSON.stringify({ note: '15 days ago' }),
        createdAt: new Date(Date.now() - 15 * 86400 * 1000),
      },
    });

    // Create a recent audit log (today)
    const newLog = await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'NEW_TEST_ACTION',
        entity: 'FoodStock',
        entityId: 'test-entity-new',
        details: JSON.stringify({ note: 'today' }),
        createdAt: new Date(),
      },
    });

    // Filter only last 3 days
    const startDate = new Date(Date.now() - 3 * 86400 * 1000);
    const endDate = new Date(Date.now() + 86400 * 1000);

    const logsResult = await auditService.getLogs({ startDate, endDate, limit: 100 });
    const hasOld = logsResult.data.some((l) => l.action === 'OLD_TEST_ACTION');
    const hasNew = logsResult.data.some((l) => l.action === 'NEW_TEST_ACTION');

    expect(hasNew).toBe(true);
    expect(hasOld).toBe(false);

    // Test API route passes date range
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);
    const req = new Request(`http://localhost:3000/api/audit?startDate=${startStr}&endDate=${endStr}`);
    const res = await AuditRoute.GET(req);
    const body = await res.json();
    const apiHasOld = body.data.some((l: { action: string }) => l.action === 'OLD_TEST_ACTION');
    const apiHasNew = body.data.some((l: { action: string }) => l.action === 'NEW_TEST_ACTION');
    expect(apiHasNew).toBe(true);
    expect(apiHasOld).toBe(false);
  });

  it('should filter donor transparency report by date range in service and API', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const donor = await prisma.donor.findFirst();
    if (!admin || !donor) throw new Error('Missing admin or donor');

    // Past stock from 10 days ago
    await prisma.foodStock.create({
      data: {
        donorId: donor.id,
        name: 'Donasi Donatur 10 Hari Lalu',
        initialQuantity: 88,
        remainingQuantity: 88,
        unit: 'paket-spesial-lama',
        expiryAt: new Date(Date.now() + 86400 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdAt: new Date(Date.now() - 10 * 86400 * 1000),
        createdByUserId: admin.id,
      },
    });

    // Recent stock (today)
    await prisma.foodStock.create({
      data: {
        donorId: donor.id,
        name: 'Donasi Donatur Hari Ini',
        initialQuantity: 33,
        remainingQuantity: 33,
        unit: 'paket-spesial-baru',
        expiryAt: new Date(Date.now() + 86400 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdAt: new Date(),
        createdByUserId: admin.id,
      },
    });

    const startDate = new Date(Date.now() - 2 * 86400 * 1000);
    const endDate = new Date(Date.now() + 86400 * 1000);

    const filteredDonors = await reportService.getDonorTransparencyReport(startDate, endDate);
    const hasOldUnit = filteredDonors.some((d) => d.unit === 'paket-spesial-lama');
    const hasNewUnit = filteredDonors.some((d) => d.unit === 'paket-spesial-baru');

    expect(hasNewUnit).toBe(true);
    expect(hasOldUnit).toBe(false);

    // Test API route
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);
    const req = new Request(`http://localhost:3000/api/reports/donors?startDate=${startStr}&endDate=${endStr}`);
    const res = await DonorsRoute.GET(req);
    const body: Array<{ unit: string }> = await res.json();
    const apiHasOld = body.some((d) => d.unit === 'paket-spesial-lama');
    const apiHasNew = body.some((d) => d.unit === 'paket-spesial-baru');
    expect(apiHasNew).toBe(true);
    expect(apiHasOld).toBe(false);
  });
});
