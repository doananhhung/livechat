export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMProvider {
  /**
   * Unique name of the provider (e.g., 'groq', 'openai').
   */
  readonly name: string;

  /**
   * Generates a text response from the LLM.
   *
   * @param messages - The conversation history.
   * @param systemPrompt - The system instruction for the AI.
   * @returns The generated response content.
   * @throws Error if generation fails (should be caught by circuit breaker).
   */
  generateResponse(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<string>;
}
