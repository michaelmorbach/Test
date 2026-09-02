import fs from 'node:fs/promises';
import path from 'node:path';

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

function safeExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : '';
}

export async function saveReceiptFile(
  tripId: string,
  receiptId: string,
  file: File
): Promise<{ dateiPfad: string; dateiName: string }> {
  const dir = path.join(UPLOADS_ROOT, tripId);
  await fs.mkdir(dir, { recursive: true });
  const storedName = `${receiptId}${safeExtension(file.name)}`;
  const filePath = path.join(dir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return { dateiPfad: path.join(tripId, storedName), dateiName: file.name };
}

export async function readUploadedFile(relativePath: string): Promise<Buffer> {
  const resolved = path.join(UPLOADS_ROOT, relativePath);
  if (!resolved.startsWith(UPLOADS_ROOT)) {
    throw new Error('Ungültiger Dateipfad.');
  }
  return fs.readFile(resolved);
}

export async function deleteUploadedFile(relativePath: string): Promise<void> {
  const resolved = path.join(UPLOADS_ROOT, relativePath);
  if (!resolved.startsWith(UPLOADS_ROOT)) return;
  await fs.rm(resolved, { force: true });
}
