'use client';

import React, {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import type { NameEntry } from '../../data/names';

type GenderFilter = 'any' | 'boy' | 'girl' | 'unisex';
type SortKey = 'az' | 'za' | 'lengthAsc' | 'lengthDesc';

const PAGE_SIZE = 60;

export default function BabyNamesPage() {
  // ---------- Data from Supabase ----------
  const [names, setNames] = useState<NameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await fetch('/api/names');
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to fetch names');
        }

        const body = (await res.json()) as { data?: NameEntry[]; error?: string };
        if (body.error) {
          throw new Error(body.error);
        }

        if (!cancelled) {
          setNames(body.data ?? []);
        }
      } catch (err: any) {
        console.error('[baby-names] fetch error:', err);
        if (!cancelled) {
          setLoadError(err?.message || 'Unable to load names right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

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
    () => Array.from(new Set(names.map((n) => n.origin))).sort(),
    [names]
  );
  const LETTERS = useMemo(
    () => ['any', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')],
    []
  );

  const TRENDING = useMemo<NameEntry[]>(
    () => names.slice(0, Math.min(12, names.length)),
    [names]
  );

  const POPULAR_ORIGINS = useMemo(
    () => ORIGINS.slice(0, 6),
    [ORIGINS]
  );

  // ---------- Main list filter + sort ----------
  const filtered = useMemo(() => {
    let list = names.slice();

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
  }, [names, gender, origin, startsWith, query, sort]);

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
    let candidates = names.slice();

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

  // ---------- Render ----------
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
              {loading && (
                <p className="text-xs text-gray-500">
                  Loading names…
                </p>
              )}
              {loadError && (
                <p className="text-xs text-rose-600">
                  {loadError}
                </p>
              )}

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  aria-label="Search by name or meaning"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring focus:ring-[#9B80FF]/30"
                  placeholder="Search name or meaning (e.g. joy, light, strong)…"
                  value={query}
                  onChange={onFilterChange(setQuery)}
                  disabled={loading || !!loadError}
                />
                <select
                  aria-label="Gender filter"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
                  value={gender}
                  onChange={onFilterChange<GenderFilter>(setGender)}
                  disabled={loading || !!loadError}
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
                  disabled={loading || !!loadError}
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
                    disabled={loading || !!loadError}
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
                    disabled={loading || !!loadError}
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
                  disabled={loading || !!loadError}
                >
                  Reset filters
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs md:text-sm text-gray-600">
              {loading
                ? 'Loading names…'
                : loadError
                ? 'Names could not be loaded.'
                : (
                  <>
                    Showing <b>{filtered.length}</b> of {names.length} names
                    {filtered.length > PAGE_SIZE && (
                      <> · Page {pageSafe} of {totalPages}</>
                    )}
                  </>
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
              <h3 className="text-sm font-semibold text-gray-800">Your favourites</h3>
              {favs.length === 0 ? (
                <p className="mt-1 text-xs text-gray-500">
                  Tap “Save” on any name to build your list.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {favs.map((n) => (
                    <span
                      key={n}
                      className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs text-pink-700"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>

        {/* BABY NAME GENERATOR */}
        <section className="mb-8 rounded-2xl bg-white shadow-soft border border-gray-100 p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Try the Baby Name Generator
              </h2>
              <p className="mt-1 text-xs md:text-sm text-gray-600 max-w-xl">
                Choose a few preferences and we&apos;ll suggest some names for you to explore. You can
                still refine and save favourites below.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs md:text-sm">
              <select
                aria-label="Generator gender"
                className="rounded-xl border border-gray-200 px-3 py-2 bg-white"
                value={genGender}
                onChange={(e) =>
                  setGenGender(e.target.value as GenderFilter)
                }
                disabled={loading || !!loadError}
              >
                <option value="any">Any gender</option>
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
                <option value="unisex">Unisex</option>
              </select>

              <select
                aria-label="Generator origin"
                className="rounded-xl border border-gray-200 px-3 py-2 bg-white"
                value={genOrigin}
                onChange={(e) => setGenOrigin(e.target.value)}
                disabled={loading || !!loadError}
              >
                <option value="any">Any origin</option>
                {ORIGINS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              <select
                aria-label="Generator starting letter"
                className="rounded-xl border border-gray-200 px-3 py-2 bg-white"
                value={genStartsWith}
                onChange={(e) => setGenStartsWith(e.target.value)}
                disabled={loading || !!loadError}
              >
                {LETTERS.map((l) => (
                  <option key={l} value={l}>
                    {l === 'any' ? 'Any letter' : l}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-xl bg-gradient-to-r from-[#5EAaff] to-[#FF7BC8] text-white px-4 py-2 font-medium text-xs md:text-sm shadow-md hover:opacity-90"
                disabled={loading || !!loadError}
              >
                Generate names
              </button>
            </div>
          </div>

          {/* Generated results */}
          <div className="mt-4">
            {genError && (
              <p className="text-xs text-rose-600 mb-2">{genError}</p>
            )}

            {generated.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {generated.map((n) => {
                  const isFav = favs.includes(n.name);
                  return (
                    <article
                      key={`gen-${n.name}-${n.origin}-${n.gender}`}
                      className="bg-[#fdf7ff] border border-violet-100 rounded-2xl px-4 py-3 flex flex-col gap-1 text-xs md:text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {n.name}
                          </h3>
                          <p className="text-[11px] uppercase tracking-wide text-gray-400">
                            {n.origin} · {n.gender}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFav(n.name)}
                          className={`text-[11px] rounded-full border px-3 py-1 ${
                            isFav
                              ? 'bg-pink-50 border-pink-300 text-pink-700'
                              : 'bg-white border-gray-200 text-gray-700'
                          }`}
                          aria-pressed={isFav}
                        >
                          {isFav ? 'Saved' : 'Save'}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-700">
                        {n.meaning}
                      </p>
                      <div className="mt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => copyName(n.name)}
                          className="text-[11px] rounded-xl border border-gray-200 px-3 py-1 hover:bg-gray-50"
                        >
                          Copy
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!genError && generated.length === 0 && (
              <p className="text-[11px] text-gray-500">
                Tap &quot;Generate names&quot; to see some suggestions based on your choices.
              </p>
            )}
          </div>
        </section>

        {/* MAIN CONTENT: results + quick filters */}
        <section className="grid gap-8 lg:grid-cols-[2.2fr,1.2fr] items-start">
          {/* Results */}
          <div>
            {pageItems.length === 0 && !loading && !loadError ? (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-soft p-6 text-center text-sm text-gray-600">
                No names match these filters yet. Try clearing the search or picking a different
                origin.
              </div>
            ) : null}

            {pageItems.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageItems.map((n) => {
                  const isFav = favs.includes(n.name);
                  return (
                    <article
                      key={`${n.name}-${n.origin}-${n.gender}`}
                      className="bg-white rounded-2xl shadow-soft border border-gray-100 p-4 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold">{n.name}</h3>
                          <p className="text-[11px] uppercase tracking-wide text-gray-400">
                            {n.origin} · {n.gender}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFav(n.name)}
                          className={`text-xs rounded-full border px-3 py-1 ${
                            isFav
                              ? 'bg-pink-50 border-pink-300 text-pink-700'
                              : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                          aria-pressed={isFav}
                        >
                          {isFav ? 'Saved' : 'Save'}
                        </button>
                      </div>

                      <p className="text-xs text-gray-700 line-clamp-3">
                        {n.meaning}
                      </p>

                      {n.altSpellings?.length ? (
                        <p className="text-[11px] text-gray-500">
                          Also: {n.altSpellings.join(', ')}
                        </p>
                      ) : null}

                      <div className="mt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => copyName(n.name)}
                          className="text-xs rounded-xl border border-gray-200 px-3 py-1 hover:bg-gray-50"
                        >
                          Copy
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <div className="mt-6 flex items-center justify-center gap-3 text-xs">
                <button
                  type="button"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-full border border-gray-200 px-3 py-1 disabled:opacity-40 disabled:cursor-default hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-gray-500">
                  Page {pageSafe} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-full border border-gray-200 px-3 py-1 disabled:opacity-40 disabled:cursor-default hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Side content: quick filters + help */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-soft p-4">
              <h2 className="text-sm font-semibold text-gray-800">Quick filters</h2>
              <p className="mt-1 text-xs text-gray-500">
                Jump straight into popular ways people browse names.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50"
                  onClick={() => {
                    setGender('girl');
                    setOrigin('any');
                    setStartsWith('any');
                    setQuery('');
                    setPage(1);
                  }}
                >
                  Girl names
                </button>
                <button
                  type="button"
                  className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50"
                  onClick={() => {
                    setGender('boy');
                    setOrigin('any');
                    setStartsWith('any');
                    setQuery('');
                    setPage(1);
                  }}
                >
                  Boy names
                </button>
                <button
                  type="button"
                  className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50"
                  onClick={() => {
                    setGender('unisex');
                    setOrigin('any');
                    setStartsWith('any');
                    setQuery('');
                    setPage(1);
                  }}
                >
                  Unisex names
                </button>

                {POPULAR_ORIGINS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50"
                    onClick={() => {
                      setOrigin(o);
                      setGender('any');
                      setStartsWith('any');
                      setQuery('');
                      setPage(1);
                    }}
                  >
                    {o} names
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-[#f6f3ff] to-[#fef6fb] border border-violet-100 shadow-soft p-4">
              <h2 className="text-sm font-semibold text-gray-800">How to use this page</h2>
              <ul className="mt-2 space-y-1.5 text-xs text-gray-600 list-disc list-inside">
                <li>Use the search box for meanings like “joy”, “light”, or “strong”.</li>
                <li>Filter by gender, origin, and first letter to narrow your list.</li>
                <li>Tap “Save” to build your favourites list without creating an account.</li>
                <li>Tap “Copy” to quickly share names with your partner or friends.</li>
                <li>Use the generator above when you feel stuck and want fresh ideas.</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}