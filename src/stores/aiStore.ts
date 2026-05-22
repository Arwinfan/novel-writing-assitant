/**
 * AI 配置与状态管理
 */
import { create } from 'zustand';
import type { AIConfig, AIChatMessage, AIGenerateParams, AIGenerateResult, ContextAssemblyParams } from '../types/ai';
import { aiConfigService } from '../services/dbService';
import { aiService } from '../services/aiService';
import { contextAssembler } from '../services/contextAssembler';
import { AI_DEFAULT_CONFIG } from '../utils/constants';
import { generateId } from '../utils/id';
import { useAppStore } from './appStore';

function currentProjectId(): string {
  return useAppStore.getState().project?.id ?? 'default-project';
}

interface AIState {
  config: AIConfig;
  messages: AIChatMessage[];
  isGenerating: boolean;
  chatPanelOpen: boolean;
  configDialogOpen: boolean;

  loadConfig: () => Promise<void>;
  saveConfig: (config: Partial<AIConfig>) => Promise<void>;
  setChatPanelOpen: (open: boolean) => void;
  setConfigDialogOpen: (open: boolean) => void;

  sendMessage: (content: string, contextParams?: ContextAssemblyParams) => Promise<void>;
  clearMessages: () => void;
  stopGenerating: () => void;
}

let abortController: AbortController | null = null;

export const useAIStore = create<AIState>((set, get) => ({
  config: {
    id: '',
    projectId: 'default-project',
    ...AI_DEFAULT_CONFIG,
  },
  messages: [],
  isGenerating: false,
  chatPanelOpen: false,
  configDialogOpen: false,

  loadConfig: async () => {
    const pid = currentProjectId();
    const saved = await aiConfigService.get(pid);
    if (saved) {
      set({ config: saved });
    } else {
      set({
        config: {
          id: '',
          projectId: pid,
          ...AI_DEFAULT_CONFIG,
        },
      });
    }
  },

  saveConfig: async (partial) => {
    const pid = currentProjectId();
    const current = get().config;
    const updated = { ...current, ...partial };
    await aiConfigService.save({
      projectId: pid,
      apiEndpoint: updated.apiEndpoint,
      apiKey: updated.apiKey,
      model: updated.model,
      temperature: updated.temperature,
      maxTokens: updated.maxTokens,
    });
    set({ config: updated });
  },

  setChatPanelOpen: (open) => {
    set({ chatPanelOpen: open });
  },

  setConfigDialogOpen: (open) => {
    set({ configDialogOpen: open });
  },

  sendMessage: async (content, contextParams) => {
    const { config } = get();
    if (!config.apiKey) {
      const systemMsg: AIChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '请先配置 AI API Key。点击设置按钮进行配置。',
        timestamp: Date.now(),
      };
      set((state) => ({ messages: [...state.messages, systemMsg] }));
      return;
    }

    const userMsg: AIChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, userMsg], isGenerating: true }));

    try {
      let systemPrompt = '你是一位专业的小说创作助手。';
      let contextText = '';

      if (contextParams) {
        const assembled = await contextAssembler.assembleContext(contextParams);
        systemPrompt = assembled.systemPrompt;
        contextText = assembled.contextText;
      }

      const fullPrompt = contextText ? `${contextText}\n\n---\n\n${content}` : content;
      const assistantMsgId = generateId();
      let accumulatedContent = '';

      const params: AIGenerateParams = {
        prompt: fullPrompt,
        systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        onChunk: (chunk) => {
          accumulatedContent += chunk;
          set((state) => {
            const msgs = [...state.messages];
            const existIdx = msgs.findIndex((m) => m.id === assistantMsgId);
            if (existIdx >= 0) {
              msgs[existIdx] = { ...msgs[existIdx], content: accumulatedContent };
            } else {
              msgs.push({
                id: assistantMsgId,
                role: 'assistant',
                content: accumulatedContent,
                timestamp: Date.now(),
              });
            }
            return { messages: msgs };
          });
        },
      };

      await aiService.generate(params, config);
    } catch (error) {
      const errorMsg: AIChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `生成失败：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
      };
      set((state) => ({ messages: [...state.messages, errorMsg] }));
    } finally {
      set({ isGenerating: false });
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  stopGenerating: () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    set({ isGenerating: false });
  },
}));
