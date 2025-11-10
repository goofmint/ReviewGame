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
  submittedAt: Date;
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
    [level: number]: {
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
