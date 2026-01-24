import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LLMProvider,
  ChatMessage,
  ToolDefinition,
  LLMResponse,
} from '../interfaces/llm-provider.interface';
import { GroqProvider } from '../providers/groq.provider';
import { OpenAIProvider } from '../providers/openai.provider';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LLMProviderManager {
  private readonly logger = new Logger(LLMProviderManager.name);
  private readonly providers: Map<string, LLMProvider> = new Map();
  private readonly breakers: Map<string, CircuitBreaker> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly groqProvider: GroqProvider,
    private readonly openaiProvider: OpenAIProvider,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.registerProvider(groqProvider);
    this.registerProvider(openaiProvider);
  }

  private registerProvider(provider: LLMProvider) {
    this.providers.set(provider.name, provider);
    this.breakers.set(
      provider.name,
      new CircuitBreaker(provider.name, 5, 30000, (name, from, to) => {
        this.eventEmitter.emit('ai.circuit.state_change', {
          provider: name,
          from,
          to,
        });
      })
    );
    this.logger.log(`Registered LLM Provider: ${provider.name}`);
  }

  /**
   * Generates a response using the first available provider based on preference.
   */
  async generateResponse(
    messages: ChatMessage[],
    systemPrompt: string,
    tools?: ToolDefinition[]
  ): Promise<LLMResponse> {
    const preference = this.configService.get<string>(
      'LLM_PROVIDER_PREFERENCE',
      'groq,openai'
    );
    const providerNames = preference.split(',').map((p) => p.trim());

    // Ensure we only try registered providers
    const validProviders = providerNames.filter((name) =>
      this.providers.has(name)
    );

    if (validProviders.length === 0) {
      throw new Error(
        'No valid LLM providers configured in LLM_PROVIDER_PREFERENCE.'
      );
    }

    let lastError: any = null;

    for (let i = 0; i < validProviders.length; i++) {
      const providerName = validProviders[i];
      const provider = this.providers.get(providerName);
      const breaker = this.breakers.get(providerName);

      if (!provider || !breaker) continue;

      try {
        this.logger.debug(
          `Attempting generation with provider: ${providerName}`
        );
        return await breaker.execute(() =>
          provider.generateResponse(messages, systemPrompt, tools)
        );
      } catch (error) {
        lastError = error;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const nextProvider = validProviders[i + 1] || null;

        this.logger.warn(
          `Provider [${providerName}] failed: ${errorMessage}. Failing over to ${nextProvider || 'NONE'}...`
        );

        this.eventEmitter.emit('ai.provider.failover', {
          failedProvider: providerName,
          error: errorMessage,
          nextProvider,
        });

        // Continue to next provider
      }
    }

    this.logger.error('All providers failed to generate response.');
    throw lastError || new Error('All providers failed.');
  }
}