import { NextResponse } from 'next/server';
import { distributionService } from '@/services/distribution.service';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, recipientName, proofPhoto, signatureData } = body;

    const updated = await distributionService.updateStatus(id, status, user.id, {
      recipientName,
      proofPhoto,
      signatureData,
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
