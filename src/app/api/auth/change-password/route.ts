import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { authService } from '@/services/auth.service';

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body || {};

    const result = await authService.changePassword(sessionUser.id, currentPassword, newPassword);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
