import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createHash } from 'crypto';

export const runtime = 'nodejs';

type ModelResult = { label: 'boy' | 'girl' | 'uncertain'; confidence: number };

// Deterministic mock based on normalized pixels
function chooseDeterministicResult(buf: Buffer): ModelResult {
  const h = createHash('sha256').update(buf).digest();
  const first = h[0];
  const second = h[1];

  const label: 'boy' | 'girl' = (first % 2 === 0) ? 'boy' : 'girl';
  const confidence = 0.60 + (second / 255) * 0.30; // 0.60–0.90

  return { label, confidence };
}

function extractBase64(payload: string) {
  const comma = payload.indexOf(',');
  return comma >= 0 ? payload.slice(comma + 1) : payload;
}

export async function POST(req: NextRequest) {
  try {
    const { image } = (await req.json()) as { image?: string; hash?: string };
    if (!image) return NextResponse.json({ error: 'Missing image' }, { status: 400 });

    const base64 = extractBase64(image);
    let buf = Buffer.from(base64, 'base64');
    if (buf.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    // Stable server-side normalization
    const normalized = await sharp(buf)
      .rotate()
      .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
      .grayscale()
      .normalize()
      .jpeg({ quality: 90 })
      .toBuffer();

    // Deterministic result from normalized pixels
    const result = chooseDeterministicResult(normalized);

    // Optional: map very low confidences to 'uncertain'
    const final: ModelResult = result.confidence < 0.55
      ? { label: 'uncertain', confidence: result.confidence }
      : result;

    return NextResponse.json(final, { status: 200 });
  } catch (err) {
    console.error('[api/predict] error:', err);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}