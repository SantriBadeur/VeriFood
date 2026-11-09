import { NextResponse } from 'next/server';
import { foodService } from '@/services/food.service';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { stockId, reason } = await req.json();
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const userId = admin?.id || 'admin';

    const disposed = await foodService.disposeStock(stockId, reason, userId);
    return NextResponse.json(disposed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

