'use client';
import React from 'react';

export default function Nav() {
  const smooth = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  const openUpload = () => (window as any).openUpload?.();

  return (
    <nav className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
      {/* Logo: never clipped (fixed height, auto width) */}
      <a href="/" className="flex items-center gap-3 shrink-0">
        <img
          src="/logo.svg"
          alt="My Baby Gender Predictor"
          className="h-9 w-auto block"
        />
      </a>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <a
          href="#upload"
          onClick={(e) => { smooth('upload')(e); openUpload(); }}
          className="hover:underline"
        >
          Upload
        </a>
        <a href="#how-it-works" onClick={smooth('how-it-works')} className="hover:underline">
          How it works
        </a>
        <a href="#why-us" onClick={smooth('why-us')} className="hover:underline">
          Why us
        </a>
        <a href="/privacy" className="hover:underline">Privacy</a>
        <a href="/terms" className="hover:underline">Terms</a>
      </div>

      {/* CTA */}
      <button
        onClick={() => {
          document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
          openUpload();
        }}
        className="btn-primary text-sm whitespace-nowrap"
      >
        Get started
      </button>
    </nav>
  );
}
