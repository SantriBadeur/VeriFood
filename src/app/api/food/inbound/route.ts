import { NextResponse } from 'next/server';
import { foodService } from '@/services/food.service';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const userId = admin?.id || 'system';

    const food = await foodService.recordInbound(body, userId);
    return NextResponse.json(food, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

