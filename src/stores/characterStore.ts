/**
 * 人物状态管理
 */
import { create } from 'zustand';
import type { Character, CreateCharacterParams, UpdateCharacterParams } from '../types/character';
import { characterService } from '../services/dbService';
import { linkageEngine } from '../services/linkageEngine';
import { ReferenceEntityType } from '../types/linkage';
import { useAppStore } from './appStore';

/** 获取当前项目ID */
function currentProjectId(): string {
  return useAppStore.getState().project?.id ?? 'default-project';
}

interface CharacterState {
  characters: Character[];
  selectedCharacterId: string | null;
  loading: boolean;

  loadCharacters: () => Promise<void>;
  createCharacter: (params: CreateCharacterParams) => Promise<Character>;
  updateCharacter: (id: string, params: UpdateCharacterParams) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  renameCharacter: (id: string, newName: string) => Promise<void>;
  selectCharacter: (id: string | null) => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  selectedCharacterId: null,
  loading: false,

  loadCharacters: async () => {
    set({ loading: true });
    try {
      const characters = await characterService.getAll(currentProjectId());
      set({ characters, loading: false });
    } catch (error) {
      console.error('Failed to load characters:', error);
      set({ loading: false });
    }
  },

  createCharacter: async (params) => {
    const character = await characterService.create(params, currentProjectId());
    set((state) => ({ characters: [...state.characters, character] }));
    return character;
  },

  updateCharacter: async (id, params) => {
    const oldChar = get().characters.find((c) => c.id === id);
    await characterService.update(id, params);

    if (params.name && oldChar && params.name !== oldChar.name) {
      await linkageEngine.onNameChange(
        ReferenceEntityType.CHARACTER,
        id,
        oldChar.name,
        params.name,
      );
    }

    set((state) => ({
      characters: state.characters.map((c) => (c.id === id ? { ...c, ...params, updatedAt: Date.now() } : c)),
    }));
  },

  deleteCharacter: async (id) => {
    const character = get().characters.find((c) => c.id === id);
    if (character) {
      await linkageEngine.onEntityDelete(ReferenceEntityType.CHARACTER, id, character.name);
      await characterService.delete(id);
      set((state) => ({
        characters: state.characters.filter((c) => c.id !== id),
        selectedCharacterId: state.selectedCharacterId === id ? null : state.selectedCharacterId,
      }));
    }
  },

  renameCharacter: async (id, newName) => {
    const oldChar = get().characters.find((c) => c.id === id);
    if (!oldChar || oldChar.name === newName) return;

    await linkageEngine.onNameChange(
      ReferenceEntityType.CHARACTER,
      id,
      oldChar.name,
      newName,
    );
    await characterService.update(id, { name: newName });
    set((state) => ({
      characters: state.characters.map((c) => (c.id === id ? { ...c, name: newName, updatedAt: Date.now() } : c)),
    }));
  },

  selectCharacter: (id) => {
    set({ selectedCharacterId: id });
  },
}));
