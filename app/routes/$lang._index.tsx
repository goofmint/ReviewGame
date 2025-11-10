import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";
import { Header } from "~/components/Header";
import { LevelSelector } from "~/components/LevelSelector";
import { problems } from "~/data/problems";
import { useProgress } from "~/hooks/useProgress";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.language} - Code Review Game` },
    { name: "description", content: `${data?.language}のレベルを選択` },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const language = params.lang;

  if (!language) {
    throw new Response("Language not specified", { status: 400 });
  }

  const languageProblems = problems[language as keyof typeof problems];

  if (!languageProblems) {
    throw new Response("Language not found", { status: 404 });
  }

  const levels = Object.keys(languageProblems)
    .map((k) => parseInt(k, 10))
    .filter((l) => !isNaN(l))
    .sort((a, b) => a - b);

  return json({ language, levels });
}

export default function LanguageLevels() {
  const { language, levels } = useLoaderData<typeof loader>();
  const { progress } = useProgress();

  return (
    <div className="min-h-screen">
      <Header showBackButton backTo="/" title={`${language} レベル選択`} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            レベルを選択
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            挑戦するレベルを選んでください
          </p>
        </div>
        <LevelSelector language={language} levels={levels} progress={progress} />
      </main>
    </div>
  );
}
