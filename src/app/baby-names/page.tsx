'use client';

import React, { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { NAMES, type NameEntry } from '../../data/names';

type GenderFilter = 'any' | 'boy' | 'girl' | 'unisex';
type SortKey = 'az' | 'za' | 'lengthAsc' | 'lengthDesc';

const PAGE_SIZE = 60;

export default function BabyNamesPage() {
  // ---------- Browse filters ----------
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<GenderFilter>('any');
  const [origin, setOrigin] = useState<string>('any');
  const [startsWith, setStartsWith] = useState<string>('any');
  const [sort, setSort] = useState<SortKey>('az');
  const [page, setPage] = useState(1);

  // ---------- Favourites ----------
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('babyname:favs');
      if (raw) setFavs(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const saveFavs = (next: string[]) => {
    setFavs(next);
    try {
      localStorage.setItem('babyname:favs', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const toggleFav = (name: string) => {
    if (favs.includes(name)) {
      saveFavs(favs.filter((n) => n !== name));
    } else {
      saveFavs([...favs, name]);
    }
  };

  const copyName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
    } catch {
      // ignore if clipboard unsupported
    }
  };

  // ---------- Derived options ----------
  const ORIGINS = useMemo(
    () => Array.from(new Set(NAMES.map((n) => n.origin))).sort(),
    []
  );
  const LETTERS = useMemo(
    () => ['any', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')],
    []
  );

  const TRENDING = useMemo<NameEntry[]>(
    () => [...NAMES].slice(0, Math.min(12, NAMES.length)),
    []
  );

  const POPULAR_ORIGINS = useMemo(
    () => ORIGINS.slice(0, 6),
    [ORIGINS]
  );

  // ---------- Main list filter + sort ----------
  const filtered = useMemo(() => {
    let list = NAMES.slice();

    if (gender !== 'any') {
      list = list.filter((n) => n.gender === gender);
    }

    if (origin !== 'any') {
      list = list.filter(
        (n) => n.origin.toLowerCase() === origin.toLowerCase()
      );
    }

    if (startsWith !== 'any') {
      const letter = startsWith.toUpperCase();
      list = list.filter((n) => n.name.toUpperCase().startsWith(letter));
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.meaning.toLowerCase().includes(q) ||
          (n.altSpellings || []).some((a: string) =>
            a.toLowerCase().includes(q)
          )
      );
    }

    switch (sort) {
      case 'az':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'za':
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'lengthAsc':
        list.sort(
          (a, b) =>
            a.name.length - b.name.length || a.name.localeCompare(b.name)
        );
        break;
      case 'lengthDesc':
        list.sort(
          (a, b) =>
            b.name.length - a.name.length || a.name.localeCompare(b.name)
        );
        break;
    }

    return list;
  }, [gender, origin, startsWith, query, sort]);

  // ---------- Pagination ----------
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [filtered, pageSafe]
  );

  const onFilterChange = <T,>(
    setter: (value: T) => void,
    extra?: () => void
  ) => {
    return (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setPage(1);
      setter(e.target.value as unknown as T);
      if (extra) extra();
    };
  };

  const resetFilters = () => {
    setQuery('');
    setGender('any');
    setOrigin('any');
    setStartsWith('any');
    setSort('az');
    setPage(1);
  };

  // ---------- Baby Name Generator state ----------
  const [genGender, setGenGender] = useState<GenderFilter>('any');
  const [genOrigin, setGenOrigin] = useState<string>('any');
  const [genStartsWith, setGenStartsWith] = useState<string>('any');
  const [generated, setGenerated] = useState<NameEntry[]>([]);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerate = () => {
    let candidates = NAMES.slice();

    if (genGender !== 'any') {
      candidates = candidates.filter((n) => n.gender === genGender);
    }
    if (genOrigin !== 'any') {
      candidates = candidates.filter(
        (n) => n.origin.toLowerCase() === genOrigin.toLowerCase()
      );
    }
    if (genStartsWith !== 'any') {
      const letter = genStartsWith.toUpperCase();
      candidates = candidates.filter((n) =>
        n.name.toUpperCase().startsWith(letter)
      );
    }

    if (candidates.length === 0) {
      setGenerated([]);
      setGenError('No names found for these settings. Try relaxing a filter.');
      return;
    }

    setGenError(null);

    // Pick up to 3 unique random suggestions
    const max = Math.min(3, candidates.length);
    const picks: NameEntry[] = [];
    const seen = new Set<string>();

    while (picks.length < max) {
      const idx = Math.floor(Math.random() * candidates.length);
      const item = candidates[idx];
      const key = `${item.name}-${item.origin}-${item.gender}`;
      if (!seen.has(key)) {
        seen.add(key);
        picks.push(item);
      }
    }

    setGenerated(picks);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fdfaff] to-[#faf7ff] text-gray-800">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* HERO / INTRO */}
        <section className="mb-8 grid gap-6 md:grid-cols-[2fr,1.3fr] items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Discover <span className="text-[#9B80FF]">Beautiful Baby Names</span>
            </h1>
            <p className="mt-3 text-gray-700 text-sm md:text-base">
              Explore baby names from around the world with meanings and origins. Save your
              favourites, filter by style and gender, and find names that feel like{' '}
              <span className="font-semibold">the one</span>.
            </p>

            {/* SEARCH + MAIN FILTERS */}
            <div className="mt-5 rounded-2xl bg-white shadow-soft border border-gray-100 p-4 flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  aria-label="Search by name or meaning"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring focus:ring-[#9B80FF]/30"
                  placeholder="Search name or meaning (e.g. joy, light, strong)…"
                  value={query}
                  onChange={onFilterChange(setQuery)}
                />
                <select
                  aria-label="Gender filter"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
                  value={gender}
                  onChange={onFilterChange<GenderFilter>(setGender)}
                >
                  <option value="any">Any gender</option>
                  <option value="boy">Boy</option>
                  <option value="girl">Girl</option>
                  <option value="unisex">Unisex</option>
                </select>
                <select
                  aria-label="Sort"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
                  value={sort}
                  onChange={onFilterChange<SortKey>(setSort)}
                >
                  <option value="az">A → Z</option>
                  <option value="za">Z → A</option>
                  <option value="lengthAsc">Shortest first</option>
                  <option value="lengthDesc">Longest first</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3 text-xs md:text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Origin</span>
                  <select
                    aria-label="Origin filter"
                    className="rounded-xl border border-gray-200 px-2 py-1 bg-white"
                    value={origin}
                    onChange={onFilterChange<string>(setOrigin)}
                  >
                    <option value="any">Any origin</option>
                    {ORIGINS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Starts with</span>
                  <select
                    aria-label="Starts with filter"
                    className="rounded-xl border border-gray-200 px-2 py-1 bg-white"
                    value={startsWith}
                    onChange={onFilterChange<string>(setStartsWith)}
                  >
                    {LETTERS.map((l) => (
                      <option key={l} value={l}>
                        {l === 'any' ? 'Any letter' : l}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="ml-auto rounded-xl border border-gray-200 px-3 py-1 text-xs md:text-sm text-gray-600 hover:bg-gray-50"
                >
                  Reset filters
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs md:text-sm text-gray-600">
              Showing <b>{filtered.length}</b> of {NAMES.length} names
              {filtered.length > PAGE_SIZE && (
                <> · Page {pageSafe} of {totalPages}</>
              )}
            </p>
          </div>

          {/* TRENDING + FAVOURITES */}
          <aside className="rounded-2xl bg-white shadow-soft border border-gray-100 p-4 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                Trending names
                <span className="text-[10px] uppercase tracking-wide text-[#9B80FF] bg-[#f3ecff] px-2 py-0.5 rounded-full">
                  playful
                </span>
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                A few names visitors often gravitate towards. Tap to copy and save for later.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TRENDING.map((n) => (
                  <button
                    key={n.name}
                    type="button"
                    onClick={() => copyName(n.name)}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs hover:bg-white"
                  >
                    {n.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-top border-gray-100 pt-3">
              <h3 className="text-sm font-semibold text-gray-8