/**
 * LLM Integration Module
 * Handles communication with LLM APIs for code review evaluation
 * Supports both Cloudflare AI and external APIs (OpenAI/Anthropic)
 */

import type { EvaluationResult } from "~/types/problem";
import { LLM_REQUEST_TIMEOUT, PASSING_SCORE } from "./constants";

/**
 * Interface for the LLM evaluation request
 */
interface EvaluationRequest {
  requirements: string;
  code: string;
  userReview: string;
  evaluationCriteria?: string;
}

/**
 * Interface for the raw LLM response
 * The LLM should return JSON in this format
 */
interface LLMEvaluationResponse {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

/**
 * Constructs the evaluation prompt for the LLM
 * This prompt guides the LLM to evaluate the user's code review
 *
 * @param request - The evaluation request containing code, requirements, and user review
 * @returns The complete prompt string
 */
function buildEvaluationPrompt(request: EvaluationRequest): string {
  return `あなたは経験豊富なコードレビューアです。新人エンジニアのコードレビューを評価してください。

【問題の要件】
${request.requirements}

【レビュー対象コード】
${request.code}

【新人エンジニアのレビュー】
${request.userReview}

${
  request.evaluationCriteria
    ? `【評価の参考基準】\n${request.evaluationCriteria}\n\n`
    : ""
}【評価タスク】
上記のコードと要件を分析し、新人エンジニアのレビューを以下の観点で評価してください：

1. 正確性（40点）: コードの実際の問題点を正しく指摘できているか
   - 要件を満たしていない箇所を見つけられているか
   - バグや潜在的な問題を指摘できているか

2. 網羅性（30点）: 重要な問題点を見逃していないか
   - エラーハンドリング、型チェック、境界値チェックなど
   - 要件の各項目に対する検証

3. 説明力（20点）: 指摘内容が分かりやすく、建設的に説明されているか
   - 具体的な行番号や箇所を示しているか
   - なぜ問題なのかを説明しているか

4. 実用性（10点）: 具体的な改善提案や代替案を示せているか
   - 修正方法を提示しているか
   - コード例を示しているか

【出力形式】
必ず以下のJSON形式で評価結果を返してください。他のテキストは含めないでください：

{
  "score": 75,
  "feedback": "全体的によくできています。主要な問題点を指摘できていますが、型チェックの重要性についての説明がやや不足しています。",
  "strengths": [
    "上限チェックの欠如を正確に指摘できています",
    "具体的な改善案を提示できています"
  ],
  "improvements": [
    "型チェックの重要性についてより詳しく説明できるとよいでしょう",
    "具体的なコード例を示すとさらに良いです"
  ]
}`;
}

/**
 * Calls the Anthropic Claude API to evaluate a code review
 * This function requires ANTHROPIC_API_KEY to be set in the environment
 *
 * @param prompt - The evaluation prompt
 * @param env - The environment object containing API keys
 * @returns The parsed LLM response
 */
async function callAnthropicAPI(
  prompt: string,
  env: { ANTHROPIC_API_KEY?: string }
): Promise<LLMEvaluationResponse> {
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Please set it in your environment."
    );
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_REQUEST_TIMEOUT);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Anthropic API error (${response.status}): ${errorText}`
      );
    }

    const data = await response.json() as { content?: Array<{ text?: string }> };

    // Extract the text content from Claude's response
    const textContent = data.content?.[0]?.text;
    if (!textContent) {
      throw new Error("No text content in Anthropic API response");
    }

    // Parse the JSON from the response
    // Claude may wrap JSON in code blocks, so we need to extract it
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON in LLM response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as LLMEvaluationResponse;

    // Validate the response structure
    if (
      typeof parsed.score !== "number" ||
      typeof parsed.feedback !== "string" ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.improvements)
    ) {
      throw new Error("Invalid LLM response structure");
    }

    return parsed;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "LLM request timed out. Please try again."
      );
    }

    throw error;
  }
}

/**
 * Evaluates a user's code review using an LLM
 * This is the main entry point for review evaluation
 *
 * @param request - The evaluation request
 * @param env - The environment object (may contain API keys)
 * @returns The evaluation result with score and feedback
 */
export async function evaluateReview(
  request: EvaluationRequest,
  env: { ANTHROPIC_API_KEY?: string }
): Promise<EvaluationResult> {
  // Build the prompt
  const prompt = buildEvaluationPrompt(request);

  // Call the LLM API
  const llmResponse = await callAnthropicAPI(prompt, env);

  // Ensure score is within valid range
  const score = Math.max(0, Math.min(100, Math.round(llmResponse.score)));

  // Construct the evaluation result
  const result: EvaluationResult = {
    score,
    feedback: llmResponse.feedback,
    strengths: llmResponse.strengths,
    improvements: llmResponse.improvements,
    passed: score >= PASSING_SCORE,
  };

  return result;
}

/**
 * Creates a mock evaluation for development/testing
 * Use this when API keys are not available
 *
 * @param request - The evaluation request
 * @returns A mock evaluation result
 */
export function createMockEvaluation(
  request: EvaluationRequest
): EvaluationResult {
  // Simple heuristic: longer reviews with specific keywords get higher scores
  const reviewLength = request.userReview.length;
  const hasLineReference = /[行目|line|行]/i.test(request.userReview);
  const hasCodeExample = /```/.test(request.userReview);
  const mentionsMultipleIssues =
    request.userReview.split(/\n/).filter((line) => line.trim().startsWith("-"))
      .length > 2;

  let score = 50;
  if (reviewLength > 100) score += 10;
  if (reviewLength > 200) score += 10;
  if (hasLineReference) score += 10;
  if (hasCodeExample) score += 10;
  if (mentionsMultipleIssues) score += 10;

  const passed = score >= PASSING_SCORE;

  return {
    score,
    passed,
    feedback: passed
      ? "良いレビューです！多くの問題点を指摘できています。"
      : "もう少し詳しく問題点を指摘してみましょう。",
    strengths: hasLineReference
      ? ["具体的な行番号を示しています"]
      : [],
    improvements: !hasCodeExample
      ? ["改善案としてコード例を示すとより良いでしょう"]
      : [],
  };
}
