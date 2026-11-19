import { describe, it, expect } from 'vitest';
import { getGoogleMapsUrl, calculateExpiryPreset, EXPIRY_SHORTCUTS } from '../src/lib/quick-wins-utils';
import * as fs from 'fs';
import * as path from 'path';

describe('Quick Wins UX Lapangan (Prioritas 2)', () => {
  describe('1. Google Maps Navigation Shortcut for Distribution', () => {
    it('generates the correct Google Maps search URL with encoded address', () => {
      const address = 'Panti Asuhan Kasih Ibu, Jl. Melati No. 45, Jakarta Selatan';
      const url = getGoogleMapsUrl(address);
      expect(url).toBe(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      );
    });

    it('trims leading and trailing whitespace before encoding', () => {
      const address = '  Jl. Merdeka No. 10  ';
      const url = getGoogleMapsUrl(address);
      expect(url).toBe(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Jl. Merdeka No. 10')}`
      );
    });

    it('returns empty string if address is empty or whitespace', () => {
      expect(getGoogleMapsUrl('')).toBe('');
      expect(getGoogleMapsUrl('   ')).toBe('');
    });

    it('verifies /distribusi/page.tsx contains the Google Maps navigation link with target="_blank" and rel="noopener noreferrer"', () => {
      const filePath = path.join(process.cwd(), 'src/app/(dashboard)/distribusi/page.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('getGoogleNavigationUrl');
      expect(content).toContain('target="_blank"');
      expect(content).toContain('rel="noopener noreferrer"');
      expect(content).toContain('Rute Navigasi');
    });
  });

  describe('2. Expiry DateTime Shortcuts for Food Inbound Form', () => {
    const fixedBaseDate = new Date('2026-11-19T08:30:00');

    it('calculates +4 hours correctly for perishable / coconut-milk foods', () => {
      const result = calculateExpiryPreset(4, fixedBaseDate);
      expect(result).toBe('2026-11-19T12:30');
    });

    it('calculates +8 hours correctly (noon to night shift)', () => {
      const result = calculateExpiryPreset(8, fixedBaseDate);
      expect(result).toBe('2026-11-19T16:30');
    });

    it('calculates Besok Pagi (+24 Jam) correctly across midnight', () => {
      const result = calculateExpiryPreset(24, fixedBaseDate);
      expect(result).toBe('2026-11-20T08:30');
    });

    it('calculates +3 Hari (+72 Jam) correctly across days and months if needed', () => {
      const result = calculateExpiryPreset(72, fixedBaseDate);
      expect(result).toBe('2026-11-22T08:30');
    });

    it('properly zero-pads month, day, hour, and minute in YYYY-MM-DDTHH:mm format', () => {
      const singleDigitDate = new Date('2026-03-05T04:05:00');
      const result = calculateExpiryPreset(4, singleDigitDate);
      expect(result).toBe('2026-03-05T08:05');
    });

    it('has all 4 required presets configured in EXPIRY_SHORTCUTS', () => {
      expect(EXPIRY_SHORTCUTS).toHaveLength(4);
      expect(EXPIRY_SHORTCUTS.map((s) => s.hours)).toEqual([4, 8, 24, 72]);
      expect(EXPIRY_SHORTCUTS.some((s) => s.label.includes('+4 Jam'))).toBe(true);
      expect(EXPIRY_SHORTCUTS.some((s) => s.label.includes('+8 Jam'))).toBe(true);
      expect(EXPIRY_SHORTCUTS.some((s) => s.label.includes('Besok Pagi') || s.label.includes('+24 Jam'))).toBe(true);
      expect(EXPIRY_SHORTCUTS.some((s) => s.label.includes('+3 Hari'))).toBe(true);
    });

    it('verifies /makanan/masuk/page.tsx contains the 4 shortcut buttons', () => {
      const filePath = path.join(process.cwd(), 'src/app/(dashboard)/makanan/masuk/page.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('+4 Jam');
      expect(content).toContain('+8 Jam');
      expect(content).toContain('Besok Pagi');
      expect(content).toContain('+3 Hari');
    });
  });
});
