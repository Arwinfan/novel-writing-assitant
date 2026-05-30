import Dexie, { type EntityTable } from 'dexie';
import type { OutlineNode } from '../types/outline';
import type { Plotline, PlotlineNode } from '../types/plotline';
import type { Character } from '../types/character';
import type { Relation } from '../types/relation';
import type { SettingCategory, SettingItem } from '../types/setting';
import type { Reference, ImpactAlert } from '../types/linkage';
import type { AIConfig, ProjectConfig } from '../types/ai';
import type { Chapter } from '../types/chapter';
import type { Faction } from '../types/faction';

/** 应用数据库类 */
class NovelDatabase extends Dexie {
  outlineNodes!: EntityTable<OutlineNode, 'id'>;
  plotlines!: EntityTable<Plotline, 'id'>;
  plotlineNodes!: EntityTable<PlotlineNode, 'id'>;
  characters!: EntityTable<Character, 'id'>;
  relations!: EntityTable<Relation, 'id'>;
  settingCategories!: EntityTable<SettingCategory, 'id'>;
  settingItems!: EntityTable<SettingItem, 'id'>;
  references!: EntityTable<Reference, 'id'>;
  impactAlerts!: EntityTable<ImpactAlert, 'id'>;
  aiConfigs!: EntityTable<AIConfig, 'id'>;
  projectConfigs!: EntityTable<ProjectConfig, 'id'>;
  chapters!: EntityTable<Chapter, 'id'>;
  factions!: EntityTable<Faction, 'id'>;

  constructor() {
    super('NovelWritingAssistant');

    this.version(1).stores({
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
    });

    // Version 2: 新增 chapters 表
    this.version(2).stores({
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
    });

    // Version 3: 新增 factions 表
    this.version(3).stores({
      outlineNodes: 'id, projectId, parentId, nodeType, sortOrder, createdAt',
      plotlines: 'id, projectId, lineType, name, createdAt',
      plotlineNodes: 'id, plotlineId, projectId, sortOrder, createdAt',
      characters: 'id, projectId, name, faction, factionId, createdAt',
      relations: 'id, projectId, sourceId, targetId, relationType, createdAt',
      settingCategories: 'id, projectId, name, sortOrder, createdAt',
      settingItems: 'id, categoryId, projectId, name, createdAt',
      references: 'id, sourceType, sourceId, targetType, targetId, fieldName, createdAt',
      impactAlerts: 'id, projectId, sourceType, sourceId, targetType, targetId, dismissed, createdAt',
      aiConfigs: 'id, projectId',
      projectConfigs: 'id, name',
      chapters: 'id, projectId, parentId, volumeId, outlineNodeId, sortOrder, status, createdAt',
      factions: 'id, projectId, name, factionType, parentId, leaderId, createdAt',
    });
  }
}

/** 数据库单例 */
export const db = new NovelDatabase();

export default db;
