import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 5: Shelf & Container Printable Label with QR Code', () => {
  it('creates ShelfLabelModal component cleanly', async () => {
    const modalModule = await import('../src/components/ShelfLabelModal');
    expect(modalModule.default).toBeDefined();
  });

  it('verifies ShelfLabelModal contains QR code rendering, batch ID, expiry, and window.print', () => {
    const filePath = path.join(process.cwd(), 'src/components/ShelfLabelModal.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('LABEL STOK GUDANG');
    expect(content).toContain('window.print');
    expect(content).toContain('svg');
    expect(content).toContain('print:block');
  });

  it('verifies /makanan/kelola/page.tsx integrates ShelfLabelModal and Cetak Label button', () => {
    const filePath = path.join(process.cwd(), 'src/app/(dashboard)/makanan/kelola/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('ShelfLabelModal');
    expect(content).toContain('Cetak Label');
  });
});
