import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/dal';
import { findReceiptById, getTripById } from '@/lib/repo/trips';
import { readUploadedFile } from '@/lib/uploads';

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; receiptId: string }> }
) {
  const { id, receiptId } = await params;
  const user = await requireUser();

  const trip = getTripById(id);
  const receipt = findReceiptById(receiptId);
  if (!trip || !receipt || receipt.tripId !== id) {
    return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 });
  }

  const isOwner = trip.employeeId === user.id;
  const isApprover = user.isApprover || user.isAdmin;
  if (!isOwner && !isApprover) {
    return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 });
  }

  if (!receipt.dateiPfad) {
    return NextResponse.json({ error: 'Kein Beleg hinterlegt.' }, { status: 404 });
  }

  const buffer = await readUploadedFile(receipt.dateiPfad);
  const extension = receipt.dateiPfad.slice(receipt.dateiPfad.lastIndexOf('.')).toLowerCase();
  const contentType = CONTENT_TYPES[extension] ?? 'application/octet-stream';
  const fileName = receipt.dateiName ?? 'beleg';

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}
