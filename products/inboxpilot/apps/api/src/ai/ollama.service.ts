import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@/common/redis/redis.service';
import * as crypto from 'crypto';

export interface OllamaResponse {
  content: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
  cached: boolean;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly timeoutMs: number;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.baseUrl = this.configService.get<string>('ai.ollama.baseUrl')!;
    this.model = this.configService.get<string>('ai.ollama.model')!;
    this.maxTokens = this.configService.get<number>('ai.ollama.maxTokens')!;
    this.temperature = this.configService.get<number>('ai.ollama.temperature')!;
    this.timeoutMs = this.configService.get<number>('ai.ollama.timeoutMs')!;
  }

  async generate(
    prompt: string,
    systemPrompt: string,
    options: { useCache?: boolean; cacheTtl?: number } = {},
  ): Promise<OllamaResponse> {
    const { useCache = true, cacheTtl = 86400 } = options;
    const startTime = Date.now();

    // Check cache
    if (useCache) {
      const cacheKey = this.getCacheKey(prompt, systemPrompt);
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        const response = JSON.parse(cached) as OllamaResponse;
        return { ...response, cached: true, latencyMs: Date.now() - startTime };
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          system: systemPrompt,
          stream: false,
          options: {
            num_predict: this.maxTokens,
            temperature: this.temperature,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const result = await response.json();
      const aiResponse: OllamaResponse = {
        content: result.response,
        model: result.model,
        tokensUsed: result.eval_count || 0,
        latencyMs: Date.now() - startTime,
        cached: false,
      };

      // Cache response
      if (useCache) {
        const cacheKey = this.getCacheKey(prompt, systemPrompt);
        await this.redisService.set(
          cacheKey,
          JSON.stringify(aiResponse),
          'EX',
          cacheTtl,
        );
      }

      return aiResponse;
    } catch (error) {
      this.logger.error('Ollama generation failed', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private getCacheKey(prompt: string, systemPrompt: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${systemPrompt}:${prompt}`)
      .digest('hex')
      .slice(0, 16);
    return `ai:response:${this.model}:${hash}`;
  }
}
