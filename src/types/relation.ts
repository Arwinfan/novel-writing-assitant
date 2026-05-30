/** 角色关系 */
export interface Relation {
  id: string;
  projectId: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

/** 创建关系参数 */
export interface CreateRelationParams {
  sourceId: string;
  targetId: string;
  relationType: string;
  description?: string;
}

/** 更新关系参数 */
export interface UpdateRelationParams {
  sourceId?: string;
  targetId?: string;
  relationType?: string;
  description?: string;
}
