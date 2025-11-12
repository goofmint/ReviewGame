export interface Problem {
  title: string;
  difficulty: number;
  language: string;
  requirements: string;
  code: string;
  evaluationCriteria?: string;
}

export interface UserReview {
  content: string;
  submittedAt: string; // ISO 8601 timestamp (e.g., new Date().toISOString())
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  passed: boolean;
}

export interface ProgressState {
  [language: string]: {
    [level: string]: {
      // Level keys are strings like "1", "2", etc.
      unlocked: boolean;
      bestScore?: number;
      attempts: number;
    };
  };
}

export interface ShareImageData {
  score: number;
  language: string;
  level: number;
  timestamp: number;
}

export interface ShareResult {
  imageUrl: string;
  tweetText: string;
  tweetUrl: string;
}

export interface SavedResult {
  id: string;
  score: number;
  language: string;
  level: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  imageUrl: string;
  createdAt: number;
  locale: string;
}

export interface SaveResultRequest {
  score: number;
  language: string;
  level: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  imageUrl: string;
  locale: string;
}

export interface SaveResultResponse {
  id: string;
  url: string;
  imageUrl: string;
}
