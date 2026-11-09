import { describe, it, expect } from 'vitest';
import { foodService } from '../src/services/food.service';
import { prisma } from '../src/lib/db';

describe('Food Service & Stock Invariants (US-07, US-08, US-09)', () => {
  it('should accept food when all 3 physical checks pass', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const donor = await prisma.donor.findFirst();

    const food = await foodService.recordInbound(
      {
        donorId: donor!.id,
        name: 'Nasi Kotak Ayam Bakar',
        quantity: 50,
        unit: 'porsi',
        expiryAt: new Date(Date.now() + 24 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
      },
      admin!.id
    );

    expect(food.physicalStatus).toBe('DITERIMA');
    expect(food.remainingQuantity).toBe(50);
  });

  it('should reject food and set remainingQuantity = 0 when any check fails', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const donor = await prisma.donor.findFirst();

    const rejectedFood = await foodService.recordInbound(
      {
        donorId: donor!.id,
        name: 'Susu UHT Cokelat',
        quantity: 30,
        unit: 'kotak',
        expiryAt: new Date(Date.now() + 48 * 3600 * 1000),
        packagingIntact: false, // Rusak
        temperatureSafe: true,
        visualSmellOk: true,
      },
      admin!.id
    );

    expect(rejectedFood.physicalStatus).toBe('DITOLAK');
    expect(rejectedFood.remainingQuantity).toBe(0);
  });

  it('should block stock correction below total distributed amount', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const donor = await prisma.donor.findFirst();

    const stock = await prisma.foodStock.create({
      data: {
        donorId: donor!.id,
        name: 'Apel Malang',
        initialQuantity: 100,
        remainingQuantity: 60, // 40 already distributed
        unit: 'kg',
        expiryAt: new Date(Date.now() + 72 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin!.id,
      },
    });

    // Attempting to correct to 30 (< 40) must throw
    await expect(
      foodService.correctStock(stock.id, 30, admin!.id, 'ADMIN')
    ).rejects.toThrow('Jumlah baru tidak boleh lebih kecil dari jumlah yang sudah disalurkan');

    // Correcting to 70 (>= 40) must succeed and adjust remaining to 30
    const corrected = await foodService.correctStock(stock.id, 70, admin!.id, 'ADMIN');
    expect(corrected.initialQuantity).toBe(70);
    expect(corrected.remainingQuantity).toBe(30);
  });
});

