import { describe, it, expect } from 'vitest';
import OfficialPrintReportPage from '../src/app/(dashboard)/laporan/cetak/page';

describe('Official Printable PDF Report with CSR Signatures (Task 4)', () => {
  it('should export OfficialPrintReportPage cleanly as a valid React component', () => {
    expect(OfficialPrintReportPage).toBeDefined();
    expect(typeof OfficialPrintReportPage).toBe('function');
  });
});
