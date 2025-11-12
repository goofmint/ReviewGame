import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

let i18nInitialized = false;

export async function initI18n(locale: string = "en") {
  if (i18nInitialized) {
    // Just change language if already initialized
    if (i18n.language !== locale) {
      await i18n.changeLanguage(locale);
    }
    return i18n;
  }

  await i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      supportedLngs: ["ja", "en"],
      fallbackLng: "en",
      lng: locale,
      defaultNS: "common",
      ns: ["common", "game", "feedback", "share"],
      backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json",
      },
      detection: {
        order: ["htmlTag", "path"],
        caches: [],
      },
      react: {
        useSuspense: false,
      },
      interpolation: {
        escapeValue: false,
      },
    });

  i18nInitialized = true;
  return i18n;
}

export { i18n };
