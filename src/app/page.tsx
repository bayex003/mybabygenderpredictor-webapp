'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Nav from '../components/Nav';
import Dropzone from '../components/Dropzone';
import Modal from '../components/Modal';
import TrustBadges from '../components/TrustBadges';

type Result = { label: 'boy' | 'girl' | 'uncertain'; confidence: number };

// --- Performance knobs ---
const MAX_SIDE = 1024; // downscale longest side before upload (768–1280 are fine)
const VALIDATOR_SIZE = 128; // speed up heuristic validator (was 160)
const EDGE_THRESHOLD = 0.015; // lower = more permissive, higher = stricter (try 0.012–0.02)

export default function Page() {
  const [result, setResult] = useState<Result | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Expose an opener for “Upload Scan”/“Get started” buttons
  useEffect(() => {
    (window as any).openUpload = () => {
      document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
    };
  }, []);

  const confidenceText = useMemo(() => {
    if (!result) return '';
    if (result.label === 'uncertain') return 'We’re not confident this time.';
    return 'This is a playful guess. Results may vary.';
  }, [result]);

  /** Called when Dropzone validates the file locally */
  const handleValid = async (file: File) => {
    setBanner(null);
    setProcessing(true);
    try {
      // 1) Load into an oriented <img> so client-side processing uses the right rotation
      const img = await loadImageOriented(file);

      // 2) Content-based validation (ultrasound-like texture)
      const looksLikeScan = await validateUltrasound(img);
      if (!looksLikeScan) {
        setBanner("This doesn't appear to be a baby scan. Please upload a clearer ultrasound image.");
        return;
      }

      // 3) Normalize client-side: downscale + convert to grayscale
      const grayDataUrl = await toGrayscale(imageFitToMaxSide(img, MAX_SIDE));

      // 4) Call server model
      const resp = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: grayDataUrl }),
      });
      if (!resp.ok) {
        const detail = await safeMessage(resp);
        throw new Error(detail || 'Prediction failed.');
      }

      const data = (await resp.json()) as Result;

      // Optional mapping: treat very low confidence as uncertain
      const normalized: Result =
        data.confidence < 0.55 ? { label: 'uncertain', confidence: data.confidence } : data;

      setResult(normalized);
      setIsOpen(true);
    } catch (err: any) {
      console.error('[upload] error:', err);
      setBanner(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  /** Called when Dropzone fails basic client checks (type/size/etc) */
  const handleInvalid = (msg: string) => setBanner(msg);

  const handleResultClose = () => setIsOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fdfaff] to-[#faf7ff] text-gray-800">
      {/* NAV */}
      <Nav />

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Discover Your <span className="text-[#9B80FF]">Baby’s Gender</span>
          </h1>
          <p className="mt-4 text-gray-700">
            Upload a clear ultrasound side-profile and get a <b>playful AI-assisted guess</b> in seconds.
            This is an <b>entertainment experience</b>, not a medical service.
          </p>

          <div className="mt-6">
            <a
              href="#upload"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
                (window as any).openUpload?.();
              }}
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#5EAaff] to-[#FF7BC8] text-white rounded-full font-medium shadow-md hover:opacity-90 transition"
            >
              Upload Scan
            </a>
          </div>

          <TrustBadges />
          <p className="mt-2 text-xs text-gray-500">Images are processed transiently in memory and not stored.</p>
        </div>

        <div className="justify-self-center">
          <img
            src="/examples/ultrasound_test.png"
            alt="Baby ultrasound"
            className="w-[320px] md:w-[420px] h-auto rounded-2xl shadow-lg border border-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/favicon.ico';
            }}
          />
        </div>
      </section>

      {/* UPLOAD SECTION */}
      <section id="upload" className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-3xl font-semibold mb-2">Upload Your Ultrasound Scan</h2>
        <p className="text-gray-600 mb-8">
          Use a <b>clear side profile</b> (not front/back). JPG or PNG, up to 8MB.
        </p>

        {/* Retry / error banner */}
        {banner && (
          <div className="mx-auto mb-4 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-rose-700 flex items-start justify-between gap-3">
            <span>{banner}</span>
            <button
              type="button"
              className="text-sm font-medium underline"
              onClick={() => setBanner(null)}
            >
              Retry
            </button>
          </div>
        )}

        <div className="mx-auto max-w-3xl">
          {/* If your Dropzone supports maxSize, keep it. Adjust as you like. */}
          <Dropzone onValid={handleValid} onInvalid={handleInvalid} maxSize={8 * 1024 * 1024} />
          {processing && <div className="mt-3 text-sm text-gray-600">Processing…</div>}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-gradient-to-r from-[#f6f3ff] to-[#fef6fb] py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-semibold mb-2">How It Works</h2>
          <p className="text-gray-600 mb-10">Simple and privacy-first.</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-soft p-8">
              <h3 className="text-lg font-semibold mb-2 text-[#9B80FF]">1. Upload</h3>
              <p className="text-gray-600">
                Provide a clear ultrasound side-profile (JPG/PNG). We don’t store images.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-soft p-8">
              <h3 className="text-lg font-semibold mb-2 text-[#9B80FF]">2. Process</h3>
              <p className="text-gray-600">
                We briefly process the image in memory to produce a fun, AI-assisted guess.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-soft p-8">
              <h3 className="text-lg font-semibold mb-2 text-[#9B80FF]">3. Result</h3>
              <p className="text-gray-600">
                See a playful prediction. If unclear, we’ll say “Uncertain”.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RESULT MODAL */}
      <Modal isOpen={isOpen} onClose={handleResultClose}>
        {result ? (
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Your playful prediction</h3>
            <p className="text-lg">
              {result.label === 'uncertain' ? (
                <>Uncertain this time — try another scan if you have one.</>
              ) : (
                <>
                  Looks like{' '}
                  <b className={result.label === 'boy' ? 'text-blue-600' : 'text-pink-600'}>
                    {result.label}
                  </b>
                  !
                </>
              )}
            </p>
            <p className="mt-2 text-sm text-gray-600">{confidenceText}</p>
            <p className="mt-2 text-sm text-gray-600">
              Confidence: {Math.round((result.confidence ?? 0) * 100)}%
            </p>
            <p className="mt-2 text-xs text-gray-500">Not medical advice.</p>
          </div>
        ) : (
          <p className="text-sm text-gray-600 text-center">No result yet.</p>
        )}
      </Modal>

      {/* FOOTER */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p>
            © {new Date().getFullYear()} My Baby Gender Predictor — entertainment only · not medical advice.
          </p>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/terms" className="hover:underline">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Helper: pull a useful error message from a non-2xx response */
async function safeMessage(resp: Response): Promise<string | null> {
  try {
    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = await resp.json().catch(() => null);
      return (j as any)?.detail || (j as any)?.message || null;
    }
    const t = await resp.text().catch(() => '');
    return t || null;
  } catch {
    return null;
  }
}

/** ── Helpers for content-based validation & preprocessing ───────────────── */

/** Load with EXIF orientation applied when possible */
async function loadImageOriented(file: File): Promise<HTMLImageElement> {
  // Modern path: createImageBitmap can respect EXIF with imageOrientation
  if ('createImageBitmap' in window) {
    try {
      // @ts-expect-error: imageOrientation is still experimental in some TS libs
      const bitmap = await createImageBitmap(file as any, { imageOrientation: 'from-image' });
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      const url = canvas.toDataURL('image/jpeg', 0.92);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      return img;
    } catch {
      // fall back below
    }
  }
  // Legacy path (may ignore EXIF on some browsers)
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/** Downscale to MAX_SIDE while keeping aspect ratio, returned as an <img>-like via canvas */
function imageFitToMaxSide(image: HTMLImageElement, maxSide: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const w = Math.max(1, Math.round(image.width * scale));
  const h = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0, w, h);
  return canvas;
}

/** Convert an <img> or canvas to grayscale DataURL (JPEG) */
async function toGrayscale(imgOrCanvas: HTMLImageElement | HTMLCanvasElement): Promise<string> {
  const w = (imgOrCanvas as HTMLCanvasElement).width || (imgOrCanvas as HTMLImageElement).naturalWidth || (imgOrCanvas as HTMLImageElement).width;
  const h = (imgOrCanvas as HTMLCanvasElement).height || (imgOrCanvas as HTMLImageElement).naturalHeight || (imgOrCanvas as HTMLImageElement).height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imgOrCanvas as any, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = y;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.9);
}

/** Ultrasound-like heuristic: edge density on a small grayscale downscale */
async function validateUltrasound(image: HTMLImageElement): Promise<boolean> {
  const w = VALIDATOR_SIZE, h = VALIDATOR_SIZE;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = w; canvas.height = h;
  ctx.drawImage(image, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // quick grayscale in-place
  for (let i = 0; i < data.length; i += 4) {
    const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = y;
  }
  ctx.putImageData(imgData, 0, 0);

  // simple gradient-based edge count
  const lumAt = (x: number, y: number) => data[(y * w + x) * 4];
  let edges = 0;
  for (let yy = 0; yy < h - 1; yy++) {
    for (let xx = 0; xx < w - 1; xx++) {
      const a = lumAt(xx, yy);
      const b = lumAt(xx + 1, yy);
      const c = lumAt(xx, yy + 1);
      if (Math.abs(a - b) > 20 || Math.abs(a - c) > 20) edges++;
    }
  }
  const edgeDensity = edges / (w * h);
  return edgeDensity > EDGE_THRESHOLD;
}