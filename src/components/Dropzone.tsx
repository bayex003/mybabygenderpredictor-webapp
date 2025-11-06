'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';

type Result = { label: 'boy' | 'girl' | 'uncertain'; confidence: number };
type Props = {
  onResult: (res: Result | null) => void;
  onInvalid?: (message: string) => void; // optional
};

const MAX_MB = 8;
const ACCEPT = ['image/png', 'image/jpeg'];
// If validator confidence is below this, we won't guess.
const UNCERTAIN_THRESHOLD = 0.15;

/** Stable fingerprint -> same image maps to same result every time */
async function fingerprintFile(file: File): Promise<Uint8Array> {
  const head = await file.slice(0, 128 * 1024).arrayBuffer();
  const hashBuf = await crypto.subtle.digest('SHA-256', head);
  return new Uint8Array(hashBuf);
}

function stableGuessFromFingerprint(fp: Uint8Array): Result {
  const b0 = fp[0] ?? 0;
  const b1 = fp[1] ?? 0;
  const label: Result['label'] = (b0 % 2 === 0) ? 'boy' : 'girl';
  const confidence = 0.62 + (b1 / 255) * 0.30; // ~62–92%
  return { label, confidence: Number(confidence.toFixed(2)) };
}

export default function Dropzone({ onResult, onInvalid }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (window as any).openUpload = () => inputRef.current?.click();
  }, []);

  const notifyInvalid = (msg: string) => {
    if (onInvalid) onInvalid(msg);
    else alert(msg);
  };

  const validateFile = (f: File) => {
    if (!ACCEPT.includes(f.type)) return { ok: false, reason: 'Only JPG/PNG are supported.' };
    if (f.size > MAX_MB * 1024 * 1024) return { ok: false, reason: `Max file size is ${MAX_MB}MB.` };
    return { ok: true as const, reason: '' };
  };

  const classify = async (file: File) => {
    const url = process.env.NEXT_PUBLIC_VALIDATOR_URL || '';
    if (!url) {
      notifyInvalid('Validator URL is not configured. Set NEXT_PUBLIC_VALIDATOR_URL in .env.local and restart.');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    setBusy(true);
    try {
      const res = await fetch(url, { method: 'POST', body: fd });
      const ct = res.headers.get('content-type') || '';
      const raw = await res.text();

      let data: any = null;
      if (ct.includes('application/json')) {
        try { data = JSON.parse(raw); } catch {}
      } else {
        console.error('[Dropzone] Non-JSON response', res.status, raw.slice(0, 200));
      }

      if (!res.ok) {
        const msg = (data && (data.detail || data.message)) || `Upload failed (${res.status}).`;
        notifyInvalid(`${msg}\n\nPlease upload a clear grayscale ultrasound side profile (side view, not front/back).`);
        return;
      }

      // Expect validator to return: { status, label, confidence, message }
      const isUltrasound = data?.label === 'ultrasound_side';
      const validatorConf = Number(data?.confidence ?? 0) || 0;

      if (!isUltrasound || validatorConf < UNCERTAIN_THRESHOLD) {
        onResult({ label: 'uncertain', confidence: 0 });
        return;
      }

      // Deterministic playful guess
      const fp = await fingerprintFile(file);
      const stable = stableGuessFromFingerprint(fp);
      onResult(stable);

    } catch (e) {
      console.error('[Dropzone] network error', e);
      notifyInvalid('Network error. Please try again.');
      onResult({ label: 'uncertain', confidence: 0 });
    } finally {
      setBusy(false);
    }
  };

  const onSelect = (file: File) => classify(file);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (busy) return;
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const verdict = validateFile(f);
    if (verdict.ok) return onSelect(f);
    notifyInvalid(`${verdict.reason} Please upload a clear grayscale ultrasound side profile.`);
  }, [busy]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const verdict = validateFile(f);
    if (verdict.ok) return onSelect(f);
    notifyInvalid(`${verdict.reason} Please upload a clear grayscale ultrasound side profile.`);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={`mx-auto max-w-3xl border-2 border-dashed rounded-2xl p-10 text-center ${
        busy ? 'opacity-60 pointer-events-none' : 'hover:bg-gray-50'
      }`}
    >
      <p className="mb-3 font-medium">Drag & Drop Your Scan</p>
      <p className="text-sm text-gray-500 mb-6">
        or click to choose a file (JPG/PNG, max {MAX_MB}MB). Use a clear side profile, not front/back.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="px-5 py-2 rounded-full bg-black text-white hover:opacity-90 disabled:opacity-50"
        disabled={busy}
      >
        {busy ? 'Processing…' : 'Choose File'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}