import type { TFunction } from 'i18next';

/**
 * Map AI service error payloads (string | object) to localized messages.
 * Falls back to the raw string when not recognized.
 */
export const mapAiErrorMessage = (msg: unknown, t: TFunction): string | undefined => {
  let raw: string | undefined;
  if (typeof msg === 'string') {
    raw = msg;
  } else if (msg && typeof msg === 'object') {
    const payload = msg as { message?: unknown; error?: unknown; detail?: unknown };
    raw =
      (typeof payload.message === 'string' && payload.message) ||
      (typeof payload.error === 'string' && payload.error) ||
      (typeof payload.detail === 'string' && payload.detail) ||
      undefined;
  }
  if (!raw) return undefined;

  const normalized = raw.trim().toUpperCase();
  const aiErrors = new Set<string>([
    'AI_SERVICE_DISABLED',
    'AI_SERVICE_PLAN_INVALID',
    'AI_SERVICE_ERROR',
    'AI_SERVICE_UNAVAILABLE',
    'AI_SERVICE_REQUEST_FAILED'
  ]);

  if (aiErrors.has(normalized)) return t(`error.${normalized}`);
  if (normalized.startsWith('AI_SERVICE')) return t('error.AI_SERVICE_ERROR');
  return raw;
};
