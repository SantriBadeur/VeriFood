import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveTheme } from '@/lib/theme-context';

describe('Theme Resolution & Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves explicit stored preference "dark"', () => {
    const theme = resolveTheme('dark', false);
    expect(theme).toBe('dark');
  });

  it('resolves explicit stored preference "light"', () => {
    const theme = resolveTheme('light', true);
    expect(theme).toBe('light');
  });

  it('falls back to system dark preference when no stored value is set', () => {
    const theme = resolveTheme(null, true);
    expect(theme).toBe('dark');
  });

  it('falls back to light when no stored preference and system is not dark', () => {
    const theme = resolveTheme(null, false);
    expect(theme).toBe('light');
  });
});
