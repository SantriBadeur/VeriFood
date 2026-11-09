import { describe, it, expect } from 'vitest';
import { foodService } from '../src/services/food.service';
import { prisma } from '../src/lib/db';

describe('Inbound Food Intake & Physical Checklist (US-07, US-08)', () => {
  it('should set physicalStatus DITERIMA and remainingQuantity = initialQuantity when all checklist items pass', async () => {
    const donor = await prisma.donor.findFirst();
    const admin = await prisma.user.findFirst();
    const food = await foodService.recordInbound(
      {
        donorId: donor!.id,
        name: 'Roti Gandum',
        quantity: 50,
        unit: 'kotak',
        expiryAt: new Date(Date.now() + 48 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
      },
      admin!.id
    );

    expect(food.physicalStatus).toBe('DITERIMA');
    expect(food.remainingQuantity).toBe(50);
  });

  it('should set physicalStatus DITOLAK and remainingQuantity = 0 if any checklist item fails', async () => {
    const donor = await prisma.donor.findFirst();
    const admin = await prisma.user.findFirst();
    const food = await foodService.recordInbound(
      {
        donorId: donor!.id,
        name: 'Susu UHT',
        quantity: 20,
        unit: 'kotak',
        expiryAt: new Date(Date.now() + 48 * 3600 * 1000),
        packagingIntact: false, // Rusak
        temperatureSafe: true,
        visualSmellOk: true,
      },
      admin!.id
    );

    expect(food.physicalStatus).toBe('DITOLAK');
    expect(food.remainingQuantity).toBe(0);
  });
});

