import { RemixI18Next } from 'remix-i18next/server';
import { createCookie } from 'react-router';
import resourcesToBackend from 'i18next-resources-to-backend';

// Import translation resources
import enCommon from '~/locales/en/common.json';
import enGame from '~/locales/en/game.json';
import enFeedback from '~/locales/en/feedback.json';
import enShare from '~/locales/en/share.json';

import jaCommon from '~/locales/ja/common.json';
import jaGame from '~/locales/ja/game.json';
import jaFeedback from '~/locales/ja/feedback.json';
import jaShare from '~/locales/ja/share.json';

// Define translation resources
const resources = {
  en: {
    common: enCommon,
    game: enGame,
    feedback: enFeedback,
    share: enShare,
  },
  ja: {
    common: jaCommon,
    game: jaGame,
    feedback: jaFeedback,
    share: jaShare,
  },
};

// Cookie for storing user's locale preference
export const localeCookie = createCookie('locale', {
  path: '/',
  sameSite: 'lax',
  maxAge: 31536000, // 1 year
  httpOnly: true,
});

export const i18n = new RemixI18Next({
  detection: {
    supportedLanguages: ['ja', 'en'],
    fallbackLanguage: 'en',
    cookie: localeCookie,
  },
  i18next: {
    defaultNS: 'common',
    ns: ['common', 'game', 'feedback', 'share'],
    resources,
  },
  // Use resources-to-backend for Cloudflare Workers compatibility
  plugins: [resourcesToBackend(resources)],
});
