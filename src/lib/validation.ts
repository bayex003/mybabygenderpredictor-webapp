// src/lib/validation.ts

/**
 * Server/validator verdict for uploads.
 * We keep label as a generic string so TS doesn't clash with UI result types.
 */
export type ValidatorVerdict = {
  ok: boolean;
  /**
   * e.g. 'ultrasound_side' | 'front_back' | 'not_ultrasound' | 'blurry' | ...
   * Keep this permissive because the backend may evolve.
   */
  label: string;
  /** 0..1 heuristic confidence coming from the validator */
  score: number;
  /** Human-friendly reason/explanation */
  reason: string;
};

/** Helper to construct a failing verdict with a sensible default reason */
export function fail(
  label: string,
  score = 0,
  reason?: string
): ValidatorVerdict {
  const fallback =
    label === 'blurry'
      ? 'Image appears blurry.'
      : 'This does not look like an ultrasound.';
  return { ok: false, label, score, reason: reason ?? fallback };
}

/** Helper to construct a passing verdict */
export function pass(
  score: number,
  reason = 'Valid ultrasound side-profile image.'
): ValidatorVerdict {
  return { ok: true, label: 'ultrasound_side', score, reason };
}