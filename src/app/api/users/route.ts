import { NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Admin yang dapat melihat daftar pengguna' },
        { status: 403 }
      );
    }

    const users = await authService.listUsers();
    return NextResponse.json(users);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Admin yang dapat membuat pengguna' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const newUser = await authService.createUser(body);
    return NextResponse.json(newUser, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Admin yang dapat mengubah status pengguna' },
        { status: 403 }
      );
    }

    const { userId, isActive } = await req.json();
    const updated = await authService.toggleActive(userId, isActive);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
