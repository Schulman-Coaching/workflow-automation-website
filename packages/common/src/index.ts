export interface StyleProfile {
  tone?: string;
  formality?: string;
  greetings?: string[];
  signOffs?: string[];
  commonPhrases?: string[];
  styleSummary?: string;
}

export type TrainingStatus = 'pending' | 'ingesting' | 'analyzing' | 'completed' | 'failed';

export interface UserVoiceContext {
  userId: string;
  organizationId: string;
  styleProfile: StyleProfile;
}
