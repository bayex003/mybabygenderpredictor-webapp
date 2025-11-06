export type ValidationResult =
  | { ok: true; label: 'ultrasound_side'; score: number }
  | { ok: false; label: 'ultrasound_front_back' | 'not_ultrasound' | 'blurry'; score: number; reason: string };

export async function validateUltrasound(file: File): Promise<ValidationResult> {
  const url = process.env.NEXT_PUBLIC_VALIDATOR_URL || '/api/validate';
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) return { ok: false, label: 'not_ultrasound', score: 0, reason: 'Validator error' };

  const data = await res.json();
  const label = (data.label ?? 'not_ultrasound') as ValidationResult['label'];
  const score = Number(data.score ?? 0);
  if (label === 'ultrasound_side' && score >= 0.7) return { ok: true, label, score };

  const reason =
    label === 'ultrasound_front_back' ? 'Side profile not detected.' :
    label === 'blurry' ? 'Image appears blurry.' :
    'This does not look like an ultrasound.';
  return { ok: false, label, score, reason };
}
