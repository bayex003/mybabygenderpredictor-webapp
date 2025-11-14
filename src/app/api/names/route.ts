// src/app/api/names/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Default page size if not provided
const DEFAULT_PAGE_SIZE = 1000;
// Safety limits so nobody can request millions at once
const MAX_PAGE_SIZE = 2000;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = url.searchParams;

  // Pagination
  const page = Math.max(1, Number(params.get('page') ?? '1'));
  const rawPageSize = Number(params.get('pageSize') ?? String(DEFAULT_PAGE_SIZE));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, isNaN(rawPageSize) ? DEFAULT_PAGE_SIZE : rawPageSize),
  );

  // Filters
  const gender = params.get('gender') ?? 'any';         // boy | girl | unisex | any
  const origin = params.get('origin') ?? 'any';         // origin string or "any"
  const startsWith = params.get('startsWith') ?? 'any'; // letter or "any"
  const q = (params.get('q') ?? '').trim();             // search text

  // Base query
  let query = supabase
    .from('names')
    .select('name, gender, origin, meaning, "altSpellings"', { count: 'exact' });

  if (gender !== 'any') {
    query = query.eq('gender', gender);
  }

  if (origin !== 'any') {
    // case-insensitive match on origin
    query = query.ilike('origin', origin);
  }

  if (startsWith !== 'any') {
    const letter = startsWith.toUpperCase();
    query = query.ilike('name', `${letter}%`);
  }

  if (q) {
    const safe = q.replace(/%/g, ''); // avoid messing with wildcards
    const pattern = `%${safe}%`;
    // search in name OR meaning (altSpellings left out for simplicity)
    query = query.or(
      `name.ilike.${pattern},meaning.ilike.${pattern}`,
    );
  }

  // Pagination window
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('[GET /api/names] Supabase error:', error);
    return NextResponse.json(
      { error: 'Failed to load names.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: data ?? [],
    total: count ?? data?.length ?? 0,
    page,
    pageSize,
  });
}