import { describe, it, expect } from 'vitest';
import { foodService } from '../src/services/food.service';
import { prisma } from '../src/lib/db';
import { createSessionToken } from '../src/lib/auth';
import * as MetadataRoute from '../src/app/api/food/[id]/metadata/route';

describe('Food Metadata Editing (Task 1)', () => {
  it('should allow ADMIN to update food name, donor, expiryAt, and notes with audit log', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const donors = await prisma.donor.findMany({ take: 2 });

    if (!admin || donors.length < 2) throw new Error('Missing seed admin or donors');

    const originalExpiry = new Date(Date.now() + 24 * 3600 * 1000);
    const stock = await prisma.foodStock.create({
      data: {
        donorId: donors[0].id,
        name: 'Roti Gandum Typos',
        initialQuantity: 20,
        remainingQuantity: 20,
        unit: 'kotak',
        expiryAt: originalExpiry,
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        notes: 'Catatan awal',
        createdByUserId: admin.id,
      },
    });

    const newExpiry = new Date(Date.now() + 48 * 3600 * 1000);
    const updated = await foodService.updateMetadata(
      stock.id,
      {
        name: 'Roti Gandum Utuh Manis (Revisi)',
        donorId: donors[1].id,
        expiryAt: newExpiry,
        notes: 'Koreksi nama donatur dan perpanjangan masa simpan sesuai label',
      },
      admin.id,
      admin.role
    );

    expect(updated.name).toBe('Roti Gandum Utuh Manis (Revisi)');
    expect(updated.donorId).toBe(donors[1].id);
    expect(new Date(updated.expiryAt).getTime()).toBe(newExpiry.getTime());
    expect(updated.notes).toBe('Koreksi nama donatur dan perpanjangan masa simpan sesuai label');

    // Verify audit log
    const audit = await prisma.auditLog.findFirst({
      where: {
        entityId: stock.id,
        action: 'STOCK_METADATA_UPDATE',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeDefined();
    expect(audit!.userId).toBe(admin.id);
    const details = JSON.parse(audit!.details);
    expect(details.previous.name).toBe('Roti Gandum Typos');
    expect(details.updated.name).toBe('Roti Gandum Utuh Manis (Revisi)');
    expect(details.previous.donorId).toBe(donors[0].id);
    expect(details.updated.donorId).toBe(donors[1].id);
  });

  it('should reject metadata update if user is not an ADMIN', async () => {
    const volunteer = await prisma.user.findFirst({ where: { role: 'RELAWAN' } });
    const stock = await prisma.foodStock.findFirst();

    if (!volunteer || !stock) throw new Error('Missing volunteer or stock');

    await expect(
      foodService.updateMetadata(
        stock.id,
        { name: 'Upaya Hack Nama' },
        volunteer.id,
        volunteer.role
      )
    ).rejects.toThrow('Hanya Admin yang dapat mengoreksi informasi metadata makanan');
  });

  it('should reject update if donor does not exist', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const stock = await prisma.foodStock.findFirst();

    if (!admin || !stock) throw new Error('Missing admin or stock');

    await expect(
      foodService.updateMetadata(
        stock.id,
        { donorId: 'non-existent-donor-id' },
        admin.id,
        admin.role
      )
    ).rejects.toThrow('Donatur tidak ditemukan');
  });

  it('API route PATCH /api/food/[id]/metadata should protect against unauthenticated and volunteer access', async () => {
    const stock = await prisma.foodStock.findFirst();
    const volunteer = await prisma.user.findFirst({ where: { role: 'RELAWAN' } });
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    if (!stock || !volunteer || !admin) throw new Error('Missing seed data');

    // 1. Unauthenticated request
    const unauthReq = new Request(`http://localhost:3000/api/food/${stock.id}/metadata`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Tes Anonim' }),
    });
    const unauthRes = await MetadataRoute.PATCH(unauthReq, { params: Promise.resolve({ id: stock.id }) });
    expect(unauthRes.status).toBe(401);

    // 2. Volunteer request -> 403
    const volToken = createSessionToken({ id: volunteer.id, role: volunteer.role, email: volunteer.email, name: volunteer.name });
    const volReq = new Request(`http://localhost:3000/api/food/${stock.id}/metadata`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volToken}`,
      },
      body: JSON.stringify({ name: 'Tes Relawan' }),
    });
    const volRes = await MetadataRoute.PATCH(volReq, { params: Promise.resolve({ id: stock.id }) });
    expect(volRes.status).toBe(403);

    // 3. Admin request -> 200
    const adminToken = createSessionToken({ id: admin.id, role: admin.role, email: admin.email, name: admin.name });
    const adminReq = new Request(`http://localhost:3000/api/food/${stock.id}/metadata`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: 'Nama Terkoreksi via API' }),
    });
    const adminRes = await MetadataRoute.PATCH(adminReq, { params: Promise.resolve({ id: stock.id }) });
    expect(adminRes.status).toBe(200);
    const body = await adminRes.json();
    expect(body.success).toBe(true);
    expect(body.food.name).toBe('Nama Terkoreksi via API');
  });
});
