import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";
import { useState, useRef } from "react";
import { Header } from "~/components/Header";
import { CodeDisplay } from "~/components/CodeDisplay";
import { RequirementsDisplay } from "~/components/RequirementsDisplay";
import { ReviewInput } from "~/components/ReviewInput";
import { problems } from "~/data/problems";
import { updateScore } from "~/utils/storage";
import type { Problem } from "~/types/problem";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.problem.title} - Code Review Game` },
    { name: "description", content: data?.problem.title },
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

  const languageProblems = problems[lang as keyof typeof problems];

  if (!languageProblems) {
    throw new Response("Language not found", { status: 404 });
  }

  const levelKey = levelNum.toString() as keyof typeof languageProblems;
  const problem = languageProblems[levelKey];

  if (!problem) {
    throw new Response("Problem not found", { status: 404 });
  }

  // The problem is already properly typed from the const assertion
  return json({ problem, language: lang, level: levelNum });
}

export default function ProblemPage() {
  const { problem, language, level } = useLoaderData<typeof loader>();
  const [review, setReview] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const focusTextareaEnd = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  };

  const handleLineClick = (lineNumber: number) => {
    const template = `コードの${lineNumber}行目: `;
    setReview((prev) => {
      if (prev) {
        return `${prev}\n${template}`;
      }
      return template;
    });

    setTimeout(() => focusTextareaEnd(), 0);
  };

  const handleRequirementClick = (text: string) => {
    if (!text.trim()) return;

    const template = `要件「${text.trim()}」について: `;
    setReview((prev) => {
      if (prev) {
        return `${prev}\n${template}`;
      }
      return template;
    });

    setTimeout(() => focusTextareaEnd(), 0);
  };

  const handleSubmit = () => {
    // Phase 1: Static evaluation (simple scoring based on length)
    const reviewLength = review.trim().length;
    let score = 0;

    if (reviewLength > 300) {
      score = 85;
    } else if (reviewLength > 150) {
      score = 70;
    } else if (reviewLength > 50) {
      score = 50;
    } else {
      score = 30;
    }

    // Save score to localStorage
    updateScore(language, level, score);

    // Navigate to result page with state
    navigate(`/${language}/${level}/result`, {
      state: {
        score,
        passed: score >= 70,
        review,
      },
    });
  };

  return (
    <div className="min-h-screen">
      <Header
        showBackButton
        backTo={`/${language}`}
        title={problem.title}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RequirementsDisplay
              requirements={problem.requirements}
              onRequirementClick={handleRequirementClick}
            />
          </div>

          <div className="lg:col-span-1">
            <CodeDisplay
              code={problem.code}
              language={problem.language}
              onLineClick={handleLineClick}
            />
          </div>

          <div className="lg:col-span-1">
            <ReviewInput
              ref={textareaRef}
              value={review}
              onChange={setReview}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
