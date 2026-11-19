import { describe, it, expect } from 'vitest';
import { getSessionUser, createSessionToken } from '../src/lib/auth';

describe('Task 3: getSessionUser Universal Session Extraction', () => {
  const testUser = {
    id: 'user_test_99',
    email: 'user99@sisaberkah.org',
    name: 'User 99',
    role: 'RELAWAN' as const,
  };
  const token = createSessionToken(testUser);

  it('should extract session from Request Cookie header', async () => {
    const req = new Request('http://localhost:3000/api/test', {
      headers: {
        cookie: `other=123; sb_session=${token}; another=456`,
      },
    });

    const session = await getSessionUser(req);
    expect(session).not.toBeNull();
    expect(session?.id).toBe(testUser.id);
    expect(session?.email).toBe(testUser.email);
    expect(session?.role).toBe('RELAWAN');
  });

  it('should extract session from Authorization Bearer header', async () => {
    const req = new Request('http://localhost:3000/api/test', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const session = await getSessionUser(req);
    expect(session).not.toBeNull();
    expect(session?.id).toBe(testUser.id);
    expect(session?.role).toBe('RELAWAN');
  });

  it('should return null when no token is present', async () => {
    const req = new Request('http://localhost:3000/api/test');
    const session = await getSessionUser(req);
    expect(session).toBeNull();
  });

  it('should return null for invalid or tampered token', async () => {
    const req = new Request('http://localhost:3000/api/test', {
      headers: {
        cookie: 'sb_session=invalid.tampered.token',
      },
    });
    const session = await getSessionUser(req);
    expect(session).toBeNull();
  });
});
