import fs from "fs";
import path from "path";
import matter from "gray-matter";

interface ProblemData {
  title: string;
  difficulty: number;
  language: string;
  requirements: string;
  code: string;
  evaluationCriteria?: string;
}

interface AllProblems {
  [language: string]: {
    [level: number]: ProblemData;
  };
}

const problemsDir = path.join(process.cwd(), "problems");
const outputPath = path.join(process.cwd(), "app/data/problems.ts");

function buildProblems(): void {
  if (!fs.existsSync(problemsDir)) {
    console.error(`Problems directory not found: ${problemsDir}`);
    process.exit(1);
  }

  const languages = fs
    .readdirSync(problemsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const allProblems: AllProblems = {};

  for (const lang of languages) {
    allProblems[lang] = {};

    const langDir = path.join(problemsDir, lang);
    const levelFiles = fs
      .readdirSync(langDir)
      .filter((f) => f.endsWith(".md"));

    for (const file of levelFiles) {
      const match = file.match(/level(\d+)\.md/);
      if (!match) continue;

      const level = parseInt(match[1], 10);
      if (level === 0 || isNaN(level)) continue;

      const filePath = path.join(langDir, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(fileContent);

      const sections = content.split(/^# /m).filter(Boolean);

      // Helper function to remove heading line and trim
      const removeHeading = (section: string | undefined): string => {
        if (!section) return "";
        const lines = section.split(/\r?\n/);
        const withoutHeading = lines.slice(1).join("\n").trim();
        return withoutHeading || "";
      };

      const requirements = removeHeading(
        sections.find((s) => s.startsWith("要件"))
      );

      const codeSection = sections.find((s) => s.startsWith("コード"));
      const codeMatch = codeSection?.match(/```[\s\S]*?\n([\s\S]*?)```/);
      const code = codeMatch?.[1]?.trim() ?? "";

      const evaluationCriteria = removeHeading(
        sections.find((s) => s.startsWith("評価基準"))
      );

      allProblems[lang][level] = {
        title: data.title as string,
        difficulty: data.difficulty as number,
        language: data.language as string,
        requirements,
        code,
        evaluationCriteria,
      };
    }
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const output = `// このファイルは自動生成されます。直接編集しないでください。
import type { ProblemsData } from "~/types/problem";

export const problems = ${JSON.stringify(allProblems, null, 2)} as const satisfies ProblemsData;

export const availableLanguages = ${JSON.stringify(languages)} as const;

export type AvailableLanguage = (typeof availableLanguages)[number];
`;

  fs.writeFileSync(outputPath, output, "utf8");
  console.log(`✅ Problems built successfully: ${outputPath}`);
  console.log(`📚 Languages: ${languages.join(", ")}`);
  console.log(
    `📝 Total problems: ${Object.values(allProblems).reduce(
      (sum, levels) => sum + Object.keys(levels).length,
      0
    )}`
  );
}

buildProblems();
