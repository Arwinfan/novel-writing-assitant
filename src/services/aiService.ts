/**
 * AI API 通信服务
 * 封装 OpenAI 兼容接口，支持流式响应和结构化错误处理
 */
import type { AIConfig, AIGenerateParams, AIGenerateResult } from '../types/ai';
import { AI_REQUEST_TIMEOUT } from '../utils/constants';

/** AI 服务错误类型 */
export enum AIErrorType {
  AUTH = 'auth',           // 401: API Key 无效
  RATE_LIMIT = 'rate_limit', // 429: 速率限制
  SERVER = 'server',        // 5xx: 服务器错误
  NETWORK = 'network',      // 网络故障
  TIMEOUT = 'timeout',      // 超时
  UNKNOWN = 'unknown',      // 未知错误
}

/** AI 服务错误 */
export class AIError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public statusCode?: number,
    public retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/** 根据 HTTP 状态码返回用户友好的错误信息 */
function getErrorByStatus(status: number, body: string): AIError {
  switch (status) {
    case 401:
      return new AIError(AIErrorType.AUTH, 'API Key 无效或已过期，请在设置中重新配置', status);
    case 403:
      return new AIError(AIErrorType.AUTH, 'API 访问被拒绝，请检查账户余额和权限', status);
    case 429:
      return new AIError(AIErrorType.RATE_LIMIT, '请求过于频繁，请稍后重试', status, 30000);
    case 500:
    case 502:
    case 503:
    case 504:
      return new AIError(AIErrorType.SERVER, 'AI 服务暂时不可用，请稍后重试', status);
    default:
      if (status >= 500) {
        return new AIError(AIErrorType.SERVER, `AI 服务器错误 (${status})`, status);
      }
      if (status >= 400) {
        return new AIError(AIErrorType.UNKNOWN, `请求失败 (${status}): ${body.slice(0, 100)}`, status);
      }
      return new AIError(AIErrorType.UNKNOWN, body || `请求失败 (${status})`, status);
  }
}

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
    // 前置校验
    if (!config.apiKey) {
      throw new AIError(AIErrorType.AUTH, '请先在设置中配置 API Key');
    }

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

    // 超时控制
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
        let errorText = '';
        try {
          errorText = await response.text();
          // 尝试解析 JSON 错误
          const json = JSON.parse(errorText);
          const msg = json.error?.message || json.error?.code || errorText;
          throw getErrorByStatus(response.status, msg);
        } catch (e) {
          if (e instanceof AIError) throw e;
          throw getErrorByStatus(response.status, errorText);
        }
      }

      if (params.onChunk && response.body) {
        return await handleStreamResponse(response.body, params.onChunk, signal);
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
      // 已经是 AIError 的直接抛出
      if (error instanceof AIError) throw error;

      // AbortError → 超时
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AIError(AIErrorType.TIMEOUT, 'AI 请求超时（60秒），请检查网络后重试');
      }

      // TypeError (network error) → 网络故障
      if (error instanceof TypeError) {
        throw new AIError(AIErrorType.NETWORK, '网络连接失败，请检查网络和代理设置');
      }

      // 其他未知错误
      throw new AIError(
        AIErrorType.UNKNOWN,
        error instanceof Error ? error.message : '未知错误',
      );
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  },

  /**
   * 测试 AI 连接
   * @returns 成功返回 true，失败返回具体错误类型
   */
  async testConnection(config: AIConfig): Promise<{ ok: boolean; error?: AIError }> {
    if (!config.apiKey) {
      return { ok: false, error: new AIError(AIErrorType.AUTH, '请先配置 API Key') };
    }

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
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return { ok: false, error: getErrorByStatus(response.status, text) };
      }

      return { ok: true };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        return { ok: false, error: new AIError(AIErrorType.TIMEOUT, '连接超时，请检查网络') };
      }
      if (error instanceof TypeError) {
        return { ok: false, error: new AIError(AIErrorType.NETWORK, '网络连接失败') };
      }
      const aiErr = error instanceof AIError ? error : new AIError(AIErrorType.UNKNOWN, String(error));
      return { ok: false, error: aiErr };
    }
  },
};

/**
 * 处理流式响应
 */
async function handleStreamResponse(
  body: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<AIGenerateResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  const checkAborted = () => {
    if (signal?.aborted) {
      reader.cancel();
      throw new AIError(AIErrorType.TIMEOUT, '请求已取消');
    }
  };

  try {
    while (true) {
      checkAborted();
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
