import { NextResponse } from 'next/server';
import { distributionService } from '@/services/distribution.service';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const userId = admin?.id || 'admin';

    const updated = await distributionService.updateStatus(id, status, userId);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

