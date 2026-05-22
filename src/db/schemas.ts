/**
 * 数据库 Schema 定义
 * 与 Dexie version().stores() 中的定义保持一致
 */
export const DB_SCHEMAS = {
  outlineNodes: 'id, projectId, parentId, nodeType, sortOrder, createdAt',
  plotlines: 'id, projectId, lineType, name, createdAt',
  plotlineNodes: 'id, plotlineId, projectId, sortOrder, createdAt',
  characters: 'id, projectId, name, faction, createdAt',
  relations: 'id, projectId, sourceId, targetId, relationType, createdAt',
  settingCategories: 'id, projectId, name, sortOrder, createdAt',
  settingItems: 'id, categoryId, projectId, name, createdAt',
  references: 'id, sourceType, sourceId, targetType, targetId, fieldName, createdAt',
  impactAlerts: 'id, projectId, sourceType, sourceId, targetType, targetId, dismissed, createdAt',
  aiConfigs: 'id, projectId',
  projectConfigs: 'id, name',
  chapters: 'id, projectId, parentId, volumeId, outlineNodeId, sortOrder, status, createdAt',
} as const;

/** 表名枚举 */
export enum TableName {
  OUTLINE_NODES = 'outlineNodes',
  PLOTLINES = 'plotlines',
  PLOTLINE_NODES = 'plotlineNodes',
  CHARACTERS = 'characters',
  RELATIONS = 'relations',
  SETTING_CATEGORIES = 'settingCategories',
  SETTING_ITEMS = 'settingItems',
  REFERENCES = 'references',
  IMPACT_ALERTS = 'impactAlerts',
  AI_CONFIGS = 'aiConfigs',
  PROJECT_CONFIGS = 'projectConfigs',
  CHAPTERS = 'chapters',
}
