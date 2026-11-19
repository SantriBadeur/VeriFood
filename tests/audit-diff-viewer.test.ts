import { describe, it, expect } from 'vitest';
import { parseAuditDiff } from '../src/components/audit/audit-diff-viewer';

describe('Audit Diff Viewer Logic (Task 5)', () => {
  it('should parse previous vs updated nested object into structured diff items', () => {
    const rawDetails = JSON.stringify({
      previous: {
        name: 'Roti Gandum Typos',
        donorId: 'donor-1',
      },
      updated: {
        name: 'Roti Gandum Revisi',
        donorId: 'donor-2',
      },
    });

    const diff = parseAuditDiff(rawDetails, 'STOCK_METADATA_UPDATE');
    expect(diff.type).toBe('NESTED_DIFF');
    expect(diff.changes).toHaveLength(2);
    expect(diff.changes![0]).toEqual({
      field: 'name',
      before: 'Roti Gandum Typos',
      after: 'Roti Gandum Revisi',
    });
    expect(diff.changes![1]).toEqual({
      field: 'donorId',
      before: 'donor-1',
      after: 'donor-2',
    });
  });

  it('should parse partial disposal diff into quantity decrement and reason', () => {
    const rawDetails = JSON.stringify({
      previousRemaining: 50,
      disposedQuantity: 10,
      newRemaining: 40,
      reason: '10 porsi basi berjamur',
    });

    const diff = parseAuditDiff(rawDetails, 'STOCK_DISPOSAL');
    expect(diff.type).toBe('DISPOSAL_DIFF');
    expect(diff.disposedQty).toBe(10);
    expect(diff.beforeQty).toBe(50);
    expect(diff.afterQty).toBe(40);
    expect(diff.reason).toBe('10 porsi basi berjamur');
  });

  it('should parse initial quantity correction diff', () => {
    const rawDetails = JSON.stringify({
      previousInitial: 100,
      newInitial: 80,
      previousRemaining: 60,
      newRemaining: 40,
      totalDisalurkan: 40,
    });

    const diff = parseAuditDiff(rawDetails, 'STOCK_CORRECTION');
    expect(diff.type).toBe('CORRECTION_DIFF');
    expect(diff.changes).toContainEqual({
      field: 'Stok Awal',
      before: '100',
      after: '80',
    });
  });

  it('should handle raw strings or malformed JSON gracefully without crashing', () => {
    const raw = 'Just a simple log string or non-json';
    const diff = parseAuditDiff(raw, 'UNKNOWN_ACTION');
    expect(diff.type).toBe('GENERIC');
    expect(diff.fallbackText).toBe(raw);
  });
});
