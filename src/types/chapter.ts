/**
 * 章节正文数据类型
 * 与大纲模块联动：大纲中的"节"(SECTION)可以关联到正文章节
 */
export interface Chapter {
  id: string;
  projectId: string;
  /** 所属卷ID（可为空，表示未分卷） */
  volumeId: string;
  /** 所属章ID（可为空，表示顶层章节） */
  parentId: string;
  sortOrder: number;
  /** 章节标题 */
  title: string;
  /** 章节正文内容（Markdown格式） */
  content: string;
  /** 字数统计 */
  wordCount: number;
  /** 关联大纲节点ID */
  outlineNodeId: string;
  /** 引用角色ID列表 */
  characterRefs: string[];
  /** 引用设定项ID列表 */
  settingRefs: string[];
  /** 写作状态：草稿/进行中/完稿/修订 */
  status: ChapterStatus;
  createdAt: number;
  updatedAt: number;
}

/** 章节写作状态 */
export enum ChapterStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  REVISION = 'REVISION',
}

/** 章节状态标签 */
export const CHAPTER_STATUS_LABELS: Record<ChapterStatus, string> = {
  [ChapterStatus.DRAFT]: '草稿',
  [ChapterStatus.IN_PROGRESS]: '进行中',
  [ChapterStatus.COMPLETE]: '完稿',
  [ChapterStatus.REVISION]: '修订中',
};

/** 章节状态颜色 */
export const CHAPTER_STATUS_COLORS: Record<ChapterStatus, string> = {
  [ChapterStatus.DRAFT]: '#9e9e9e',
  [ChapterStatus.IN_PROGRESS]: '#1976d2',
  [ChapterStatus.COMPLETE]: '#2e7d32',
  [ChapterStatus.REVISION]: '#ed6c02',
};

/** 创建章节参数 */
export interface CreateChapterParams {
  volumeId?: string;
  parentId?: string;
  title: string;
  content?: string;
  sortOrder?: number;
  outlineNodeId?: string;
  status?: ChapterStatus;
}

/** 更新章节参数 */
export interface UpdateChapterParams {
  title?: string;
  content?: string;
  wordCount?: number;
  sortOrder?: number;
  outlineNodeId?: string;
  characterRefs?: string[];
  settingRefs?: string[];
  status?: ChapterStatus;
  volumeId?: string;
  parentId?: string;
}
