/**
 * Review Evaluation API Route
 * Handles POST requests to evaluate user code reviews using LLM
 *
 * This route is called from the problem page when users submit their reviews
 * It returns a JSON response with the evaluation result
 *
 * This is a resource route - it only accepts POST requests for evaluation
 */

import { evaluateReview, createMockEvaluation } from "~/utils/llm";
import { problems } from "~/data/problems";

/**
 * GET handler - Rejects GET requests with Method Not Allowed
 * This endpoint only accepts POST requests
 */
export async function loader() {
  return Response.json(
    {
      error: "Method Not Allowed. This endpoint only accepts POST requests.",
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
      },
    }
  );
}

/**
 * Request body interface for the evaluation endpoint
 */
interface EvaluationRequestBody {
  language: string;
  level: string;
  review: string;
}

/**
 * Validates the request body
 * Ensures all required fields are present and valid
 *
 * @param body - The request body to validate
 * @returns An error message if invalid, or null if valid
 */
function validateRequest(body: EvaluationRequestBody): string | null {
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

  // Check if the problem exists
  if (!(body.language in problems)) {
    return "Unknown language";
  }

  const langProblems = problems[body.language as keyof typeof problems];
  if (!(body.level in langProblems)) {
    return "Unknown level for this language";
  }

  return null;
}

/**
 * POST handler for review evaluation
 * Accepts a review submission and returns an evaluation from the LLM
 */
export async function action({ request, context }: { request: Request; context?: { cloudflare?: { env?: Record<string, unknown> } } }) {
  // Ensure this is a POST request
  if (request.method !== "POST") {
    return Response.json(
      {
        error: "Method Not Allowed. This endpoint only accepts POST requests.",
      },
      {
        status: 405,
        headers: {
          Allow: "POST",
        },
      }
    );
  }

  try {
    // Parse request body
    const body = (await request.json()) as EvaluationRequestBody;

    // Validate request
    const validationError = validateRequest(body);
    if (validationError) {
      return Response.json(
        {
          error: validationError,
        },
        { status: 400 }
      );
    }

    // Get the problem data
    const langProblems = problems[body.language as keyof typeof problems];
    const problem = langProblems[body.level as keyof typeof langProblems];

    // Prepare evaluation request
    const evaluationRequest = {
      requirements: problem.requirements,
      code: problem.code,
      userReview: body.review,
      evaluationCriteria: problem.evaluationCriteria,
    };

    // Get environment from context (Cloudflare Workers)
    const env = (context?.cloudflare?.env ?? {}) as {
      GEMINI_API_KEY?: string;
    };

    let result;

    // Try to use real LLM evaluation if API key is available
    if (env.GEMINI_API_KEY) {
      try {
        result = await evaluateReview(evaluationRequest, env);
      } catch (error) {
        // If LLM call fails, log error and fall back to mock
        console.error("LLM evaluation failed, falling back to mock:", error);
        result = createMockEvaluation(evaluationRequest);
      }
    } else {
      // No API key configured, use mock evaluation
      console.warn("GEMINI_API_KEY not configured, using mock evaluation");
      result = createMockEvaluation(evaluationRequest);
    }

    return Response.json(result);
  } catch (error) {
    // Handle unexpected errors
    console.error("Error in evaluation API:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during evaluation",
      },
      { status: 500 }
    );
  }
}
