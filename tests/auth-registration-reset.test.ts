import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../src/services/auth.service';
import { prisma } from '../src/lib/db';

describe('Auth Service - Registration & Password Reset', () => {
  const testEmail = `volunteer_${Date.now()}@test.org`;
  const initialPassword = 'password123';
  const newPassword = 'newSecretPassword456';

  it('registerVolunteer: registers a volunteer with role RELAWAN and isActive=true', async () => {
    const user = await authService.registerVolunteer({
      name: 'Relawan Baru',
      email: testEmail,
      password: initialPassword,
    });

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail.toLowerCase());
    expect(user.role).toBe('RELAWAN');
    expect(user.isActive).toBe(true);

    // Verify user can now log in
    const loginRes = await authService.login(testEmail, initialPassword);
    expect(loginRes.token).toBeDefined();
    expect(loginRes.user.role).toBe('RELAWAN');
  });

  it('registerVolunteer: rejects duplicate email with descriptive error', async () => {
    await expect(
      authService.registerVolunteer({
        name: 'Relawan Duplikat',
        email: testEmail,
        password: 'anotherpassword',
      })
    ).rejects.toThrow('Email sudah terdaftar');
  });

  it('registerVolunteer: rejects passwords shorter than 6 characters', async () => {
    await expect(
      authService.registerVolunteer({
        name: 'Short Pass',
        email: `short_${Date.now()}@test.org`,
        password: '123',
      })
    ).rejects.toThrow('Kata sandi minimal 6 karakter');
  });

  it('requestPasswordReset: non-existent email returns success message without leaking presence', async () => {
    const res = await authService.requestPasswordReset('nonexistent@nowhere.com');
    expect(res.success).toBe(true);
    expect(res.message).toBe('Jika email terdaftar, instruksi pengaturan ulang kata sandi telah dikirim.');
    expect(res.devResetUrl).toBeUndefined();
  });

  it('requestPasswordReset: valid email creates token with 1-hour expiry', async () => {
    const res = await authService.requestPasswordReset(testEmail, 'http://localhost:3000');
    expect(res.success).toBe(true);
    expect(res.devResetUrl).toBeDefined();
    expect(res.devResetUrl).toContain('/reset-password?token=');

    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { user: { email: testEmail }, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    expect(tokenRecord).not.toBeNull();
    expect(tokenRecord?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('verifyResetToken: accepts valid fresh token and rejects expired/used token', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).not.toBeNull();

    // Valid token
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: user!.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    expect(tokenRecord).not.toBeNull();

    const verified = await authService.verifyResetToken(tokenRecord!.token);
    expect(verified.valid).toBe(true);
    expect(verified.email).toBe(testEmail);

    // Expired token test
    const expiredToken = `expired_token_${Date.now()}`;
    await prisma.passwordResetToken.create({
      data: {
        token: expiredToken,
        userId: user!.id,
        expiresAt: new Date(Date.now() - 1000 * 60), // 1 minute ago
      },
    });

    await expect(authService.verifyResetToken(expiredToken)).rejects.toThrow(
      'Tautan pengaturan ulang kata sandi tidak valid atau telah kedaluwarsa'
    );
  });

  it('resetPasswordWithToken: updates password hash, marks token used, blocks replay, and allows login with new password', async () => {
    await authService.requestPasswordReset(testEmail);
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: user!.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    expect(tokenRecord).not.toBeNull();

    const resetRes = await authService.resetPasswordWithToken(tokenRecord!.token, newPassword);
    expect(resetRes.success).toBe(true);

    // Token must now be marked used
    const updatedToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenRecord!.token },
    });
    expect(updatedToken?.usedAt).not.toBeNull();

    // Replay attempt must fail
    await expect(authService.resetPasswordWithToken(tokenRecord!.token, 'anotherOne123')).rejects.toThrow(
      'Tautan pengaturan ulang kata sandi tidak valid atau telah kedaluwarsa'
    );

    // Old password must fail
    await expect(authService.login(testEmail, initialPassword)).rejects.toThrow('Kredensial tidak valid');

    // New password must succeed
    const newLogin = await authService.login(testEmail, newPassword);
    expect(newLogin.token).toBeDefined();
    expect(newLogin.user.email).toBe(testEmail);
  });
});
