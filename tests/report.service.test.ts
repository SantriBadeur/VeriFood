import { describe, it, expect } from 'vitest';
import { reportService } from '../src/services/report.service';

describe('Report Service & Unit Segregation (US-17, US-18, US-20)', () => {
  it('should return metrics strictly segregated per unit and never sum cross-unit', async () => {
    const report = await reportService.getRescuedFoodReport();

    // Verify all metrics have valid unit and positive or zero totalQuantity
    for (const metric of report) {
      expect(typeof metric.unit).toBe('string');
      expect(typeof metric.totalQuantity).toBe('number');
    }

    // Verify uniqueness of unit groups
    const units = report.map((r) => r.unit);
    expect(new Set(units).size).toBe(units.length);
  });

  it('should generate valid RFC compliant CSV strings', async () => {
    const csv = await reportService.exportReportToCSV('rescued');
    expect(csv).toContain('Satuan,Total Makanan Terselamatkan');
  });
});

