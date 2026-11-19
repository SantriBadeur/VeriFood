import { NextResponse } from 'next/server';
import { foodService } from '@/services/food.service';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { stockId, reason } = await req.json();
    const disposed = await foodService.disposeStock(stockId, reason, user.id);
    return NextResponse.json(disposed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
