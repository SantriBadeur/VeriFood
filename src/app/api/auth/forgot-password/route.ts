import { NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const url = new URL(req.url);
    const origin = url.origin;

    const result = await authService.requestPasswordReset(email, origin);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses permintaan reset kata sandi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

