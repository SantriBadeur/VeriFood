import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Active food stocks expiring between past 24 hours (unhandled) and 2 hours in the future
    const candidateStocks = await prisma.foodStock.findMany({
      where: {
        physicalStatus: 'DITERIMA',
        isDisposed: false,
        remainingQuantity: { gt: 0 },
        expiryAt: {
          lte: twoHoursLater,
        },
      },
      include: {
        donor: { select: { id: true, name: true } },
        distributionItems: {
          where: {
            distribution: {
              status: 'TERJADWAL',
            },
          },
          select: { quantity: true },
        },
      },
      orderBy: { expiryAt: 'asc' },
    });

    const criticalItems = [];

    for (const stock of candidateStocks) {
      const reservedQty = stock.distributionItems.reduce((acc, curr) => acc + curr.quantity, 0);
      const unreservedQuantity = stock.remainingQuantity - reservedQty;

      if (unreservedQuantity > 0) {
        const diffMs = new Date(stock.expiryAt).getTime() - now.getTime();
        const minutesLeft = Math.round(diffMs / 60000);

        criticalItems.push({
          id: stock.id,
          name: stock.name,
          unit: stock.unit,
          remainingQuantity: stock.remainingQuantity,
          unreservedQuantity,
          expiryAt: stock.expiryAt,
          minutesLeft,
          donorName: stock.donor?.name || 'Donatur',
        });
      }
    }

    return NextResponse.json({
      count: criticalItems.length,
      criticalItems,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
