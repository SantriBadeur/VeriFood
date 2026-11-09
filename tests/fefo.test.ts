import { describe, it, expect } from 'vitest';
import { computeExpiryStatus } from '../src/lib/fefo';

describe('FEFO Dynamic Shelf-Life Engine', () => {
  it('should compute status AMAN when remaining expiry > 24 hours', () => {
    const futureDate = new Date(Date.now() + 48 * 3600 * 1000);
    const result = computeExpiryStatus(futureDate, 'DITERIMA');

    expect(result.status).toBe('AMAN');
    expect(result.badge).toBe('green');
    expect(result.canDistribute).toBe(true);
  });

  it('should compute status MENDEKATI_KEDALUWARSA when remaining expiry <= 24 hours and > 0', () => {
    const nearExpiryDate = new Date(Date.now() + 12 * 3600 * 1000);
    const result = computeExpiryStatus(nearExpiryDate, 'DITERIMA');

    expect(result.status).toBe('MENDEKATI_KEDALUWARSA');
    expect(result.badge).toBe('yellow');
    expect(result.canDistribute).toBe(true);
  });

  it('should compute status KEDALUWARSA when expiry date has passed', () => {
    const expiredDate = new Date(Date.now() - 3600 * 1000);
    const result = computeExpiryStatus(expiredDate, 'DITERIMA');

    expect(result.status).toBe('KEDALUWARSA');
    expect(result.badge).toBe('red');
    expect(result.canDistribute).toBe(false);
  });

  it('should prioritize physical status DITOLAK even if expiry date is far in future', () => {
    const futureDate = new Date(Date.now() + 72 * 3600 * 1000);
    const result = computeExpiryStatus(futureDate, 'DITOLAK');

    expect(result.status).toBe('DITOLAK');
    expect(result.badge).toBe('red');
    expect(result.canDistribute).toBe(false);
  });
});

