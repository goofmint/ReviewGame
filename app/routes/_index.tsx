import type { MetaFunction } from "@remix-run/cloudflare";
import { Header } from "~/components/Header";
import { LanguageSelector } from "~/components/LanguageSelector";
import { availableLanguages } from "~/data/problems";

export const meta: MetaFunction = () => {
  return [
    { title: "Code Review Game" },
    { name: "description", content: "コードレビューのスキルを楽しく学習" },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            プログラミング言語を選択
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            学習したい言語を選んでコードレビューに挑戦しましょう
          </p>
        </div>
        <LanguageSelector availableLanguages={availableLanguages} />
      </main>
    </div>
  );
}
