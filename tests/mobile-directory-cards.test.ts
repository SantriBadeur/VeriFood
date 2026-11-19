import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 2: Mobile Card Stack for Directory Pages (/donatur, /penerima, /pengguna)', () => {
  it('verifies /donatur has mobile card stack and responsive desktop table hiding', () => {
    const filePath = path.join(process.cwd(), 'src/app/(dashboard)/donatur/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('block md:hidden');
    expect(content).toMatch(/hidden\s+md:(block|table)/);

    const mobileIdx = content.indexOf('block md:hidden');
    const desktopIdx = content.indexOf('hidden md:block');
    expect(mobileIdx).toBeGreaterThan(-1);
    expect(desktopIdx).toBeGreaterThan(mobileIdx);

    const mobileSection = content.substring(mobileIdx, desktopIdx);
    expect(mobileSection).toContain('openEditModal');
    expect(mobileSection).toContain('handleDelete');
    expect(mobileSection).toContain('getTypeBadgeClass');
  });

  it('verifies /penerima has mobile card stack and responsive desktop table hiding', () => {
    const filePath = path.join(process.cwd(), 'src/app/(dashboard)/penerima/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('block md:hidden');
    expect(content).toMatch(/hidden\s+md:(block|table)/);

    const mobileIdx = content.indexOf('block md:hidden');
    const desktopIdx = content.indexOf('hidden md:block');
    expect(mobileIdx).toBeGreaterThan(-1);
    expect(desktopIdx).toBeGreaterThan(mobileIdx);

    const mobileSection = content.substring(mobileIdx, desktopIdx);
    expect(mobileSection).toContain('openEditModal');
    expect(mobileSection).toContain('handleDelete');
    expect(mobileSection).toContain('getTypeBadgeClass');
  });

  it('verifies /pengguna has mobile card stack and responsive desktop table hiding', () => {
    const filePath = path.join(process.cwd(), 'src/app/(dashboard)/pengguna/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('block md:hidden');
    expect(content).toMatch(/hidden\s+md:(block|table)/);

    const mobileIdx = content.indexOf('block md:hidden');
    const desktopIdx = content.indexOf('hidden md:block');
    expect(mobileIdx).toBeGreaterThan(-1);
    expect(desktopIdx).toBeGreaterThan(mobileIdx);

    const mobileSection = content.substring(mobileIdx, desktopIdx);
    expect(mobileSection).toContain('handleToggle');
    expect(mobileSection).toContain('u.role');
    expect(mobileSection).toContain('u.email');
  });
});
