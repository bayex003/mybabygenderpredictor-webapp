// src/app/api/names/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Adjust this limit if you want (10k is a good balance)
  const LIMIT = 10000;

  const { data, error } = await supabase
    .from('names')
    .select('name, gender, origin, meaning, "altSpellings"')
    .limit(LIMIT);

  if (error) {
    console.error('[GET /api/names] Supabase error:', error);
    return NextResponse.json(
      { error: 'Failed to load names.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data ?? [],
  });
}