import fs from "fs";
import path from "path";
import matter from "gray-matter";

const problemsDir = path.join(process.cwd(), "problems");
const outputPath = path.join(process.cwd(), "app/data/problems.ts");

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), "app/data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Check if problems directory exists
if (!fs.existsSync(problemsDir)) {
  console.warn("Warning: problems/ directory does not exist. Creating empty problems data.");
  const output = `// このファイルは自動生成されます。直接編集しないでください。
export const problems = {} as const;
export const availableLanguages = [] as const;
`;
  fs.writeFileSync(outputPath, output, "utf8");
  process.exit(0);
}

// ロケールを動的に検出（problems/内のディレクトリを走査）
const locales = fs
  .readdirSync(problemsDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

const allProblems: Record<string, Record<string, Record<number, any>>> = {};
const programmingLanguagesSet = new Set<string>();

// Helper function to remove heading line and trim
const removeHeading = (section: string | undefined): string => {
  if (!section) return "";
  const lines = section.split(/\r?\n/);
  const withoutHeading = lines.slice(1).join("\n").trim();
  return withoutHeading || "";
};

// Mapping for section headings in different locales
const sectionHeadings: Record<string, { requirements: string; code: string; criteria: string }> = {
  ja: { requirements: "要件", code: "コード", criteria: "評価基準" },
  en: { requirements: "Requirements", code: "Code", criteria: "Evaluation Criteria" },
};

locales.forEach((locale) => {
  allProblems[locale] = {};

  // 各ロケール内のプログラミング言語を検出
  const localeDir = path.join(problemsDir, locale);
  const languages = fs
    .readdirSync(localeDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  languages.forEach((lang) => {
    programmingLanguagesSet.add(lang);
    allProblems[locale][lang] = {};

    // レベルファイルを動的に検出
    const langDir = path.join(localeDir, lang);
    if (!fs.existsSync(langDir)) return;

    const levelFiles = fs.readdirSync(langDir).filter((f) => f.endsWith(".md"));

    levelFiles.forEach((file) => {
      const levelMatch = file.match(/level(\d+)\.md/);
      const level = parseInt(levelMatch?.[1] || "0");
      if (level === 0) return;

      const filePath = path.join(langDir, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(fileContent);

      // Markdownをセクションごとに分割
      const sections = content.split(/^# /m).filter(Boolean);

      // ロケールに応じたセクション見出しを取得
      const headings = sectionHeadings[locale] || sectionHeadings.en;

      const requirements = removeHeading(
        sections.find((s) => s.startsWith(headings.requirements))
      );

      const codeSection = sections.find((s) => s.startsWith(headings.code));
      const codeMatch = codeSection?.match(/```[\s\S]*?\n([\s\S]*?)```/);
      const code = codeMatch?.[1]?.trim() || "";

      const evaluationCriteria = removeHeading(
        sections.find((s) => s.startsWith(headings.criteria))
      );

      allProblems[locale][lang][level] = {
        title: data.title,
        difficulty: data.difficulty,
        language: data.language,
        locale: locale,
        requirements,
        code,
        evaluationCriteria,
      };
    });
  });
});

// app/data/problems.ts に出力
const programmingLanguages = Array.from(programmingLanguagesSet).sort();
const output = `// このファイルは自動生成されます。直接編集しないでください。
export const problems = ${JSON.stringify(allProblems, null, 2)} as const;
export const availableLocales = ${JSON.stringify(locales)} as const;
export const availableLanguages = ${JSON.stringify(programmingLanguages)} as const;
`;

fs.writeFileSync(outputPath, output, "utf8");
console.log(`✅ Generated problems.ts with ${locales.length} locale(s)`);
locales.forEach((locale) => {
  const languages = Object.keys(allProblems[locale]);
  console.log(`   ${locale}:`);
  languages.forEach((lang) => {
    const levelCount = Object.keys(allProblems[locale][lang]).length;
    console.log(`     - ${lang}: ${levelCount} level(s)`);
  });
});
