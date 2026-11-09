import { NextResponse } from 'next/server';
import { beneficiaryService } from '@/services/beneficiary.service';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deleted = await beneficiaryService.softDelete(id, 'ADMIN');
    return NextResponse.json(deleted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

