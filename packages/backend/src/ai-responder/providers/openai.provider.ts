import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  LLMProvider,
  ChatMessage,
  ToolDefinition,
  LLMResponse,
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
    systemPrompt: string,
    tools?: ToolDefinition[]
  ): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client is not initialized (missing API key).');
    }

    try {
      // Map internal ToolDefinition to OpenAI ChatCompletionTool
      const openAiTools: OpenAI.Chat.Completions.ChatCompletionTool[] | undefined =
        tools?.map((tool) => ({
          type: 'function',
          function: {
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters,
          },
        }));

      // Construct messages with system prompt
      // We cast messages because our ChatMessage interface is compatible but not strictly identical
      // to OpenAI's discriminated union types.
      const openAiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        [
          { role: 'system', content: systemPrompt },
          ...(messages as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[]),
        ];

      const completion = await this.openai.chat.completions.create({
        messages: openAiMessages,
        model: this.model,
        tools: openAiTools,
      });

      const message = completion.choices[0]?.message;

      const toolCalls = message?.tool_calls
        ?.filter((tc) => tc.type === 'function')
        .map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        }));

      return {
        content: message?.content || null,
        toolCalls: toolCalls,
      };
    } catch (error) {
      this.logger.error('Failed to generate response from OpenAI', error);
      throw error;
    }
  }
}