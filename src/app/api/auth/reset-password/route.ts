import { NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token reset kata sandi wajib disertakan' },
        { status: 400 }
      );
    }

    const verification = await authService.verifyResetToken(token);
    return NextResponse.json(verification, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Token tidak valid atau kedaluwarsa';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token dan kata sandi baru wajib diisi' },
        { status: 400 }
      );
    }

    const result = await authService.resetPasswordWithToken(token, password);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
