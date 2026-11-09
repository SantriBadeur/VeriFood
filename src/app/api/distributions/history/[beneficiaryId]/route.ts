import { NextResponse } from 'next/server';
import { distributionService } from '@/services/distribution.service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ beneficiaryId: string }> }
) {
  try {
    const { beneficiaryId } = await params;
    const history = await distributionService.getHistoryByBeneficiary(beneficiaryId);
    return NextResponse.json(history);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

