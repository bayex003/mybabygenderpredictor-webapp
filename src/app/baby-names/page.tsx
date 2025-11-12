'use client';

import React, { useEffect, useMemo, useState } from 'react';

// Types
type Gender = 'boy' | 'girl' | 'unisex';
type NameEntry = {
  name: string;
  gender: Gender;
  origin: string;        // e.g., Yoruba, Arabic, Irish, Hindi, Japanese…
  meaning: string;
  altSpellings?: string[];
};

type SortKey = 'az' | 'za' | 'lengthAsc' | 'lengthDesc';

// Load data (from src/data/names.ts)
import { NAMES } from '../../data/names';

export default function BabyNamesPage() {
  // Filters
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<Gender | 'any'>('any');
  const [origin, setOrigin] = useState<string>('any');
  const [startsWith, setStartsWith] = useState<string>('any');
  const [minLen, setMinLen] = useState<number>(0);
  const [maxLen, setMaxLen] = useState<number>(20);
  const [sort, setSort] = useState<SortKey>('az');

  // Favourites (persist to localStorage)
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('babyname:favs');
      if (raw) setFavs(JSON.parse(raw));
    } catch {}
  }, []);

  const saveFavs = (next: string[]) => {
    setFavs(next);
    try {
      localStorage.setItem('babyname:favs', JSON.stringify(next));
    } catch {}
  };

  const toggleFav = (name: string) => {
    if (favs.includes(name)) saveFavs(favs.filter(n => n !== name));
    else saveFavs([...favs, name]);
  };

  // Derived options
  const ORIGINS = useMemo(
    () => Array.from(new Set(NAMES.map(n => n.origin))).sort(),
    []
  );
  const LETTERS = useMemo(
    () => ['any', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')],
    []
  );

  // Filter + sort
  const filtered = useMemo(() => {
    let list = NAMES;

    if (gender !== 'any') {
      list = list.filter(n => n.gender === gender);
    }

    if (origin !== 'any') {
      list = list.filter(n => n.origin.toLowerCase() === origin.toLowerCase());
    }

    if (startsWith !== 'any') {
      list = list.filter(n => n.name.toUpperCase().startsWith(startsWith));
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(n =>
        n.name.toLowerCase().includes(q) ||
        n.meaning.toLowerCase().includes(q) ||
        (n.altSpellings || []).some((a: string) => a.toLowerCase().includes(q))
      );
    }

    list = list.filter(n => {
      const len = n.name.length;
      return len >= minLen && len <= maxLen;
    });

    switch (sort) {
      case 'az':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'za':
        list = [...list].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'lengthAsc':
        list = [...list].sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name));
        break;
      case 'lengthDesc':
        list = [...list].sort((a, b) => b.name.length - a.name.length || a.name.localeCompare(b.name));
        break;
    }

    return list;
  }, [gender, origin, startsWith, query, minLen, maxLen, sort]);

  const copyName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fdfaff] to-[#faf7ff] text-gray-800">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-bold">Baby Names</h1>
        <p className="mt-2 text-gray-600">
          Explore multicultural baby names with meanings. Filter by gender, origin, first letter, and length.
        </p>

        {/* Controls */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            aria-label="Search by name or meaning"
            className="md:col-span-2 rounded-xl border px-3 py-2 outline-none focus:ring"
            placeholder="Search name or meaning..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select
            aria-label="Gender"
            className="rounded-xl border px-3 py-2"
            value={gender}
            onChange={(e) => setGender(e.target.value as any)}
          >
            <option value="any">Any gender</option>
            <option value="boy">Boy</option>
            <option value="girl">Girl</option>
            <option value="unisex">Unisex</option>
          </select>

          <select
            aria-label="Origin"
            className="rounded-xl border px-3 py-2"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          >
            <option value="any">Any origin</option>
            {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select
            aria-label="Starts with"
            className="rounded-xl border px-3 py-2"
            value={startsWith}
            onChange={(e) => setStartsWith(e.target.value)}
          >
            {LETTERS.map(l => <option key={l} value={l}>{l === 'any' ? 'Any letter' : l}</option>)}
          </select>

          <select
            aria-label="Sort"
            className="rounded-xl border px-3 py-2"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="lengthAsc">Shortest first</option>
            <option value="lengthDesc">Longest first</option>
          </select>
        </div>

        {/* Length slider */}
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-gray-600">Length:</label>
          <input type="number" min={0} max={20} value={minLen} onChange={(e) => setMinLen(Number(e.target.value) || 0)}
                 className="w-20 rounded-xl border px-2 py-1" />
          <span className="text-sm text-gray-500">to</span>
          <input type="number" min={0} max={20} value={maxLen} onChange={(e) => setMaxLen(Number(e.target.value) || 20)}
                 className="w-20 rounded-xl border px-2 py-1" />
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing <b>{filtered.length}</b> of {NAMES.length} names
        </div>

        {/* Grid */}
        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(n => {
            const isFav = favs.includes(n.name);
            return (
              <div key={n.name} className="bg-white rounded-2xl shadow-soft border border-gray-100 p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xl font-semibold">{n.name}</div>
                    <div className="text-xs text-gray-500">
                      {n.origin} · {n.gender}
                    </div>
                  </div>
                  <button
                    className={`text-sm rounded-full border px-3 py-1 ${isFav ? 'bg-pink-50 border-pink-300 text-pink-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                    onClick={() => toggleFav(n.name)}
                    aria-pressed={isFav}
                    aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                  >
                    {isFav ? 'Saved' : 'Save'}
                  </button>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">{n.meaning}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="text-sm rounded-xl border border-gray-200 px-3 py-1 hover:bg-gray-50"
                    onClick={() => copyName(n.name)}
                  >
                    Copy
                  </button>
                  {n.altSpellings?.length ? (
                    <span className="text-xs text-gray-500 self-center">Also: {n.altSpellings.join(', ')}</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Favourites block */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold">Your favourites</h2>
          {favs.length === 0 ? (
            <p className="text-sm text-gray-600 mt-2">No saved names yet.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {favs.map(n => (
                <span key={n} className="rounded-full border px-3 py-1 text-sm bg-white shadow-soft">
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}