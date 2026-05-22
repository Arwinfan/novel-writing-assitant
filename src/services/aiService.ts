/**
 * AI API 通信服务
 * 封装 OpenAI 兼容接口，支持流式响应
 */
import type { AIConfig, AIGenerateParams, AIGenerateResult } from '../types/ai';
import { AI_REQUEST_TIMEOUT } from '../utils/constants';

/** AI 服务 */
export const aiService = {
  /**
   * 流式生成文本
   * @param params 生成参数
   * @param config AI 配置
   * @returns 生成结果
   */
  async generate(
    params: AIGenerateParams,
    config: AIConfig,
  ): Promise<AIGenerateResult> {
    const messages: Array<{ role: string; content: string }> = [];

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }
    messages.push({ role: 'user', content: params.prompt });

    const body = {
      model: config.model,
      messages,
      temperature: params.temperature ?? config.temperature,
      max_tokens: params.maxTokens ?? config.maxTokens,
      stream: !!params.onChunk,
    };

    // 如果外部提供了 signal，使用外部的；否则创建自己的超时控制器
    const controller = params.signal
      ? null
      : new AbortController();
    const timeoutId = !params.signal && controller
      ? setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT)
      : undefined;
    const signal = params.signal ?? controller?.signal;

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API Error (${response.status}): ${errorText}`);
      }

      if (params.onChunk && response.body) {
        return await handleStreamResponse(response.body, params.onChunk);
      } else {
        const data = await response.json();
        return {
          content: data.choices?.[0]?.message?.content ?? '',
          usage: data.usage
            ? {
                promptTokens: data.usage.prompt_tokens ?? 0,
                completionTokens: data.usage.completion_tokens ?? 0,
                totalTokens: data.usage.total_tokens ?? 0,
              }
            : undefined,
        };
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('AI 请求超时，请稍后重试');
      }
      throw error;
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  },

  /**
   * 测试 AI 连接
   */
  async testConnection(config: AIConfig): Promise<boolean> {
    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
          stream: false,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};

/**
 * 处理流式响应
 */
async function handleStreamResponse(
  body: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void,
): Promise<AIGenerateResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            fullContent += content;
            onChunk(content);
          }
        } catch {
          // 忽略非 JSON 行
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { content: fullContent };
}
