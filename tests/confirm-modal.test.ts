import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 4: ConfirmModal and Removal of Browser alert/confirm', () => {
  it('verifies ConfirmModal component exists and exports properly', async () => {
    const filePath = path.join(process.cwd(), 'src/components/ConfirmModal.tsx');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('ConfirmModal');
    expect(content).toContain('onConfirm');
    expect(content).toContain('onClose');
    expect(content).toContain('variant');
  });

  it('verifies NO browser confirm() or alert() calls exist across the entire dashboard pages', async () => {
    const pages = [
      'src/app/(dashboard)/distribusi/page.tsx',
      'src/app/(dashboard)/donatur/page.tsx',
      'src/app/(dashboard)/penerima/page.tsx',
      'src/app/(dashboard)/pengguna/page.tsx',
    ];

    for (const pageRel of pages) {
      const fullPath = path.join(process.cwd(), pageRel);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Should not contain confirm(...) or window.confirm(...)
      expect(content).not.toMatch(/\bconfirm\s*\(/);
      expect(content).not.toMatch(/\bwindow\.confirm\s*\(/);

      // Should not contain alert(...) or window.alert(...)
      expect(content).not.toMatch(/\balert\s*\(/);
      expect(content).not.toMatch(/\bwindow\.alert\s*\(/);

      // Should import or use ConfirmModal
      expect(content).toContain('ConfirmModal');
    }
  });
});
