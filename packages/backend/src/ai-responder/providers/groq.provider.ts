import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  LLMProvider,
  ChatMessage,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class GroqProvider implements LLMProvider, OnModuleInit {
  private readonly logger = new Logger(GroqProvider.name);
  private openai: OpenAI | null = null;
  private model: string;
  public readonly name = 'groq';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      this.logger.log('GroqProvider initialized.');
    } else {
      this.logger.warn('GROQ_API_KEY is not set. GroqProvider will fail if used.');
    }

    const model = this.configService.get<string>('GROQ_MODEL');
    if (model) {
      this.model = model;
    } else {
      this.logger.warn(
        'GROQ_MODEL is not set. Defaulting to openai/gpt-oss-120b.'
      );
      this.model = 'openai/gpt-oss-120b';
    }
  }

  async generateResponse(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('Groq client is not initialized (missing API key).');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        model: this.model,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('Failed to generate response from Groq', error);
      throw error;
    }
  }
}
