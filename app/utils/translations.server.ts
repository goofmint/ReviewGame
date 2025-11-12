/**
 * Simple server-side translation utility
 *
 * Directly imports translation JSON files for use in loaders.
 * No complex i18next setup needed for simple meta tag translations.
 */

// Import all translation files
import jaCommon from '../../public/locales/ja/common.json';
import jaGame from '../../public/locales/ja/game.json';
import jaFeedback from '../../public/locales/ja/feedback.json';
import jaShare from '../../public/locales/ja/share.json';
import jaResult from '../../public/locales/ja/result.json';

import enCommon from '../../public/locales/en/common.json';
import enGame from '../../public/locales/en/game.json';
import enFeedback from '../../public/locales/en/feedback.json';
import enShare from '../../public/locales/en/share.json';
import enResult from '../../public/locales/en/result.json';

const translations = {
  ja: {
    common: jaCommon,
    game: jaGame,
    feedback: jaFeedback,
    share: jaShare,
    result: jaResult,
  },
  en: {
    common: enCommon,
    game: enGame,
    feedback: enFeedback,
    share: enShare,
    result: enResult,
  },
} as const;

/**
 * Simple translation function for server-side use
 *
 * @param locale - Locale (ja or en)
 * @param namespace - Translation namespace
 * @param key - Translation key (supports nested keys with dot notation)
 * @param params - Optional parameters for interpolation
 * @returns Translated string
 */
export function t(
  locale: 'ja' | 'en',
  namespace: 'common' | 'game' | 'feedback' | 'share' | 'result',
  key: string,
  params?: Record<string, string | number>
): string {
  const ns = translations[locale]?.[namespace] as Record<string, unknown>;
  if (!ns) return key;

  // Support nested keys (e.g., "meta.titleTemplate")
  const keys = key.split('.');
  let value: unknown = ns;

  for (const k of keys) {
    if (typeof value === 'object' && value !== null && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key; // Key not found, return the key itself
    }
  }

  if (typeof value !== 'string') return key;

  // Simple parameter interpolation
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
      return String(params[paramKey] ?? `{{${paramKey}}}`);
    });
  }

  return value;
}
