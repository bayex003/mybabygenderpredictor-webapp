// src/lib/validation.ts

/**
 * Verdict returned by the validator (backend).
 * Keep label as a generic string so we never clash with UI result types.
 */
export type ValidationResult = {
  ok: boolean;
  label: string;   // <- RELAXED (no string unions)
  score: number;   // 0..1 heuristic confidence
  reason: string;  // human-friendly explanation
};

/** Failing verdict helper */
export function fail(
  label: string,
  score = 0,
  reason?: string
): ValidationResult {
  const fallback =
    label === 'blurry'
      ? 'Image appears blurry.'
      : 'This does not look like an ultrasound.';
  return { ok: false, label, score, reason: reason ?? fallback };
}

/** Passing verdict helper */
export function pass(
  score: number,
  reason = 'Valid ultrasound side-profile image.'
): ValidationResult {
  return { ok: true, label: 'ultrasound_side', score, reason };
}