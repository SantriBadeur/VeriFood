import crypto from 'crypto';
import { prisma } from '../lib/db';
import { hashPassword, verifyPassword, createSessionToken, SessionPayload } from '../lib/auth';
import { Role } from '@prisma/client';
import { auditService } from './audit.service';

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role: Role;
}

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Kredensial tidak valid');
    }

    if (!user.isActive) {
      throw new Error('Akun Anda dinonaktifkan. Silakan hubungi Administrator.');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Kredensial tidak valid');
    }

    const payload: SessionPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = createSessionToken(payload);

    await auditService.record({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email },
    });

    return {
      token,
      user: payload,
    };
  },

  async createUser(input: CreateUserInput, actorUserId?: string) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new Error('Email sudah terdaftar');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: input.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await auditService.record({
      userId: actorUserId,
      action: 'USER_CREATE',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
    });

    return user;
  },

  async toggleActive(userId: string, isActive: boolean, actorUserId?: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    await auditService.record({
      userId: actorUserId,
      action: 'USER_STATUS_CHANGE',
      entity: 'User',
      entityId: user.id,
      details: { isActive },
    });

    return user;
  },

  async listUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async registerVolunteer(input: { name: string; email: string; password: string }) {
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();
    const password = input.password;

    if (!name || name.length < 2) {
      throw new Error('Nama lengkap minimal 2 karakter');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Format email tidak valid');
    }
    if (!password || password.length < 6) {
      throw new Error('Kata sandi minimal 6 karakter');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Email sudah terdaftar');
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: Role.RELAWAN, // Strictly enforced: cannot register as ADMIN
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await auditService.record({
      userId: user.id,
      action: 'USER_REGISTER',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: 'RELAWAN' },
    });

    return user;
  },

  async requestPasswordReset(email: string, origin?: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email wajib diisi');
    }

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, isActive: true },
    });

    // Anti-enumeration: Return success message even if user does not exist
    if (!user) {
      return {
        success: true,
        message: 'Jika email terdaftar, instruksi pengaturan ulang kata sandi telah dikirim.',
      };
    }

    // Invalidate any previously unused reset tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate secure 256-bit random hex token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const baseUrl = origin || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await auditService.record({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUEST',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email },
    });

    return {
      success: true,
      message: 'Jika email terdaftar, instruksi pengaturan ulang kata sandi telah dikirim.',
      devResetUrl: resetUrl,
    };
  },

  async verifyResetToken(token: string) {
    if (!token) {
      throw new Error('Token reset kata sandi tidak valid');
    }

    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new Error('Tautan pengaturan ulang kata sandi tidak valid atau telah kedaluwarsa');
    }

    if (tokenRecord.usedAt !== null) {
      throw new Error('Tautan pengaturan ulang kata sandi tidak valid atau telah kedaluwarsa');
    }

    if (tokenRecord.expiresAt.getTime() < Date.now()) {
      throw new Error('Tautan pengaturan ulang kata sandi tidak valid atau telah kedaluwarsa');
    }

    if (!tokenRecord.user || !tokenRecord.user.isActive) {
      throw new Error('Akun tidak ditemukan atau tidak aktif');
    }

    return {
      valid: true,
      email: tokenRecord.user.email,
      userId: tokenRecord.userId,
    };
  },

  async resetPasswordWithToken(token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Kata sandi minimal 6 karakter');
    }

    const { userId } = await this.verifyResetToken(token);

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    await auditService.record({
      userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entity: 'User',
      entityId: userId,
      details: { timestamp: new Date().toISOString() },
    });

    return { success: true, message: 'Kata sandi berhasil diatur ulang' };
  },
};

// Aliases for tests & direct service calls
export const loginUser = authService.login;
export const createUser = authService.createUser;
export const toggleUserActive = authService.toggleActive;
export const registerVolunteer = authService.registerVolunteer;
export const requestPasswordReset = authService.requestPasswordReset;
export const verifyResetToken = authService.verifyResetToken;
export const resetPasswordWithToken = authService.resetPasswordWithToken;

