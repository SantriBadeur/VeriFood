import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/db';
import { beneficiaryService } from '../src/services/beneficiary.service';
import { distributionService } from '../src/services/distribution.service';

describe('Beneficiary Capacity & Quota Validation (Task 2)', () => {
  it('should save beneficiary capacity and reject distribution exceeding quota without bypass', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const donor = await prisma.donor.findFirst();

    if (!admin || !donor) throw new Error('Missing admin or donor');

    // 1. Create beneficiary with capacity of 30
    const beneficiary = await beneficiaryService.create(
      {
        name: 'Panti Asuhan Kasih Bunda Quota Test',
        type: 'PANTI_ASUHAN',
        contact: '081234567890',
        address: 'Jl. Melati No. 12',
        capacity: 30,
      },
      admin.role,
      admin.id
    );

    expect(beneficiary.capacity).toBe(30);

    // 2. Create food stock of 200 portions
    const stock = await prisma.foodStock.create({
      data: {
        donorId: donor.id,
        name: 'Nasi Kotak Ayam Penyet Quota Test',
        initialQuantity: 200,
        remainingQuantity: 200,
        unit: 'porsi',
        expiryAt: new Date(Date.now() + 24 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin.id,
      },
    });

    // 3. Attempt to allocate 100 portions (exceeds capacity 30) -> should fail
    await expect(
      distributionService.createSchedule(
        {
          beneficiaryId: beneficiary.id,
          scheduledDate: new Date(Date.now() + 3600 * 1000),
          items: [{ foodStockId: stock.id, quantity: 100 }],
        },
        admin.id
      )
    ).rejects.toThrow(/melebihi kapasitas kuota penerima/);

    // 4. Allocate within quota (25 portions) -> should succeed
    const validSchedule = await distributionService.createSchedule(
      {
        beneficiaryId: beneficiary.id,
        scheduledDate: new Date(Date.now() + 3600 * 1000),
        items: [{ foodStockId: stock.id, quantity: 25 }],
      },
      admin.id
    );

    expect(validSchedule.id).toBeDefined();

    // 5. Allocate exceeding quota (100 portions) WITH forceBypassCapacity -> should succeed
    const bypassedSchedule = await distributionService.createSchedule(
      {
        beneficiaryId: beneficiary.id,
        scheduledDate: new Date(Date.now() + 3600 * 1000),
        items: [{ foodStockId: stock.id, quantity: 100 }],
        forceBypassCapacity: true,
      },
      admin.id
    );

    expect(bypassedSchedule.id).toBeDefined();

    // Verify audit log has bypass flag
    const audit = await prisma.auditLog.findFirst({
      where: {
        entityId: bypassedSchedule.id,
        action: 'DISTRIBUTION_CREATE',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeDefined();
    const details = JSON.parse(audit!.details);
    expect(details.capacityBypassed).toBe(true);
    expect(details.beneficiaryCapacity).toBe(30);
  });
});
