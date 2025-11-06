'use client';
import React, { useMemo, useState } from 'react';
import Nav from '../components/Nav';
import Dropzone from '../components/Dropzone';
import Modal from '../components/Modal';
import TrustBadges from '../components/TrustBadges';

type Result = { label: 'boy' | 'girl' | 'uncertain'; confidence: number };

export default function Page() {
  const [result, setResult] = useState<Result | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleResult = (res: Result | null) => {
    console.log('[Page] handleResult called with:', res);
    setResult(res);
    setIsOpen(true);
  };

  const confidenceText = useMemo(() => {
    if (!result) return '';
    if (result.label === 'uncertain') return 'We’re not confident this time.';
    return 'This is a playful guess. Results may vary.';
  }, [result]);

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
        <Dropzone onResult={handleResult} />
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
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {result ? (
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Your playful prediction</h3>
            <p className="text-lg">
              {result.label === 'uncertain' ? (
                <>Uncertain this time — try another scan if you have one.</>
              ) : (
                <>Looks like <b className={result.label === 'boy' ? 'text-blue-600' : 'text-pink-600'}>
                  {result.label}
                </b>!</>
              )}
            </p>
            <p className="mt-2 text-sm text-gray-600">{confidenceText}</p>
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