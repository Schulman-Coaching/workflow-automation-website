import { StyleProfile } from '@flowstack/common';
import axios from 'axios';

export interface TrainingDataPoint {
  content: string;
  metadata?: any;
}

export class UserVoiceService {
  protected ollamaUrl: string;

  constructor(ollamaUrl: string = 'http://localhost:11434') {
    this.ollamaUrl = ollamaUrl;
  }

  async analyzeStyle(data: TrainingDataPoint[], context?: { bio?: string, industry?: string }): Promise<StyleProfile> {
    const combinedContent = data.map(d => d.content).join('\n---\n');
    
    const prompt = `
    You are a Master Linguistic Profiler. Analyze the following 20-50 message samples from a user to extract a high-fidelity "User Voice" profile.
    
    CONTEXT OVERRIDE:
    User Bio: ${context?.bio || 'Not provided'}
    Industry: ${context?.industry || 'Not provided'}

    CRITICAL ANALYSIS GOALS:
    1. TONE: Identify the dominant emotional frequency (e.g., "Warm & Empathetic", "Ultra-Direct & Concise").
    2. FORMALITY: Determine the exact level (Scale 1-10).
    3. GREETINGS & SIGN-OFFS: List the top 3 most frequently used variants.
    4. LINGUISTIC QUIRKS: Identify specific repetitive phrases, sentence structures, or industry-specific terminology.
    5. NEGATIVE CONSTRAINTS: Identify what this user NEVER says.

    Format the response as a JSON object with the following keys:
    tone (string), formality (string), greetings (string[]), signOffs (string[]), commonPhrases (string[]), styleSummary (string), negativeConstraints (string[]).

    Messages to Analyze:
    ${combinedContent.slice(0, 10000)}
    `;

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'llama3',
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.1, // High precision for analysis
        }
      });

      return JSON.parse(response.data.response);
    } catch (error) {
      console.error('Error analyzing style with Ollama:', error);
      throw new Error('Failed to analyze user style');
    }
  }

  injectStyle(prompt: string, profile: StyleProfile): string {
    const styleContext = `
    ROLE: You are the user's AI Assistant. You MUST mirror their unique voice perfectly.
    
    USER STYLE PROFILE:
    - Dominant Tone: ${profile.tone || 'Professional'}
    - Formality Level: ${profile.formality || 'Medium'}
    - Standard Greetings: ${profile.greetings?.join(', ') || 'N/A'}
    - Standard Sign-offs: ${profile.signOffs?.join(', ') || 'N/A'}
    - Signature Phrases: ${profile.commonPhrases?.join(', ') || 'N/A'}
    - Core Linguistic Identity: ${profile.styleSummary || 'N/A'}
    
    STRICT CONSTRAINTS (NEVER DO THESE):
    ${profile.negativeConstraints?.length ? profile.negativeConstraints.map(c => `- ${c}`).join('\n') : '- No generic filler phrases like "Hope this email finds you well" unless explicitly in the profile.'}
    
    INSTRUCTIONS:
    1. Draft the response following the exact formality and tone above.
    2. Use one of the standard greetings and sign-offs if appropriate.
    3. If the user is typically brief, keep the response under 3 sentences.
    `;

    return `${styleContext}\n\nUSER TASK: ${prompt}`;
  }
}
