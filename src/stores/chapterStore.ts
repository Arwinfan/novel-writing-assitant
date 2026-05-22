/**
 * 章节正文状态管理
 */
import { create } from 'zustand';
import type { Chapter, CreateChapterParams, UpdateChapterParams } from '../types/chapter';
import { ChapterStatus } from '../types/chapter';
import { chapterService, referenceService } from '../services/dbService';
import { linkageEngine } from '../services/linkageEngine';
import { referenceTracker } from '../services/referenceTracker';
import { ReferenceEntityType } from '../types/linkage';
import { useAppStore } from './appStore';

function currentProjectId(): string {
  return useAppStore.getState().project?.id ?? 'default-project';
}

interface ChapterState {
  chapters: Chapter[];
  selectedChapterId: string | null;
  loading: boolean;

  loadChapters: () => Promise<void>;
  createChapter: (params: CreateChapterParams) => Promise<Chapter>;
  updateChapter: (id: string, params: UpdateChapterParams) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  selectChapter: (id: string | null) => void;
  moveChapter: (id: string, newParentId: string, newSortOrder: number) => Promise<void>;
  getChapterById: (id: string) => Chapter | undefined;
}

export const useChapterStore = create<ChapterState>((set, get) => ({
  chapters: [],
  selectedChapterId: null,
  loading: false,

  loadChapters: async () => {
    set({ loading: true });
    try {
      const chapters = await chapterService.getAll(currentProjectId());
      set({ chapters, loading: false });
    } catch (error) {
      console.error('Failed to load chapters:', error);
      set({ loading: false });
    }
  },

  createChapter: async (params) => {
    const chapter = await chapterService.create(params, currentProjectId());
    if (chapter.outlineNodeId) {
      await referenceTracker.scanAndIndexOutlineNode(chapter.outlineNodeId);
    }
    set((state) => ({ chapters: [...state.chapters, chapter] }));
    return chapter;
  },

  updateChapter: async (id, params) => {
    await chapterService.update(id, params);
    set((state) => ({
      chapters: state.chapters.map((c) => (c.id === id ? { ...c, ...params, updatedAt: Date.now() } : c)),
    }));
  },

  deleteChapter: async (id) => {
    const chapter = get().chapters.find((c) => c.id === id);
    if (chapter) {
      await linkageEngine.onEntityDelete(ReferenceEntityType.OUTLINE_NODE, id, chapter.title);
      await chapterService.deleteRecursive(id);
      await referenceService.deleteBySource(ReferenceEntityType.OUTLINE_NODE, id);
      set((state) => ({
        chapters: state.chapters.filter((c) => c.id !== id),
        selectedChapterId: state.selectedChapterId === id ? null : state.selectedChapterId,
      }));
    }
  },

  selectChapter: (id) => {
    set({ selectedChapterId: id });
  },

  moveChapter: async (id, newParentId, newSortOrder) => {
    await chapterService.update(id, { parentId: newParentId, sortOrder: newSortOrder });
    set((state) => ({
      chapters: state.chapters.map((c) =>
        c.id === id ? { ...c, parentId: newParentId, sortOrder: newSortOrder, updatedAt: Date.now() } : c,
      ),
    }));
  },

  getChapterById: (id) => {
    return get().chapters.find((c) => c.id === id);
  },
}));

/** 计算字数（中文按字计，英文按词计） */
export function countWords(text: string): number {
  if (!text) return 0;
  // 中文字符
  const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  const cjkCount = cjk ? cjk.length : 0;
  // 英文单词
  const eng = text.match(/[a-zA-Z]+/g);
  const engCount = eng ? eng.length : 0;
  return cjkCount + engCount;
}
