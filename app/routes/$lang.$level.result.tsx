import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, useLocation, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";
import { useEffect } from "react";
import { Header } from "~/components/Header";
import { ResultView } from "~/components/ResultView";

interface LocationState {
  score: number;
  passed: boolean;
  review: string;
}

export const meta: MetaFunction = () => {
  return [
    { title: "結果 - Code Review Game" },
    { name: "description", content: "レビュー結果" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { lang, level } = params;

  if (!lang || !level) {
    throw new Response("Invalid parameters", { status: 400 });
  }

  const levelNum = parseInt(level, 10);

  if (isNaN(levelNum)) {
    throw new Response("Invalid level", { status: 400 });
  }

  return json({ language: lang, level: levelNum });
}

export default function ResultPage() {
  const { language, level } = useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  // If no state, redirect back to problem page
  useEffect(() => {
    if (!state) {
      navigate(`/${language}/${level}`, { replace: true });
    }
  }, [state, language, level, navigate]);

  if (!state) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header showBackButton backTo="/" title="結果" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ResultView
          score={state.score}
          passed={state.passed}
          review={state.review}
          language={language}
          level={level}
        />
      </main>
    </div>
  );
}
