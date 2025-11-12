import { RemixI18Next } from 'remix-i18next/server';
import { createCookie } from 'react-router';
import Backend from 'i18next-fs-backend';
import { resolve } from 'node:path';

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
    ns: ['common', 'game', 'feedback', 'share', 'result'],
  },
  plugins: [Backend],
  backend: {
    loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json'),
  },
});
