import { describe, it, expect } from 'vitest';
import { donorService } from '../src/services/donor.service';
import { beneficiaryService } from '../src/services/beneficiary.service';

describe('Master Data Service (US-03, US-04, US-05, US-06)', () => {
  it('should soft delete donor and exclude it from standard listings', async () => {
    const donor = await donorService.create({
      name: 'Bakery Lestari',
      type: 'RESTORAN',
      contact: '08123456789',
    });
    await donorService.softDelete(donor.id);
    const list = await donorService.list({ search: 'Bakery Lestari' });
    expect(list.data.find((d) => d.id === donor.id)).toBeUndefined();
  });

  it('should update donor data (US-03)', async () => {
    const donor = await donorService.create({
      name: 'Katering Sejahtera',
      type: 'KATERING',
      contact: '08111122233',
      address: 'Jl. Melati No. 5',
    });
    const updated = await donorService.update(donor.id, {
      name: 'Katering Sejahtera Baru',
      contact: '08999988877',
    });
    expect(updated.name).toBe('Katering Sejahtera Baru');
    expect(updated.contact).toBe('08999988877');
  });

  it('should filter donors by type (US-04)', async () => {
    const list = await donorService.list({ type: 'KATERING' });
    expect(list.data.every((d) => d.type === 'KATERING')).toBe(true);
  });

  it('should allow ADMIN to update beneficiary but reject RELAWAN (US-05, US-06)', async () => {
    const ben = await beneficiaryService.create(
      {
        name: 'Yayasan Peduli Anak',
        type: 'PANTI_ASUHAN',
        contact: '08555566677',
        address: 'Jl. Kenanga No. 12',
      },
      'ADMIN'
    );

    // ADMIN update succeeds
    const updated = await beneficiaryService.update(
      ben.id,
      { name: 'Yayasan Peduli Anak Mandiri' },
      'ADMIN'
    );
    expect(updated.name).toBe('Yayasan Peduli Anak Mandiri');

    // RELAWAN update rejected
    await expect(
      beneficiaryService.update(ben.id, { name: 'Hacked' }, 'RELAWAN')
    ).rejects.toThrow('Hanya Admin yang dapat mengelola data penerima');
  });
});


