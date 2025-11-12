/**
 * LLM Integration Module
 * Handles communication with LLM APIs for code review evaluation
 * Uses Google Gemini API for evaluation
 */

import { GoogleGenAI } from "@google/genai";
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
  locale?: string; // Add locale parameter
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
 * Prompt templates by locale
 */
const PROMPT_TEMPLATES = {
  ja: (request: EvaluationRequest) => `あなたは経験豊富なコードレビューアです。新人エンジニアのコードレビューを評価してください。

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
}`,

  en: (request: EvaluationRequest) => `You are an experienced code reviewer. Please evaluate the code review written by a junior engineer.

【Requirements】
${request.requirements}

【Code to Review】
${request.code}

【Junior Engineer's Review】
${request.userReview}

${
  request.evaluationCriteria
    ? `【Evaluation Reference】\n${request.evaluationCriteria}\n\n`
    : ""
}【Evaluation Task】
Analyze the code and requirements above, and evaluate the junior engineer's review from the following perspectives:

1. Accuracy (40 points): Can they correctly identify actual problems in the code?
   - Can they find areas that don't meet requirements?
   - Can they point out bugs and potential issues?

2. Completeness (30 points): Are they missing any important issues?
   - Error handling, type checking, boundary value checking, etc.
   - Verification of each requirement item

3. Clarity (20 points): Are their explanations clear and constructive?
   - Do they indicate specific line numbers or locations?
   - Do they explain why something is a problem?

4. Practicality (10 points): Do they provide specific improvement suggestions or alternatives?
   - Do they suggest how to fix issues?
   - Do they provide code examples?

【Output Format】
Please return the evaluation result in JSON format only, without any other text:

{
  "score": 75,
  "feedback": "Overall well done. You correctly identified the main issues, but the explanation about the importance of type checking could be more detailed.",
  "strengths": [
    "You accurately identified the missing upper limit check",
    "You provided specific improvement suggestions"
  ],
  "improvements": [
    "You could explain the importance of type checking in more detail",
    "Providing specific code examples would be even better"
  ]
}`
};

/**
 * Constructs the evaluation prompt for the LLM
 * This prompt guides the LLM to evaluate the user's code review
 *
 * @param request - The evaluation request containing code, requirements, and user review
 * @returns The complete prompt string
 */
function buildEvaluationPrompt(request: EvaluationRequest): string {
  const locale = request.locale || 'en';
  const template = PROMPT_TEMPLATES[locale as keyof typeof PROMPT_TEMPLATES] || PROMPT_TEMPLATES.en;
  return template(request);
}

/**
 * Calls the Google Gemini API to evaluate a code review
 * This function requires GEMINI_API_KEY to be set in the environment
 *
 * @param prompt - The evaluation prompt
 * @param env - The environment object containing API keys
 * @returns The parsed LLM response
 */
async function callGeminiAPI(
  prompt: string,
  env: { GEMINI_API_KEY?: string }
): Promise<LLMEvaluationResponse> {
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please set it in your environment."
    );
  }

  try {
    // Initialize Gemini AI client
    const ai = new GoogleGenAI({ apiKey });

    // Generate content with timeout handling using gemini-2.0-flash-exp model
    const generatePromise = ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), LLM_REQUEST_TIMEOUT);
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);

    // Extract text from response
    const textContent = response.text;

    if (!textContent) {
      throw new Error("No text content in Gemini API response");
    }

    // Parse the JSON from the response
    // Gemini may wrap JSON in code blocks or include extra text, so we need to extract it
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
    if (error instanceof Error && error.message.includes("timed out")) {
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
  env: { GEMINI_API_KEY?: string }
): Promise<EvaluationResult> {
  // Build the prompt
  const prompt = buildEvaluationPrompt(request);

  // Call the LLM API
  const llmResponse = await callGeminiAPI(prompt, env);

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
