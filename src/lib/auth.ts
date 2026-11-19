import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'sisaberkah-super-secret-jwt-key-2026';

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(user: SessionPayload): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: Request): Promise<SessionPayload | null> {
  let token: string | undefined;

  // 1. Try reading from Next.js server cookie store (when invoked in Next.js request context)
  try {
    const cookieStore = await cookies();
    token = cookieStore.get('sb_session')?.value;
  } catch {
    // Falls through when running outside Next.js requestAsyncStorage (e.g. direct test calls)
  }

  // 2. Fallback to Request headers (for testing or external API callers)
  if (!token && req && req.headers) {
    const cookieHeader = req.headers.get('cookie');
    const match = cookieHeader?.match(/sb_session=([^;]+)/);
    if (match) {
      token = match[1];
    } else {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}
