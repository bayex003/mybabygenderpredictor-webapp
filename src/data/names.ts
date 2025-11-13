// src/data/names.ts

export type NameEntry = {
  name: string;
  gender: 'boy' | 'girl' | 'unisex';
  origin: string;
  meaning: string;
  altSpellings: string[] | null;
};

// Optional: keep an empty array for any older imports that still expect NAMES
export const NAMES: NameEntry[] = [];