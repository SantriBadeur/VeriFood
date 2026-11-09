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
};

// Aliases for tests & direct service calls
export const loginUser = authService.login;
export const createUser = authService.createUser;
export const toggleUserActive = authService.toggleActive;

