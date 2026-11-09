import { NextResponse } from 'next/server';
import { donorService } from '@/services/donor.service';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deleted = await donorService.softDelete(id);
    return NextResponse.json(deleted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

