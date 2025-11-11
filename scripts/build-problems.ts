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

// 言語を動的に検出（problems/内のディレクトリを走査）
const languages = fs
  .readdirSync(problemsDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

const allProblems: Record<string, Record<number, any>> = {};

// Helper function to remove heading line and trim
const removeHeading = (section: string | undefined): string => {
  if (!section) return "";
  const lines = section.split(/\r?\n/);
  const withoutHeading = lines.slice(1).join("\n").trim();
  return withoutHeading || "";
};

languages.forEach((lang) => {
  allProblems[lang] = {};

  // レベルファイルを動的に検出
  const langDir = path.join(problemsDir, lang);
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

    const requirements = removeHeading(
      sections.find((s) => s.startsWith("要件"))
    );

    const codeSection = sections.find((s) => s.startsWith("コード"));
    const codeMatch = codeSection?.match(/```[\s\S]*?\n([\s\S]*?)```/);
    const code = codeMatch?.[1]?.trim() || "";

    const evaluationCriteria = removeHeading(
      sections.find((s) => s.startsWith("評価基準"))
    );

    allProblems[lang][level] = {
      title: data.title,
      difficulty: data.difficulty,
      language: data.language,
      requirements,
      code,
      evaluationCriteria,
    };
  });
});

// app/data/problems.ts に出力
const output = `// このファイルは自動生成されます。直接編集しないでください。
export const problems = ${JSON.stringify(allProblems, null, 2)} as const;
export const availableLanguages = ${JSON.stringify(languages)} as const;
`;

fs.writeFileSync(outputPath, output, "utf8");
console.log(`✅ Generated problems.ts with ${languages.length} language(s)`);
languages.forEach((lang) => {
  const levelCount = Object.keys(allProblems[lang]).length;
  console.log(`   - ${lang}: ${levelCount} level(s)`);
});
