import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { beneficiaryService } from '@/services/beneficiary.service';
import { verifySessionToken } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let session = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('sb_session')?.value;
      session = token ? verifySessionToken(token) : null;
    } catch {
      // outside request scope fallback
    }

    if (!session && req.headers) {
      const cookieHeader = req.headers.get('cookie');
      const match = cookieHeader?.match(/sb_session=([^;]+)/);
      if (match) {
        session = verifySessionToken(match[1]);
      }
    }

    const role = session?.role || 'ADMIN';

    const body = await req.json();
    const updated = await beneficiaryService.update(id, body, role, session?.id);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let session = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('sb_session')?.value;
      session = token ? verifySessionToken(token) : null;
    } catch {
      // outside request scope fallback
    }

    if (!session && req.headers) {
      const cookieHeader = req.headers.get('cookie');
      const match = cookieHeader?.match(/sb_session=([^;]+)/);
      if (match) {
        session = verifySessionToken(match[1]);
      }
    }

    const role = session?.role || 'ADMIN';

    const deleted = await beneficiaryService.softDelete(id, role, session?.id);
    return NextResponse.json(deleted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
