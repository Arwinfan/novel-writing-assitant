/**
 * 设定状态管理
 */
import { create } from 'zustand';
import type { SettingCategory, SettingItem, CreateSettingCategoryParams, UpdateSettingCategoryParams, CreateSettingItemParams, UpdateSettingItemParams } from '../types/setting';
import { settingCategoryService, settingItemService } from '../services/dbService';
import { linkageEngine } from '../services/linkageEngine';
import { ReferenceEntityType, ImpactAction } from '../types/linkage';
import { useAppStore } from './appStore';

function currentProjectId(): string {
  return useAppStore.getState().project?.id ?? 'default-project';
}

interface SettingState {
  categories: SettingCategory[];
  items: SettingItem[];
  selectedCategoryId: string | null;
  selectedItemId: string | null;
  loading: boolean;

  loadCategories: () => Promise<void>;
  createCategory: (params: CreateSettingCategoryParams) => Promise<SettingCategory>;
  updateCategory: (id: string, params: UpdateSettingCategoryParams) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  selectCategory: (id: string | null) => void;

  loadItems: (categoryId: string) => Promise<void>;
  loadAllItems: () => Promise<void>;
  createItem: (params: CreateSettingItemParams) => Promise<SettingItem>;
  updateItem: (id: string, params: UpdateSettingItemParams) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  selectItem: (id: string | null) => void;
}

export const useSettingStore = create<SettingState>((set, get) => ({
  categories: [],
  items: [],
  selectedCategoryId: null,
  selectedItemId: null,
  loading: false,

  loadCategories: async () => {
    set({ loading: true });
    try {
      const categories = await settingCategoryService.getAll(currentProjectId());
      set({ categories, loading: false });
    } catch (error) {
      console.error('Failed to load setting categories:', error);
      set({ loading: false });
    }
  },

  createCategory: async (params) => {
    const category = await settingCategoryService.create(params, currentProjectId());
    set((state) => ({ categories: [...state.categories, category] }));
    return category;
  },

  updateCategory: async (id, params) => {
    await settingCategoryService.update(id, params);
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? { ...c, ...params } : c)),
    }));
  },

  deleteCategory: async (id) => {
    await settingCategoryService.delete(id);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
      items: state.items.filter((i) => i.categoryId !== id),
      selectedCategoryId: state.selectedCategoryId === id ? null : state.selectedCategoryId,
    }));
  },

  selectCategory: (id) => {
    set({ selectedCategoryId: id });
  },

  loadItems: async (categoryId) => {
    const items = await settingItemService.getByCategoryId(categoryId);
    set((state) => ({
      items: [...state.items.filter((i) => i.categoryId !== categoryId), ...items],
    }));
  },

  loadAllItems: async () => {
    const items = await settingItemService.getAll(currentProjectId());
    set({ items });
  },

  createItem: async (params) => {
    const item = await settingItemService.create(params, currentProjectId());
    set((state) => ({ items: [...state.items, item] }));
    return item;
  },

  updateItem: async (id, params) => {
    const oldItem = get().items.find((i) => i.id === id);
    await settingItemService.update(id, params);

    if (params.name && oldItem && params.name !== oldItem.name) {
      await linkageEngine.onNameChange(
        ReferenceEntityType.SETTING_ITEM,
        id,
        oldItem.name,
        params.name,
      );
    }

    if (params.content && oldItem && params.content !== oldItem.content) {
      await linkageEngine.onEntityChange(
        ReferenceEntityType.SETTING_ITEM,
        id,
        ImpactAction.MODIFY,
        oldItem.name,
      );
    }

    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, ...params, updatedAt: Date.now() } : i)),
    }));
  },

  deleteItem: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (item) {
      await linkageEngine.onEntityDelete(ReferenceEntityType.SETTING_ITEM, id, item.name);
      await settingItemService.delete(id);
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
        selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
      }));
    }
  },

  selectItem: (id) => {
    set({ selectedItemId: id });
  },
}));
