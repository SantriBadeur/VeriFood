import { NextResponse } from 'next/server';
import { reportService } from '@/services/report.service';

export async function GET() {
  try {
    const report = await reportService.getRescuedFoodReport();
    return NextResponse.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

