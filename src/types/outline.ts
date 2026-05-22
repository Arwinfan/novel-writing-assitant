/** 大纲节点类型枚举 */
export enum OutlineNodeType {
  VOLUME = 'VOLUME',
  CHAPTER = 'CHAPTER',
  SECTION = 'SECTION',
}

/** 大纲节点 */
export interface OutlineNode {
  id: string;
  projectId: string;
  parentId: string;
  sortOrder: number;
  title: string;
  content: string;
  nodeType: OutlineNodeType;
  characterRefs: string[];
  settingRefs: string[];
  plotlineRefs: string[];
  createdAt: number;
  updatedAt: number;
}

/** 创建大纲节点的参数 */
export interface CreateOutlineNodeParams {
  parentId: string;
  nodeType: OutlineNodeType;
  title: string;
  content?: string;
  sortOrder?: number;
}

/** 更新大纲节点的参数 */
export interface UpdateOutlineNodeParams {
  title?: string;
  content?: string;
  nodeType?: OutlineNodeType;
  characterRefs?: string[];
  settingRefs?: string[];
  plotlineRefs?: string[];
  sortOrder?: number;
  parentId?: string;
}
