import { NextResponse } from 'next/server';
import { foodService } from '@/services/food.service';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Admin yang dapat mengoreksi metadata makanan.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await foodService.updateMetadata(
      id,
      {
        name: body.name,
        donorId: body.donorId,
        expiryAt: body.expiryAt,
        notes: body.notes,
      },
      user.id,
      user.role
    );

    return NextResponse.json({ success: true, food: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
