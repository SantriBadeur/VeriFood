import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/lib/db';
import { distributionService } from '../src/services/distribution.service';

describe('Task 3: Proof of Delivery (BAST) with Photo & Digital Signature', () => {
  let userId: string;
  let beneficiaryId: string;
  let foodStockId: string;
  let distributionId: string;

  beforeAll(async () => {
    const user = await prisma.user.upsert({
      where: { email: 'bast_relawan@sisaberkah.org' },
      update: {},
      create: {
        email: 'bast_relawan@sisaberkah.org',
        name: 'Relawan BAST',
        passwordHash: 'dummyhash',
        role: 'RELAWAN',
        isActive: true,
      },
    });
    userId = user.id;

    const b = await prisma.beneficiary.create({
      data: {
        name: 'Panti BAST Penerima',
        type: 'PANTI_ASUHAN',
        contact: '081234567890',
        address: 'Jl. Melati BAST No. 10',
      },
    });
    beneficiaryId = b.id;

    const donor = await prisma.donor.create({
      data: {
        name: 'Donatur BAST',
        type: 'KATERING',
        contact: '081298765432',
      },
    });

    const stock = await prisma.foodStock.create({
      data: {
        donorId: donor.id,
        name: 'Nasi Kotak BAST',
        initialQuantity: 50,
        remainingQuantity: 50,
        unit: 'porsi',
        expiryAt: new Date(Date.now() + 24 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: userId,
      },
    });
    foodStockId = stock.id;

    const dist = await distributionService.createSchedule(
      {
        beneficiaryId,
        scheduledDate: new Date(),
        items: [{ foodStockId, quantity: 10 }],
      },
      userId
    );
    distributionId = dist.id;

    // Transition to DIKIRIM first
    await distributionService.updateStatus(distributionId, 'DIKIRIM', userId);
  });

  it('updates distribution to DITERIMA saving recipientName, proofPhoto, signatureData, and deliveredAt', async () => {
    const fakePhotoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const fakeSignatureBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';

    const updated = await distributionService.updateStatus(
      distributionId,
      'DITERIMA',
      userId,
      {
        recipientName: 'Ibu Sarah (Pengurus Panti)',
        proofPhoto: fakePhotoBase64,
        signatureData: fakeSignatureBase64,
      }
    );

    expect(updated).toBeDefined();
    expect(updated?.status).toBe('DITERIMA');
    expect(updated?.deliveredByUserId).toBe(userId);
    expect(updated?.recipientName).toBe('Ibu Sarah (Pengurus Panti)');
    expect(updated?.proofPhoto).toBe(fakePhotoBase64);
    expect(updated?.signatureData).toBe(fakeSignatureBase64);
    expect(updated?.deliveredAt).toBeInstanceOf(Date);
  });

  it('records audit log with BAST details on DITERIMA transition', async () => {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'Distribution',
        entityId: distributionId,
        action: 'DISTRIBUTION_STATUS_CHANGE',
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    expect(auditLogs.length).toBe(1);
    const details = JSON.parse(auditLogs[0].details);
    expect(details.to).toBe('DITERIMA');
    expect(details.hasProofPhoto).toBe(true);
    expect(details.hasSignature).toBe(true);
    expect(details.recipientName).toBe('Ibu Sarah (Pengurus Panti)');
  });
});
