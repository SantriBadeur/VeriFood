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

  it('should reject beneficiary modification when performed by RELAWAN', async () => {
    await expect(
      beneficiaryService.create(
        {
          name: 'Panti Asuhan Kasih',
          type: 'PANTI_ASUHAN',
          contact: '08987654321',
          address: 'Jl. Merdeka No. 1',
        },
        'RELAWAN'
      )
    ).rejects.toThrow('Hanya Admin yang dapat mengelola data penerima');
  });
});

