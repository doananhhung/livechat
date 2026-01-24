import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  LLMProvider,
  ChatMessage,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OpenAIProvider implements LLMProvider, OnModuleInit {
  private readonly logger = new Logger(OpenAIProvider.name);
  private openai: OpenAI | null = null;
  private model: string;
  public readonly name = 'openai';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
        // No baseURL needed for standard OpenAI
      });
      this.logger.log('OpenAIProvider initialized.');
    } else {
      this.logger.warn(
        'OPENAI_API_KEY is not set. OpenAIProvider will fail if used.'
      );
    }

    const model = this.configService.get<string>('OPENAI_MODEL');
    if (model) {
      this.model = model;
    } else {
      this.logger.warn('OPENAI_MODEL is not set. Defaulting to gpt-4o.');
      this.model = 'gpt-4o';
    }
  }

  async generateResponse(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client is not initialized (missing API key).');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        model: this.model,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('Failed to generate response from OpenAI', error);
      throw error;
    }
  }
}
