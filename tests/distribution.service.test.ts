import { describe, it, expect } from 'vitest';
import { distributionService } from '../src/services/distribution.service';
import { prisma } from '../src/lib/db';

describe('Distribution Service & Lifecycle (US-13, US-14, US-15)', () => {
  it('should deduct stock on DIKIRIM and restore stock on DIBATALKAN', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const beneficiary = await prisma.beneficiary.findFirst();
    const donor = await prisma.donor.findFirst();

    const stock = await prisma.foodStock.create({
      data: {
        donorId: donor!.id,
        name: 'Roti Manis Abon',
        initialQuantity: 100,
        remainingQuantity: 100,
        unit: 'buah',
        expiryAt: new Date(Date.now() + 48 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin!.id,
      },
    });

    // 1. Create schedule TERJADWAL
    const dist = await distributionService.createSchedule(
      {
        beneficiaryId: beneficiary!.id,
        scheduledDate: new Date(),
        items: [{ foodStockId: stock.id, quantity: 40 }],
      },
      admin!.id
    );

    expect(dist.status).toBe('TERJADWAL');

    // 2. Dispatch DIKIRIM -> stock must decrement to 60
    await distributionService.updateStatus(dist.id, 'DIKIRIM', admin!.id);
    let updatedStock = await prisma.foodStock.findUnique({ where: { id: stock.id } });
    expect(updatedStock?.remainingQuantity).toBe(60);

    // 3. Cancel DIBATALKAN -> stock must restore to 100
    await distributionService.updateStatus(dist.id, 'DIBATALKAN', admin!.id);
    updatedStock = await prisma.foodStock.findUnique({ where: { id: stock.id } });
    expect(updatedStock?.remainingQuantity).toBe(100);
  });

  it('should block dispatch if any item has expired (Review Focus 2)', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const beneficiary = await prisma.beneficiary.findFirst();
    const donor = await prisma.donor.findFirst();

    const expiredStock = await prisma.foodStock.create({
      data: {
        donorId: donor!.id,
        name: 'Kue Basah Pasar',
        initialQuantity: 20,
        remainingQuantity: 20,
        unit: 'kotak',
        expiryAt: new Date(Date.now() - 3600 * 1000), // Sudah kedaluwarsa
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin!.id,
      },
    });

    // Directly create schedule record in TERJADWAL status to simulate expiring in warehouse
    const dist = await prisma.distribution.create({
      data: {
        beneficiaryId: beneficiary!.id,
        scheduledDate: new Date(),
        status: 'TERJADWAL',
        createdByUserId: admin!.id,
        items: {
          create: [{ foodStockId: expiredStock.id, quantity: 10 }],
        },
      },
    });

    await expect(
      distributionService.updateStatus(dist.id, 'DIKIRIM', admin!.id)
    ).rejects.toThrow('tidak aman untuk dikirim karena telah kedaluwarsa');
  });
});

