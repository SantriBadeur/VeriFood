import { NextResponse } from 'next/server';
import { foodService } from '@/services/food.service';
import { getSessionUser } from '@/lib/auth';

/**
 * POST /api/food/inbound/batch
 * Batch ingestion endpoint for multi-item catering donations
 */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await req.json();
    const foods = await foodService.createBatchInbound(body, user.id);
    return NextResponse.json({ success: true, count: foods.length, data: foods }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
