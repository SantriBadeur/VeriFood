import { NextResponse } from 'next/server';
import { foodService } from '@/services/food.service';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Admin yang dapat mengoreksi stok makanan' },
        { status: 403 }
      );
    }

    const { stockId, newInitialQty } = await req.json();
    const updated = await foodService.correctStock(stockId, newInitialQty, user.id, user.role);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
