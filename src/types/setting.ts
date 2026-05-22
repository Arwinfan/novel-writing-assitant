/** 设定分类 */
export interface SettingCategory {
  id: string;
  projectId: string;
  name: string;
  icon: string;
  sortOrder: number;
  createdAt: number;
}

/** 设定项 */
export interface SettingItem {
  id: string;
  categoryId: string;
  projectId: string;
  name: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/** 创建设定分类参数 */
export interface CreateSettingCategoryParams {
  name: string;
  icon?: string;
  sortOrder?: number;
}

/** 更新设定分类参数 */
export interface UpdateSettingCategoryParams {
  name?: string;
  icon?: string;
  sortOrder?: number;
}

/** 创建设定项参数 */
export interface CreateSettingItemParams {
  categoryId: string;
  name: string;
  content?: string;
  tags?: string[];
}

/** 更新设定项参数 */
export interface UpdateSettingItemParams {
  categoryId?: string;
  name?: string;
  content?: string;
  tags?: string[];
}
