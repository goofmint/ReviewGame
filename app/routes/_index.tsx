/**
 * Root Index - Locale Detection and Redirect
 * Detects user's preferred locale and redirects to the appropriate language
 */

import { redirect, type LoaderFunctionArgs } from "react-router";
import { availableLocales } from "~/data/problems";

export async function loader({ request }: LoaderFunctionArgs) {
  // Get Accept-Language header from the request
  const acceptLanguage = request.headers.get("Accept-Language");

  // Parse the Accept-Language header to get preferred locale
  let preferredLocale = "en"; // Default to English

  if (acceptLanguage) {
    // Extract the first language code (e.g., "ja-JP" -> "ja", "en-US" -> "en")
    const languages = acceptLanguage.split(",");
    for (const lang of languages) {
      const code = lang.split(";")[0].split("-")[0].trim();
      if (availableLocales.includes(code)) {
        preferredLocale = code;
        break;
      }
    }
  }

  // Redirect to the detected locale
  return redirect(`/${preferredLocale}`);
}

export default function Index() {
  // This component should never render as the loader always redirects
  return null;
}
