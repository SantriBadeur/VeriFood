import { NextResponse } from 'next/server';
import { auditService } from '@/services/audit.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');

    const startDate = startParam ? new Date(startParam) : undefined;
    const endDate = endParam ? new Date(endParam) : undefined;

    const logs = await auditService.getLogs({ entity, page, limit, startDate, endDate });
    return NextResponse.json(logs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

