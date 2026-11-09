import { describe, it, expect } from 'vitest';
import { loginUser, createUser, toggleUserActive } from '../src/services/auth.service';

describe('Auth Service (US-01, US-02)', () => {
  it('should reject invalid password', async () => {
    await expect(loginUser('admin@sisaberkah.org', 'wrongpass')).rejects.toThrow('Kredensial tidak valid');
  });

  it('should authenticate valid credentials and return user role', async () => {
    const result = await loginUser('admin@sisaberkah.org', 'admin123');
    expect(result.user.role).toBe('ADMIN');
    expect(result.token).toBeDefined();
  });

  it('should block deactivated accounts from logging in', async () => {
    const email = `test_inactive_${Date.now()}@sisaberkah.org`;
    const newUser = await createUser({
      email,
      name: 'Test Inactive',
      password: 'password123',
      role: 'RELAWAN',
    });
    await toggleUserActive(newUser.id, false);
    await expect(loginUser(email, 'password123')).rejects.toThrow('Akun Anda dinonaktifkan');
  });
});
