import { NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    const user = await authService.registerVolunteer({ name, email, password });
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat pendaftaran';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

