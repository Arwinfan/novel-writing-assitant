/**
 * 人物关系状态管理
 */
import { create } from 'zustand';
import type { Relation, CreateRelationParams, UpdateRelationParams } from '../types/relation';
import { relationService } from '../services/dbService';
import { useAppStore } from './appStore';

function currentProjectId(): string {
  return useAppStore.getState().project?.id ?? 'default-project';
}

interface RelationState {
  relations: Relation[];
  loading: boolean;

  loadRelations: () => Promise<void>;
  createRelation: (params: CreateRelationParams) => Promise<Relation>;
  updateRelation: (id: string, params: UpdateRelationParams) => Promise<void>;
  deleteRelation: (id: string) => Promise<void>;
}

export const useRelationStore = create<RelationState>((set) => ({
  relations: [],
  loading: false,

  loadRelations: async () => {
    set({ loading: true });
    try {
      const relations = await relationService.getAll(currentProjectId());
      set({ relations, loading: false });
    } catch (error) {
      console.error('Failed to load relations:', error);
      set({ loading: false });
    }
  },

  createRelation: async (params) => {
    const relation = await relationService.create(params, currentProjectId());
    set((state) => ({ relations: [...state.relations, relation] }));
    return relation;
  },

  updateRelation: async (id, params) => {
    await relationService.update(id, params);
    set((state) => ({
      relations: state.relations.map((r) => (r.id === id ? { ...r, ...params, updatedAt: Date.now() } : r)),
    }));
  },

  deleteRelation: async (id) => {
    await relationService.delete(id);
    set((state) => ({
      relations: state.relations.filter((r) => r.id !== id),
    }));
  },
}));
