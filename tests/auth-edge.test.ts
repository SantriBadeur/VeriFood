import { describe, it, expect } from 'vitest';
import { createSessionToken } from '../src/lib/auth';
import { verifySessionTokenEdge } from '../src/lib/auth-edge';

describe('Task 1: auth-edge JWT Verification', () => {
  it('should successfully verify token created with createSessionToken', async () => {
    const payload = {
      id: 'usr_volunteer_01',
      email: 'relawan@sisaberkah.org',
      name: 'Budi Relawan',
      role: 'RELAWAN' as const,
    };
    const token = createSessionToken(payload);

    const verified = await verifySessionTokenEdge(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(payload.id);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe('RELAWAN');
  });

  it('should verify admin token', async () => {
    const payload = {
      id: 'usr_admin_01',
      email: 'admin@sisaberkah.org',
      name: 'Admin Utama',
      role: 'ADMIN' as const,
    };
    const token = createSessionToken(payload);

    const verified = await verifySessionTokenEdge(token);
    expect(verified).not.toBeNull();
    expect(verified?.role).toBe('ADMIN');
  });

  it('should reject tampered token signatures', async () => {
    const token = createSessionToken({
      id: 'usr_02',
      email: 'hacker@evil.org',
      name: 'Fake',
      role: 'ADMIN',
    });
    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}.tamperedsignature123`;

    const verified = await verifySessionTokenEdge(tampered);
    expect(verified).toBeNull();
  });

  it('should return null for malformed tokens', async () => {
    expect(await verifySessionTokenEdge('')).toBeNull();
    expect(await verifySessionTokenEdge('invalid.token')).toBeNull();
    expect(await verifySessionTokenEdge('not-a-jwt')).toBeNull();
  });
});
