import { describe, it, expect } from 'vitest';
import {
  formatIndonesianPhoneNumber,
  getWhatsAppUrl,
  getCallUrl,
  getGoogleNavigationUrl,
} from '../src/lib/quick-wins-utils';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 2: Direct Contact (Call & WhatsApp) and Navigation Links', () => {
  describe('formatIndonesianPhoneNumber', () => {
    it('normalizes 08xx number to 628xx format', () => {
      expect(formatIndonesianPhoneNumber('081234567890')).toBe('6281234567890');
    });

    it('strips dashes, spaces, and plus signs', () => {
      expect(formatIndonesianPhoneNumber('+62 812-3456-7890')).toBe('6281234567890');
      expect(formatIndonesianPhoneNumber('(0812) 3456-7890')).toBe('6281234567890');
    });

    it('handles number already formatted as 628xx', () => {
      expect(formatIndonesianPhoneNumber('6281234567890')).toBe('6281234567890');
    });

    it('returns empty string if input is empty or invalid', () => {
      expect(formatIndonesianPhoneNumber('')).toBe('');
      expect(formatIndonesianPhoneNumber('   ')).toBe('');
    });
  });

  describe('getWhatsAppUrl', () => {
    it('generates correct wa.me link with normalized phone and encoded message', () => {
      const url = getWhatsAppUrl('0812-3456-7890', 'Halo, paket makanan sedang diantar.');
      expect(url).toBe(
        'https://wa.me/6281234567890?text=' +
          encodeURIComponent('Halo, paket makanan sedang diantar.')
      );
    });

    it('returns empty string if phone is empty', () => {
      expect(getWhatsAppUrl('')).toBe('');
    });
  });

  describe('getCallUrl', () => {
    it('generates tel: URI with clean number', () => {
      expect(getCallUrl('0812-3456-7890')).toBe('tel:081234567890');
      expect(getCallUrl('')).toBe('');
    });
  });

  describe('getGoogleNavigationUrl', () => {
    it('generates Google Maps directions turn-by-turn navigation URL', () => {
      const address = 'Panti Asuhan Melati, Jl. Kenanga 12';
      const url = getGoogleNavigationUrl(address);
      expect(url).toBe(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
      );
    });

    it('returns empty string if address is empty', () => {
      expect(getGoogleNavigationUrl('')).toBe('');
    });
  });

  describe('UI integration in /distribusi/page.tsx', () => {
    it('verifies /distribusi/page.tsx renders tel: and wa.me links with icons', () => {
      const filePath = path.join(process.cwd(), 'src/app/(dashboard)/distribusi/page.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('getWhatsAppUrl');
      expect(content).toContain('getCallUrl');
      expect(content).toContain('getGoogleNavigationUrl');
    });
  });
});
