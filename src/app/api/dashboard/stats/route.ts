import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard.service';

export async function GET() {
  try {
    const stats = await dashboardService.getStats();
    return NextResponse.json(stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
