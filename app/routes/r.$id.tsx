/**
 * Saved Result Display Route
 * Displays a previously saved review result
 * Shows OGP meta tags for social media sharing
 */

import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { useEffect, useState } from "react";
import type { SavedResult } from "~/types/problem";
import { SavedResultView } from "~/components/SavedResultView";
import { initI18n } from "~/utils/i18n.client";

/**
 * Cloudflare Workers KV namespace binding
 */
interface KVNamespace {
  get(key: string): Promise<string | null>;
}

/**
 * Environment bindings for Cloudflare Workers
 */
interface Env {
  RESULTS_KV?: KVNamespace;
}

/**
 * Loader data structure
 */
interface LoaderData {
  result: SavedResult;
}

/**
 * Loader function - fetches saved result from KV
 */
export async function loader({ params, context }: LoaderFunctionArgs) {
  console.log("Results loader called with params:", params);
  const { id } = params;

  if (!id) {
    console.error("Result ID is missing");
    throw new Response("Result ID is required", { status: 400 });
  }

  console.log("Looking up result ID:", id);

  // Get KV namespace from context
  const env = context.cloudflare?.env as Env | undefined;
  console.log("Environment available:", !!env);
  console.log("RESULTS_KV binding available:", !!env?.RESULTS_KV);

  const kv = env?.RESULTS_KV;
  if (!kv) {
    console.error("RESULTS_KV binding is missing - env:", env);
    throw new Response("Result storage configuration is missing", {
      status: 500,
    });
  }

  // Fetch result from KV
  const key = `result:${id}`;
  console.log("Fetching from KV with key:", key);
  const resultJson = await kv.get(key);
  console.log("KV result:", resultJson ? "found" : "not found");

  if (!resultJson) {
    console.error("Result not found in KV for key:", key);
    throw new Response("Result not found", { status: 404 });
  }

  try {
    const result = JSON.parse(resultJson) as SavedResult;
    console.log("Successfully parsed result:", result.id);
    return { result };
  } catch (error) {
    console.error("Failed to parse result data:", error);
    throw new Response("Invalid result data", { status: 500 });
  }
}

/**
 * Meta function - sets OGP tags for social media sharing
 */
export function meta({ data }: { data: LoaderData | null }) {
  if (!data?.result) {
    return [
      { title: "Result Not Found" },
      { name: "description", content: "The requested result could not be found" },
    ];
  }

  const { result } = data;
  const title = `Code Review Game - ${result.score}点獲得！`;
  const description = `${result.language} Level ${result.level}`;

  return [
    { title },
    { name: "description", content: description },
    // Open Graph tags
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: result.imageUrl },
    { property: "og:type", content: "website" },
    // Twitter Card tags
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: result.imageUrl },
  ];
}

/**
 * Saved Result Page Component
 */
export default function SavedResultPage() {
  const { result } = useLoaderData<LoaderData>();
  const [i18nReady, setI18nReady] = useState(false);

  // Initialize i18n with the saved locale
  useEffect(() => {
    if (result.locale) {
      initI18n(result.locale).then(() => {
        setI18nReady(true);
      });
    }
  }, [result.locale]);

  if (!i18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return <SavedResultView result={result} />;
}
