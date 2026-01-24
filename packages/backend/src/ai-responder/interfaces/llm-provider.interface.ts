export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  };
}

export interface LLMResponse {
  content: string | null;
  toolCalls?: ToolCall[];
}

export interface LLMProvider {
  /**
   * Unique name of the provider (e.g., 'groq', 'openai').
   */
  readonly name: string;

  /**
   * Generates a response from the LLM, optionally calling tools.
   *
   * @param messages - The conversation history.
   * @param systemPrompt - The system instruction for the AI.
   * @param tools - Optional list of tools the AI can call.
   * @returns The generated response content and optional tool calls.
   * @throws Error if generation fails (should be caught by circuit breaker).
   */
  generateResponse(
    messages: ChatMessage[],
    systemPrompt: string,
    tools?: ToolDefinition[]
  ): Promise<LLMResponse>;
}