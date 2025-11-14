'use client';

import React from 'react';

export default function Nav() {
  const smooth =
    (id: string) =>
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

  const openUpload = () => (window as any).openUpload?.();

  return (
    <nav className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
      {/* Logo */}
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
          onClick={(e) => {
            smooth('upload')(e);
            openUpload();
          }}
          className="hover:underline"
        >
          Upload
        </a>
        <a
          href="#how-it-works"
          onClick={smooth('how-it-works')}
          className="hover:underline"
        >
          How it works
        </a>
        {/* Baby Names temporarily hidden */}
        {/* <a href="/baby-names" className="hover:underline">Baby Names</a> */}
        {/* "Why us" + top-right CTA removed for now */}
      </div>
    </nav>
  );
}