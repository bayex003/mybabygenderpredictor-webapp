'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isHome = pathname === '/' || pathname === '/index';

  const openUpload = () => (window as any).openUpload?.();

  const goToUpload = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isHome) {
      document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
      openUpload();
    } else {
      // navigate to home and target the upload section
      window.location.href = '/#upload';
    }
  };

  const smooth = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${id}`;
    }
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <nav className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        {/* Left: back button (mobile only, hidden on home) + logo */}
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              aria-label="Go back"
              onClick={() => router.back()}
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 hover:bg-gray-50"
            >
              {/* simple chevron */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="Home">
            <img
              src="/logo.svg"
              alt="My Baby Gender Predictor"
              className="h-9 w-auto block"
            />
          </Link>
        </div>

        {/* Desktop links (no Privacy/Terms here) */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <a href="/#upload" onClick={goToUpload} className="hover:underline">
            Upload
          </a>
          <a href="/#how-it-works" onClick={smooth('how-it-works')} className="hover:underline">
            How it works
          </a>
          <a href="/#why-us" onClick={smooth('why-us')} className="hover:underline">
            Why us
          </a>
          <Link href="/baby-names" className="hover:underline">
            Baby Names
          </Link>
        </div>

        {/* Right: primary CTA + mobile menu button */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToUpload}
            className="btn-primary text-sm whitespace-nowrap hidden md:inline-block"
          >
            Get started
          </button>

          {/* Hamburger (mobile only) */}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(v => !v)}
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 hover:bg-gray-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {open && (
        <div id="mobile-menu" className="md:hidden border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 text-sm">
            <a href="/#upload" onClick={(e) => { goToUpload(e); setOpen(false); }} className="py-2">
              Upload
            </a>
            <a href="/#how-it-works" onClick={smooth('how-it-works')} className="py-2">
              How it works
            </a>
            <a href="/#why-us" onClick={smooth('why-us')} className="py-2">
              Why us
            </a>
            <Link href="/baby-names" onClick={() => setOpen(false)} className="py-2">
              Baby Names
            </Link>

            {/* Mobile CTA */}
            <button
              onClick={(e) => { goToUpload(e); }}
              className="mt-2 btn-primary text-sm w-full"
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}