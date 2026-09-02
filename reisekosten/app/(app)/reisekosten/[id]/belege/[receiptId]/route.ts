import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/dal';
import { findReceiptById, getReceiptFile, getTripById } from '@/lib/repo/trips';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; receiptId: string }> }
) {
  const { id, receiptId } = await params;
  const user = await requireUser();

  const trip = await getTripById(id);
  const receipt = await findReceiptById(receiptId);
  if (!trip || !receipt || receipt.tripId !== id) {
    return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 });
  }

  const isOwner = trip.employeeId === user.id;
  const isApprover = user.isApprover || user.isAdmin;
  if (!isOwner && !isApprover) {
    return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 });
  }

  const file = await getReceiptFile(receiptId);
  if (!file) {
    return NextResponse.json({ error: 'Kein Beleg hinterlegt.' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.fileName)}"`,
    },
  });
}
