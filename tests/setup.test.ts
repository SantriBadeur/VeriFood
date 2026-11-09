import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/lib/db';

describe('Database Setup & Seed', () => {
  it('should connect to SQLite database and query admin user', async () => {
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@sisaberkah.org' },
    });
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe('ADMIN');
  });
});
