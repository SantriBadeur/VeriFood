import { NextResponse } from 'next/server';
import { foodService } from '@/services/food.service';

export async function GET() {
  try {
    const items = await foodService.getFEFODashboard();
    return NextResponse.json(items);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

