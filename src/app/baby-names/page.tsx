'use client';

import React, {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import Nav from '../../components/Nav';
import type { NameEntry } from '../../data/names';

type GenderFilter = 'any' | 'boy' | 'girl' | 'unisex';
type SortKey = 'az' | 'za' | 'lengthAsc' | 'lengthDesc';

const PAGE_SIZE = 60;

export default function BabyNamesPage() {
  // --------- API-backed data ----------
  const [names, setNames] = useState<NameEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Only show results after user interacts
  const [hasInteracted, setHasInteracted] = useState(false);

  // Filters / search
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<GenderFilter>('any');
  const [origin, setOrigin] = useState<string>('any');
  const [startsWith, setStartsWith] = useState<string>('any');
  const [sort, setSort] = useState<SortKey>('az');
  const [page, setPage] = useState(1);

  // Favourites
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
      // ignore
    }
  };

  // Small trending list (for the bottom section)
  const [trending, setTrending] = useState<NameEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadTrending = async () => {
      try {
        const res = await fetch('/api/names?page=1&pageSize=12', {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const body = (await res.json()) as { data?: NameEntry[] };
        if (!cancelled && body.data) {
          // De-dupe by name
          const seen = new Set<string>();
          const list = body.data.filter((n) => {
            const key = n.name.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setTrending(list);
        }
      } catch {
        // ignore
      }
    };

    loadTrending();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // Derived options (origins, letters)
  const ORIGINS = useMemo(
    () => Array.from(new Set([...names, ...trending].map((n) => n.origin))).sort(),
    [names, trending],
  );
  const LETTERS = useMemo(
    () => ['any', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')],
    [],
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const markInteracted = () => {
    if (!hasInteracted) setHasInteracted(true);
  };

  const onFilterChange = <T,>(
    setter: (value: T) => void,
  ) => {
    return (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      markInteracted();
      setPage(1);
      setter(e.target.value as unknown as T);
    };
  };

  const resetFilters = () => {
    setQuery('');
    setGender('any');
    setOrigin('any');
    setStartsWith('any');
    setSort('az');
    setPage(1);
    setHasInteracted(false);
    setNames([]);
    setTotal(0);
    setLoadError(null);
  };

  // --------- Fetch search results when filters change ----------
  useEffect(() => {
    if (!hasInteracted) return;

    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(PAGE_SIZE));
        params.set('gender', gender);
        params.set('origin', origin);
        params.set('startsWith', startsWith);
        if (query.trim()) params.set('q', query.trim());

        const res = await fetch(`/api/names?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || 'Failed to fetch names');
        }

        const body = (await res.json()) as {
          data?: NameEntry[];
          total?: number;
          error?: string;
        };

        if (body.error) {
          throw new Error(body.error);
        }

        if (cancelled) return;

        // De-dupe by name (fix duplicate results)
        let list = (body.data ?? []).slice();
        const seen = new Set<string>();
        list = list.filter((n) => {
          const key = n.name.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Sort
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
                a.name.length - b.name.length || a.name.localeCompare(b.name),
            );
            break;
          case 'lengthDesc':
            list.sort(
              (a, b) =>
                b.name.length - a.name.length || a.name.localeCompare(b.name),
            );
            break;
        }

        setNames(list);
        setTotal(list.length); // total based on de-duplicated results
      } catch (err: any) {
        if (cancelled || err?.name === 'AbortError') return;
        console.error('[baby-names] fetch error:', err);
        setLoadError(err?.message || 'Unable to load names right now.');
        setNames([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, gender, origin, startsWith, query, sort, hasInteracted]);

  // --------- Baby Name Generator (uses current results as pool) ----------
  const [genGender, setGenGender] = useState<GenderFilter>('any');
  const [genOrigin, setGenOrigin] = useState<string>('any');
  const [genStartsWith, setGenStartsWith] = useState<string>('any');
  const [generated, setGenerated] = useState<NameEntry[]>([]);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerate = () => {
    markInteracted();

    let candidates = names.slice();

    if (genGender !== 'any') {
      candidates = candidates.filter((n) => n.gender === genGender);
    }
    if (genOrigin !== 'any') {
      candidates = candidates.filter(
        (n) => n.origin.toLowerCase() === genOrigin.toLowerCase(),
      );
    }
    if (genStartsWith !== 'any') {
      const letter = genStartsWith.toUpperCase();
      candidates = candidates.filter((n) =>
        n.name.toUpperCase().startsWith(letter),
      );
    }

    if (candidates.length === 0) {
      setGenerated([]);
      setGenError('No names found for these settings. Try relaxing a filter.');
      return;
    }

    setGenError(null);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markInteracted();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fdfaff] to-[#faf7ff] text-gray-800">
      <Nav />

      <main className="mx-auto max-w-6xl px-4 pb-10">
        {/* HERO + SEARCH + FILTERS */}
        <section className="mt-4 mb-6 rounded-3xl bg-gradient-to-r from-[#ffe5f5] via-[#fdf3ff] to-[#e6f3ff] px-4 py-8 md:py-10 text-center shadow-soft border border-white/60">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight text-gray-900">
            Find the Perfect Name for Your{' '}
            <span className="text-[#9B80FF]">Little One</span>
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-sm md:text-base text-gray-700">
            Search thousands of baby names by meaning, gender, and origin. Save
            your favourites and share them with your partner.
          </p>

          {/* Big search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-6 max-w-xl mx-auto flex items-center rounded-full bg-white shadow-md border border-gray-100 overflow-hidden"
          >
            <input
              type="text"
              value={query}
              onChange={onFilterChange<string>(setQuery)}
              placeholder="Search for baby names…"
              className="flex-1 px-4 py-3 text-sm md:text-base outline-none"
              aria-label="Search for baby names"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-gradient-to-r from-[#5EAaff] to-[#FF7BC8] text-white text-sm md:text-base font-medium hover:opacity-90"
            >
              Search
            </button>
          </form>

          {/* Filter row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Gender</span>
              <select
                className="rounded-xl border border-gray-200 px-3 py-2 bg-white"
                value={gender}
                onChange={onFilterChange<GenderFilter>(setGender)}
              >
                <option value="any">All</option>
                <option value="boy">Boys</option>
                <option value="girl">Girls</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600">Origin</span>
              <select
                className="rounded-xl border border-gray-200 px-3 py-2 bg-white"
                value={origin}
                onChange={onFilterChange<string>(setOrigin)}
              >
                <option value="any">All origins</option>
                {ORIGINS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600">Starts with</span>
              <select
                className="rounded-xl border border-gray-200 px-3 py-2 bg-white"
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

            <div className="flex items-center gap-2">
              <span className="text-gray-600">Sort</span>
              <select
                className="rounded-xl border border-gray-200 px-3 py-2 bg-white"
                value={sort}
                onChange={onFilterChange<SortKey>(setSort)}
              >
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
                <option value="lengthAsc">Shortest first</option>
                <option value="lengthDesc">Longest first</option>
              </select>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs md:text-sm text-gray-600 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>

          {/* Favourites summary */}
          <div className="mt-4 text-xs md:text-sm text-gray-600">
            {hasInteracted && !loading && !loadError && (
              <>
                Showing <b>{names.length}</b> unique names
              </>
            )}
            {favs.length > 0 && (
              <span className="ml-2">
                · <b>{favs.length}</b> in your favourites
              </span>
            )}
          </div>
        </section>

        {/* RESULTS DIRECTLY UNDER SEARCH */}
        <section className="grid gap-6 lg:grid-cols-[2fr,1fr] items-start">
          {/* Search results */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-soft p-4">
            <div className="flex items-center justify-between mb-3 text-xs md:text-sm text-gray-600">
              <span className="font-semibold">Search results</span>
            </div>

            {!hasInteracted && (
              <p className="text-xs text-gray-500">
                Start by searching or choosing a filter above to see names here.
              </p>
            )}

            {hasInteracted && loadError && (
              <p className="text-xs text-rose-600">{loadError}</p>
            )}

            {hasInteracted && loading && (
              <p className="text-xs text-gray-500">Loading names…</p>
            )}

            {hasInteracted &&
              !loading &&
              !loadError &&
              names.length === 0 && (
                <p className="text-xs text-gray-500">
                  No names match these filters yet. Try clearing the search or
                  picking a different origin.
                </p>
              )}

            {names.length > 0 && (
              <>
                <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {names.map((n) => {
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

                {total > PAGE_SIZE && (
                  <div className="mt-5 flex items-center justify-center gap-3 text-xs">
                    <button
                      type="button"
                      disabled={!canGoPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-full border border-gray-200 px-3 py-1 disabled:opacity-40 disabled:cursor-default hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-gray-500">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={!canGoNext}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="rounded-full border border-gray-200 px-3 py-1 disabled:opacity-40 disabled:cursor-default hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right column: favourites summary */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-soft p-4">
              <h2 className="text-sm font-semibold text-gray-800">
                Your favourites
              </h2>
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

            <div className="rounded-2xl bg-gradient-to-r from-[#f6f3ff] to-[#fef6fb] border border-violet-100 shadow-soft p-4">
              <h2 className="text-sm font-semibold text-gray-800">
                Tips for choosing a name
              </h2>
              <ul className="mt-2 space-y-1.5 text-xs text-gray-600 list-disc list-inside">
                <li>Say the full name out loud a few times.</li>
                <li>Check initials and common nicknames.</li>
                <li>Think about how it sounds with siblings.</li>
              </ul>
            </div>
          </aside>
        </section>

        {/* BABY NAME GENERATOR */}
        <section className="mt-6 rounded-2xl bg-white shadow-soft border border-gray-100 p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Try the Baby Name Generator
              </h2>
              <p className="mt-1 text-xs md:text-sm text-gray-600 max-w-xl">
                Use your current search and filters, then let the generator
                suggest a few names to explore.
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
                disabled={loading || !!loadError || !hasInteracted}
              >
                Generate names
              </button>
            </div>
          </div>

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
                Run a search first, then use the generator for extra ideas.
              </p>
            )}
          </div>
        </section>

        {/* TRENDING NAMES AT THE BOTTOM */}
        <section className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-soft p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              Trending names
              <span className="text-[10px] uppercase tracking-wide text-[#9B80FF] bg-[#f3ecff] px-2 py-0.5 rounded-full">
                playful
              </span>
            </h2>
          </div>

          {trending.length === 0 ? (
            <p className="text-xs text-gray-500">
              We&apos;re loading a few ideas for you…
            </p>
          ) : (
            <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-3">
              {trending.map((n) => {
                const isFav = favs.includes(n.name);
                return (
                  <article
                    key={`trending-${n.name}-${n.origin}-${n.gender}`}
                    className="rounded-2xl border border-gray-100 bg-[#fdf7ff] p-3 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
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
                      >
                        {isFav ? 'Saved' : 'Save'}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-700 line-clamp-2">
                      {n.meaning}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyName(n.name)}
                      className="mt-1 text-[11px] rounded-xl border border-gray-200 px-3 py-1 hover:bg-gray-50 self-start"
                    >
                      Copy
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}