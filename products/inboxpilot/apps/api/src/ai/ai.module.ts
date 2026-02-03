import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { OllamaService } from './ollama.service';

@Module({
  controllers: [AIController],
  providers: [AIService, OllamaService],
  exports: [AIService],
})
export class AIModule {}
