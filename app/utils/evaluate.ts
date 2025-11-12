/**
 * Review Evaluation API Route
 * Handles POST requests to evaluate user code reviews using LLM
 *
 * This route is called from the problem page when users submit their reviews
 * It returns a JSON response with the evaluation result
 *
 * This is a resource route - it only accepts POST requests for evaluation
 */

import { evaluateReview } from "~/utils/llm";
import { problems } from "~/data/problems";
import type { EvaluationResult } from "~/types/problem";
import type { EvaluationRequestBody } from "~/types/evaluate";
/**
 * Validates the request body
 * Ensures all required fields are present and valid
 *
 * @param body - The request body to validate
 * @returns An error message if invalid, or null if valid
 */
function validateRequest(body: EvaluationRequestBody): string | null {
  if (!body.locale || typeof body.locale !== "string") {
    return "Invalid or missing locale parameter";
  }

  if (!body.language || typeof body.language !== "string") {
    return "Invalid or missing language parameter";
  }

  if (!body.level || typeof body.level !== "string") {
    return "Invalid or missing level parameter";
  }

  if (!body.review || typeof body.review !== "string") {
    return "Invalid or missing review content";
  }

  if (body.review.trim().length < 10) {
    return "Review is too short. Please provide more detailed feedback.";
  }

  // Check if the problem exists with locale support
  if (!(body.locale in problems)) {
    return "Unknown locale";
  }

  const localeProblems = problems[body.locale as keyof typeof problems];
  if (!(body.language in localeProblems)) {
    return "Unknown language";
  }

  const langProblems = localeProblems[body.language as keyof typeof localeProblems];
  if (!(body.level in langProblems)) {
    return "Unknown level for this language";
  }

  return null;
}

/**
 * POST handler for review evaluation
 * Accepts a review submission and returns an evaluation from the LLM
 */
export async function evaluate(body: EvaluationRequestBody, env: { GEMINI_API_KEY?: string }): Promise<EvaluationResult> {
  console.log("Received evaluation request");

  try {
    // Validate request
    const validationError = validateRequest(body);
    if (validationError) throw new Error(validationError);

    // Get the problem data with locale support
    const localeProblems = problems[body.locale as keyof typeof problems];
    const langProblems = localeProblems[body.language as keyof typeof localeProblems];
    const problem = langProblems[body.level as keyof typeof langProblems];

    // Prepare evaluation request
    const evaluationRequest = {
      requirements: problem.requirements,
      code: problem.code,
      userReview: body.review,
      evaluationCriteria: problem.evaluationCriteria,
    };
    // Try to use real LLM evaluation if API key is available
    return evaluateReview(evaluationRequest, env);
  } catch (error) {
    // Validation errors should be re-thrown as-is
    if (error instanceof Error) {
      // Check if this is a validation error (from validateRequest)
      if (
        error.message.includes("Invalid") ||
        error.message.includes("missing") ||
        error.message.includes("too short") ||
        error.message.includes("Unknown")
      ) {
        throw error;
      }
    }

    // Wrap other errors with LLM fallback message
    throw new Error(`LLM evaluation failed, falling back to mock: ${(error as Error).message}`, {
      cause: error,
    });
  }
}
