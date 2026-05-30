/**
 * 家族/组织状态管理
 */
import { create } from 'zustand';
import type { Faction, CreateFactionParams, UpdateFactionParams } from '../types/faction';
import { factionService } from '../services/dbService';
import { useAppStore } from './appStore';

function currentProjectId(): string {
  return useAppStore.getState().project?.id ?? 'default-project';
}

interface FactionState {
  factions: Faction[];
  loading: boolean;
  selectedFactionId: string | null;

  loadFactions: () => Promise<void>;
  createFaction: (params: CreateFactionParams) => Promise<Faction>;
  updateFaction: (id: string, params: UpdateFactionParams) => Promise<void>;
  deleteFaction: (id: string) => Promise<void>;
  selectFaction: (id: string | null) => void;
}

export const useFactionStore = create<FactionState>((set) => ({
  factions: [],
  loading: false,
  selectedFactionId: null,

  loadFactions: async () => {
    set({ loading: true });
    try {
      const factions = await factionService.getAll(currentProjectId());
      set({ factions, loading: false });
    } catch (error) {
      console.error('Failed to load factions:', error);
      set({ loading: false });
    }
  },

  createFaction: async (params) => {
    const faction = await factionService.create(params, currentProjectId());
    set((state) => ({ factions: [...state.factions, faction] }));
    return faction;
  },

  updateFaction: async (id, params) => {
    await factionService.update(id, params);
    set((state) => ({
      factions: state.factions.map((f) => (f.id === id ? { ...f, ...params, updatedAt: Date.now() } : f)),
    }));
  },

  deleteFaction: async (id) => {
    await factionService.delete(id);
    set((state) => ({
      factions: state.factions.filter((f) => f.id !== id),
      selectedFactionId: state.selectedFactionId === id ? null : state.selectedFactionId,
    }));
  },

  selectFaction: (id) => {
    set({ selectedFactionId: id });
  },
}));
