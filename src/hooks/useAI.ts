/**
 * AI 生成 Hook
 * 封装 AI 服务，供组件使用
 */
import { useCallback } from 'react';
import { useAIStore } from '../stores/aiStore';
import type { ContextAssemblyParams } from '../types/ai';

/** AI 生成 Hook */
export function useAI() {
  const store = useAIStore();

  const sendMessage = useCallback(
    async (content: string, contextParams?: ContextAssemblyParams) => {
      await store.sendMessage(content, contextParams);
    },
    [store],
  );

  const clearMessages = useCallback(() => {
    store.clearMessages();
  }, [store]);

  const toggleChat = useCallback(() => {
    store.setChatPanelOpen(!store.chatPanelOpen);
  }, [store]);

  const openConfig = useCallback(() => {
    store.setConfigDialogOpen(true);
  }, [store]);

  return {
    config: store.config,
    messages: store.messages,
    isGenerating: store.isGenerating,
    chatPanelOpen: store.chatPanelOpen,
    configDialogOpen: store.configDialogOpen,
    sendMessage,
    clearMessages,
    toggleChat,
    openConfig,
    setChatPanelOpen: store.setChatPanelOpen,
    setConfigDialogOpen: store.setConfigDialogOpen,
    saveConfig: store.saveConfig,
    loadConfig: store.loadConfig,
  };
}
