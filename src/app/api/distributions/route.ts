import { NextResponse } from 'next/server';
import { distributionService } from '@/services/distribution.service';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await distributionService.list({ page, limit });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const userId = admin?.id || 'admin';

    const dist = await distributionService.createSchedule(body, userId);
    return NextResponse.json(dist, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

