/** AI 配置 */
export interface AIConfig {
  id: string;
  projectId: string;
  apiEndpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  imageGenEndpoint?: string;  // 图片生成 API 地址
  imageGenApiKey?: string;     // 图片生成 API Key
}

/** AI 聊天消息 */
export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/** AI 生成请求参数 */
export interface AIGenerateParams {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

/** AI 生成结果 */
export interface AIGenerateResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** 上下文组装参数 */
export interface ContextAssemblyParams {
  currentEntityType?: string;
  currentEntityId?: string;
  additionalInstructions?: string;
}

/** 项目配置 */
export interface ProjectConfig {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}
