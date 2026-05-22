/**
 * 大纲状态管理
 */
import { create } from 'zustand';
import type { OutlineNode, CreateOutlineNodeParams, UpdateOutlineNodeParams } from '../types/outline';
import { OutlineNodeType } from '../types/outline';
import { outlineNodeService, referenceService } from '../services/dbService';
import { linkageEngine } from '../services/linkageEngine';
import { referenceTracker } from '../services/referenceTracker';
import { ReferenceEntityType } from '../types/linkage';
import { useAppStore } from './appStore';

function currentProjectId(): string {
  return useAppStore.getState().project?.id ?? 'default-project';
}

interface OutlineState {
  nodes: OutlineNode[];
  selectedNodeId: string | null;
  loading: boolean;

  loadNodes: () => Promise<void>;
  createNode: (params: CreateOutlineNodeParams) => Promise<OutlineNode>;
  updateNode: (id: string, params: UpdateOutlineNodeParams) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  selectNode: (id: string | null) => void;
  moveNode: (id: string, newParentId: string, newSortOrder: number) => Promise<void>;
}

export const useOutlineStore = create<OutlineState>((set, get) => ({
  nodes: [],
  selectedNodeId: null,
  loading: false,

  loadNodes: async () => {
    set({ loading: true });
    try {
      const nodes = await outlineNodeService.getAll(currentProjectId());
      set({ nodes, loading: false });
    } catch (error) {
      console.error('Failed to load outline nodes:', error);
      set({ loading: false });
    }
  },

  createNode: async (params) => {
    const node = await outlineNodeService.create(params, currentProjectId());
    await referenceTracker.scanAndIndexOutlineNode(node.id);
    set((state) => ({ nodes: [...state.nodes, node] }));
    return node;
  },

  updateNode: async (id, params) => {
    await outlineNodeService.update(id, params);
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...params, updatedAt: Date.now() } : n)),
    }));
    await referenceTracker.scanAndIndexOutlineNode(id);
  },

  deleteNode: async (id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (node) {
      await linkageEngine.onEntityDelete(ReferenceEntityType.OUTLINE_NODE, id, node.title);
      await outlineNodeService.deleteRecursive(id);
      await referenceService.deleteBySource(ReferenceEntityType.OUTLINE_NODE, id);
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== id),
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      }));
    }
  },

  selectNode: (id) => {
    set({ selectedNodeId: id });
  },

  moveNode: async (id, newParentId, newSortOrder) => {
    await outlineNodeService.update(id, { parentId: newParentId, sortOrder: newSortOrder });
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, parentId: newParentId, sortOrder: newSortOrder, updatedAt: Date.now() } : n,
      ),
    }));
  },
}));

/** 获取大纲树形结构 */
export function buildOutlineTree(nodes: OutlineNode[]): OutlineNode[] {
  const sorted = [...nodes].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.filter((n) => !n.parentId || n.parentId === '');
}
