'use server';

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { requireUser } from '@/lib/dal';

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

const ExtractedReceiptSchema = z.object({
  haendler: z.string().describe('Name des Händlers/Geschäfts, wie auf dem Beleg angegeben'),
  betrag: z
    .string()
    .describe('Gesamtbetrag (Bruttobetrag) als Dezimalzahl mit Komma, z. B. "12,50"'),
  belegDatum: z.string().describe('Belegdatum im Format YYYY-MM-DD'),
  kategorie: z
    .enum(['FAHRT', 'UEBERNACHTUNG', 'VERPFLEGUNG', 'SONSTIGES'])
    .describe('Am besten passende Kategorie für eine Reisekostenabrechnung'),
});

export interface OcrResult {
  error?: string;
  data?: z.infer<typeof ExtractedReceiptSchema>;
}

export async function extractReceiptAction(formData: FormData): Promise<OcrResult> {
  await requireUser();

  const file = formData.get('beleg');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Bitte zuerst eine Datei auswählen.' };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: 'Automatisches Auslesen ist nicht konfiguriert (ANTHROPIC_API_KEY fehlt).' };
  }

  const isPdf = file.type === 'application/pdf';
  const isSupportedImage = (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(file.type);
  if (!isPdf && !isSupportedImage) {
    return { error: 'Nur Fotos (JPEG/PNG/WebP/GIF) oder PDF werden für das automatische Auslesen unterstützt.' };
  }

  try {
    const client = new Anthropic();
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');

    const content: Anthropic.Messages.ContentBlockParam[] = [
      isPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
        : {
            type: 'image',
            source: { type: 'base64', media_type: file.type as SupportedImageType, data: base64 },
          },
      {
        type: 'text',
        text: 'Lies diesen Reisekosten-Beleg aus und extrahiere Händler, Gesamtbetrag, Belegdatum und eine passende Kategorie. Wenn ein Wert nicht sicher erkennbar ist, mach eine plausible beste Schätzung.',
      },
    ];

    const response = await client.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
      output_config: { format: zodOutputFormat(ExtractedReceiptSchema) },
    });

    if (!response.parsed_output) {
      return { error: 'Beleg konnte nicht automatisch ausgelesen werden. Bitte Felder manuell ausfüllen.' };
    }
    return { data: response.parsed_output };
  } catch (error) {
    console.error('OCR-Fehler beim Auslesen des Belegs:', error);
    return { error: 'Beleg konnte nicht automatisch ausgelesen werden. Bitte Felder manuell ausfüllen.' };
  }
}
