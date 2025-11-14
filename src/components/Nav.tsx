'use client';

import React, { useState } from 'react';

export default function Nav() {
  const [open, setOpen] = useState(false);

  const handleScrollLink = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (typeof window === 'undefined') return;

    // Only intercept and smooth-scroll when already on the homepage
    if (window.location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      (window as any).openUpload?.();
    }
    // Otherwise let the normal navigation to /#id happen
  };

  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur">
      <nav className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 shrink-0">
          <img
            src="/logo.svg"
            alt="My Baby Gender Predictor"
            className="h-9 w-auto"
          />
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-700">
          <a
            href="/#upload"
            onClick={(e) => handleScrollLink(e, 'upload')}
            className="hover:text-[#9B80FF]"
          >
            Gender predictor
          </a>
          <a
            href="/#how-it-works"
            onClick={(e) => handleScrollLink(e, 'how-it-works')}
            className="hover:text-[#9B80FF]"
          >
            How it works
          </a>
          <a href="/baby-names" className="hover:text-[#9B80FF]">
            Baby names
          </a>
          <a href="/privacy" className="hover:text-[#9B80FF]">
            Privacy
          </a>
          <a href="/terms" className="hover:text-[#9B80FF]">
            Terms
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Toggle navigation"
          className="md:hidden inline-flex items-center justify-center rounded-full border border-gray-200 p-2"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <div className="space-y-1">
            <span className="block h-0.5 w-5 bg-gray-800" />
            <span className="block h-0.5 w-5 bg-gray-800" />
            <span className="block h-0.5 w-5 bg-gray-800" />
          </div>
        </button>
      </nav>

      {/* Mobile menu panel */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2 text-sm text-gray-700">
            <a
              href="/#upload"
              className="py-1"
              onClick={(e) => {
                setOpen(false);
                handleScrollLink(e, 'upload');
              }}
            >
              Gender predictor
            </a>
            <a
              href="/#how-it-works"
              className="py-1"
              onClick={(e) => {
                setOpen(false);
                handleScrollLink(e, 'how-it-works');
              }}
            >
              How it works
            </a>
            <a
              href="/baby-names"
              className="py-1"
              onClick={() => setOpen(false)}
            >
              Baby names
            </a>
            <a
              href="/privacy"
              className="py-1"
              onClick={() => setOpen(false)}
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="py-1"
              onClick={() => setOpen(false)}
            >
              Terms
            </a>
          </div>
        </div>
      )}
    </header>
  );
}