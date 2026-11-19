import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 1: Global Search & Command Palette Modal', () => {
  it('verifies CommandPaletteModal component exists and exports properly', async () => {
    const filePath = path.join(process.cwd(), 'src/components/layout/command-palette-modal.tsx');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    // Checks for keyboard shortcut awareness
    expect(content).toContain('keydown');
    expect(content).toContain('k');
    // Checks for accessibility / role filtering
    expect(content).toContain('currentUser');
    // Checks for fast navigation and search
    expect(content).toContain('search');
    expect(content).toContain('filteredItems');
  });

  it('verifies TopHeader integrates CommandPaletteModal and shortcut listener', async () => {
    const filePath = path.join(process.cwd(), 'src/components/layout/top-header.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Must import and use CommandPaletteModal
    expect(content).toContain('CommandPaletteModal');
    // Button must open command palette modal
    expect(content).toContain('setIsSearchOpen(true)');
    // Must listen for Cmd+K / Ctrl+K
    expect(content).toMatch(/(ctrlKey|metaKey).*(e\.key === ['"]k['"]|e\.key === ['"]K['"])|(e\.key === ['"]k['"]|e\.key === ['"]K['"]).*(ctrlKey|metaKey)/s);
  });
});
