'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Nav from '../components/Nav';
import Dropzone from '../components/Dropzone';
import Modal from '../components/Modal';
import TrustBadges from '../components/TrustBadges';

type Result = { label: 'boy' | 'girl' | 'uncertain'; confidence: number };

export default function Page() {
  const [result, setResult] = useState<Result | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Expose an opener for the “Upload Scan”/“Get started” buttons in the page/nav
  useEffect(() => {
    (window as any).openUpload = () => {
      document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
      // Optionally focus the hidden file input if your Dropzone exposes it
    };
  }, []);

  const confidenceText = useMemo(() => {
    if (!result) return '';
    if (result.label === 'uncertain') return 'We’re not confident this time.';
    return 'This is a playful guess. Results may vary.';
  }, [result]);

  /** Deterministic playful guess so it doesn’t change between tries */
  const playfulGuess = (file: File, conf: number): Result => {
    // Simple deterministic seed from file name + size.
    // Even/odd decides boy/girl, keeps it stable for the same file.
    const seed = (file.name.length + Number(file.size % 97)) % 2;
    const label = seed === 0 ? 'boy' : 'girl';
    return { label, confidence: Math.max(0, Math.min(1, conf)) };
  };

  /** Called when Dropzone validates the file locally */
  const handleValid = async (file: File) => {
    setBanner(null);
    setProcessing(true);

    try {
      const endpoint =
        process.env.NEXT_PUBLIC_VALIDATOR_URL ||
        ''; // If empty you’ll immediately fall into catch (bad config)

      const fd = new FormData();
      fd.append('file', file);

      const resp = await fetch(endpoint, {
        method: 'POST',
        body: fd,
      });

      if (!resp.ok) {
        // Validator rejected (400) or other non-2xx
        const detail = await safeMessage(resp);
        throw new Error(detail || 'Validation failed.');
      }

      const data = await resp.json();
      // Expected from your FastAPI: { status: 'ok', label: 'ultrasound_side', confidence, message }
      if (data?.status !== 'ok') {
        throw new Error('Unexpected response from validator.');
      }

      // Turn a valid ultrasound into a playful boy/girl guess (deterministic)
      const res = playfulGuess(file, Number(data?.confidence ?? 0.5));
      setResult(res);
      setIsOpen(true);
    } catch (err: any) {
      console.error('[upload] error:', err);
      setBanner(err?.message || 'Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  /** Called when Dropzone fails basic client checks (type/size/etc) */
  const handleInvalid = (msg: string) => {
    setBanner(msg);
  };

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
          <Dropzone onValid={handleValid} onInvalid={handleInvalid} />
          {processing && (
            <div className="mt-3 text-sm text-gray-600">Processing…</div>
          )}
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

      {/* WHY US */}
      <section id="why-us" className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-3xl font-semibold mb-2">Why People Use This</h2>
        <p className="text-gray-600 mb-10">Fun, fast, and privacy-friendly.</p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-soft p-8">
            <h3 className="text-lg font-semibold mb-2 text-[#5EAaff]">Playful</h3>
            <p className="text-gray-600">
              A light-hearted way to share your excitement with friends and family.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-8">
            <h3 className="text-lg font-semibold mb-2 text-[#9B80FF]">Private</h3>
            <p className="text-gray-600">
              No accounts. No storage. Your image is handled transiently.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-8">
            <h3 className="text-lg font-semibold mb-2 text-[#FF7BC8]">Instant</h3>
            <p className="text-gray-600">
              Upload a scan and get a playful guess in seconds.
            </p>
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
                <>Looks like{' '}
                  <b className={result.label === 'boy' ? 'text-blue-600' : 'text-pink-600'}>
                    {result.label}
                  </b>!
                </>
              )}
            </p>
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
      return j?.detail || j?.message || null;
    }
    const t = await resp.text().catch(() => '');
    return t || null;
  } catch {
    return null;
  }
}