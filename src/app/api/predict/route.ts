import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs'; // keep Node runtime for sharp

type ModelResult = { label: 'boy' | 'girl' | 'uncertain'; confidence: number };

// ---- Replace this with your real model call when ready ----
async function predictGenderFromImage(buffer: Buffer): Promise<ModelResult> {
  // Example: POST buffer to your model microservice and return JSON
  // const res = await fetch(process.env.MODEL_URL!, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/octet-stream' },
  //   body: buffer,
  // });
  // return (await res.json()) as ModelResult;

  // Temporary mock so UI works now:
  const label = Math.random() > 0.5 ? 'boy' : 'girl';
  return { label, confidence: 0.76 };
}
// -----------------------------------------------------------

function extractBase64(payload: string) {
  // Accept "data:image/jpeg;base64,...." or plain base64
  const comma = payload.indexOf(',');
  return comma >= 0 ? payload.slice(comma + 1) : payload;
}

export async function POST(req: NextRequest) {
  try {
    const { image } = (await req.json()) as { image?: string };
    if (!image) return NextResponse.json({ error: 'Missing image' }, { status: 400 });

    const base64 = extractBase64(image);
    let buf = Buffer.from(base64, 'base64');

    // Safety: reject very large payloads (after base64 decode)
    if (buf.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    // Normalize server-side (idempotent even if client already did grayscale)
    const normalized = await sharp(buf)
      .rotate() // respect EXIF
      .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
      .grayscale()
      .normalize() // gentle contrast normalization
      .jpeg({ quality: 90 })
      .toBuffer();

    const result = await predictGenderFromImage(normalized);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[api/predict] error:', err);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}