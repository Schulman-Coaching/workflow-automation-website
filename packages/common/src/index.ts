export interface StyleProfile {
  tone?: string;
  formality?: string;
  greetings?: string[];
  signOffs?: string[];
  commonPhrases?: string[];
  styleSummary?: string;
  negativeConstraints?: string[];
}

export type TrainingStatus = 'pending' | 'ingesting' | 'analyzing' | 'completed' | 'failed';

export interface UserVoiceContext {
  userId: string;
  organizationId: string;
  styleProfile: StyleProfile;
  bio?: string; // e.g. "Yossi Newman, founder of MBA Supply"
  industry?: string; // e.g. "Supply Chain / Wholesale"
}
