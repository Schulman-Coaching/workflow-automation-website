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

  async analyzeStyle(data: TrainingDataPoint[]): Promise<StyleProfile> {
    const combinedContent = data.map(d => d.content).join('\n---\n');
    
    const prompt = `
    Analyze the following messages and extract a linguistic style profile for the sender.
    Focus on:
    1. Tone (e.g., Professional, Casual, Academic, Enthusiastic)
    2. Formality (Scale of 1-10)
    3. Common Greetings (List them)
    4. Common Sign-offs (List them)
    5. Typical Phrases or Idioms (List them)
    6. Overall Style Summary (1-2 sentences)

    Format the response as a JSON object with the following keys:
    tone, formality (string like "Low", "Medium", "High"), greetings (array), signOffs (array), commonPhrases (array), styleSummary (string).

    Messages:
    ${combinedContent.slice(0, 5000)} // Truncate to avoid context limit
    `;

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'llama3', // or another preferred model
        prompt,
        stream: false,
        format: 'json'
      });

      return JSON.parse(response.data.response);
    } catch (error) {
      console.error('Error analyzing style with Ollama:', error);
      throw new Error('Failed to analyze user style');
    }
  }

  injectStyle(prompt: string, profile: StyleProfile): string {
    const styleContext = `
    Match the sender's voice:
    - Tone: ${profile.tone || 'Professional'}
    - Formality: ${profile.formality || 'Medium'}
    - Common Greetings: ${profile.greetings?.join(', ') || 'N/A'}
    - Common Sign-offs: ${profile.signOffs?.join(', ') || 'N/A'}
    - Typical Phrases: ${profile.commonPhrases?.join(', ') || 'N/A'}
    - Style Summary: ${profile.styleSummary || 'N/A'}
    `;

    return `${styleContext}\n\nTask: ${prompt}`;
  }
}
