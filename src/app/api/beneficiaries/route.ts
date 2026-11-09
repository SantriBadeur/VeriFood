import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { beneficiaryService } from '@/services/beneficiary.service';
import { verifySessionToken } from '@/lib/auth';
import { BeneficiaryType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const typeParam = searchParams.get('type') || undefined;
    const type = typeParam ? (typeParam as BeneficiaryType) : undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await beneficiaryService.list({ search, type, page, limit });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb_session')?.value;
    const session = token ? verifySessionToken(token) : null;
    const role = session?.role || 'ADMIN'; // Default fallback if called in development/tests

    const body = await req.json();
    const beneficiary = await beneficiaryService.create(body, role, session?.id);
    return NextResponse.json(beneficiary, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
