/**
 * 数据库 CRUD 统一封装
 * 所有数据库操作通过此服务统一入口
 */
import { db } from '../db';
import { OutlineNodeType } from '../types/outline';
import { PlotlineType } from '../types/plotline';
import { ReferenceEntityType, ImpactAction, ImpactLevel } from '../types/linkage';
import { ChapterStatus } from '../types/chapter';
import { DEFAULT_PROJECT_ID } from '../utils/constants';
import { generateId } from '../utils/id';

// ===== OutlineNode =====

export const outlineNodeService = {
  async getAll(projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/outline').OutlineNode[]> {
    return db.outlineNodes.where('projectId').equals(projectId).sortBy('sortOrder');
  },

  async getById(id: string): Promise<import('../types/outline').OutlineNode | undefined> {
    return db.outlineNodes.get(id);
  },

  async getChildren(parentId: string): Promise<import('../types/outline').OutlineNode[]> {
    return db.outlineNodes.where('parentId').equals(parentId).sortBy('sortOrder');
  },

  async create(params: import('../types/outline').CreateOutlineNodeParams, projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/outline').OutlineNode> {
    const now = Date.now();
    const siblings = await db.outlineNodes.where('parentId').equals(params.parentId).sortBy('sortOrder');
    const node: import('../types/outline').OutlineNode = {
      id: generateId(),
      projectId,
      parentId: params.parentId,
      sortOrder: params.sortOrder ?? siblings.length,
      title: params.title,
      content: params.content ?? '',
      nodeType: params.nodeType,
      characterRefs: [],
      settingRefs: [],
      plotlineRefs: [],
      createdAt: now,
      updatedAt: now,
    };
    await db.outlineNodes.add(node);
    return node;
  },

  async update(id: string, params: import('../types/outline').UpdateOutlineNodeParams): Promise<void> {
    await db.outlineNodes.update(id, { ...params, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.outlineNodes.delete(id);
  },

  async deleteRecursive(id: string): Promise<void> {
    const children = await db.outlineNodes.where('parentId').equals(id).toArray();
    for (const child of children) {
      await outlineNodeService.deleteRecursive(child.id);
    }
    await db.outlineNodes.delete(id);
  },
};

// ===== Plotline =====

export const plotlineService = {
  async getAll(projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/plotline').Plotline[]> {
    return db.plotlines.where('projectId').equals(projectId).sortBy('createdAt');
  },

  async getById(id: string): Promise<import('../types/plotline').Plotline | undefined> {
    return db.plotlines.get(id);
  },

  async create(params: import('../types/plotline').CreatePlotlineParams, projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/plotline').Plotline> {
    const now = Date.now();
    const plotline: import('../types/plotline').Plotline = {
      id: generateId(),
      projectId,
      lineType: params.lineType,
      name: params.name,
      description: params.description ?? '',
      color: params.color ?? '#1976d2',
      createdAt: now,
      updatedAt: now,
    };
    await db.plotlines.add(plotline);
    return plotline;
  },

  async update(id: string, params: import('../types/plotline').UpdatePlotlineParams): Promise<void> {
    await db.plotlines.update(id, { ...params, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    // 事务包装：先删节点再删剧情线，保证原子性
    const nodeIds = await db.plotlineNodes.where('plotlineId').equals(id).primaryKeys();
    await db.transaction('rw', db.plotlineNodes, db.plotlines, async () => {
      await db.plotlineNodes.bulkDelete(nodeIds);
      await db.plotlines.delete(id);
    });
  },
};

// ===== PlotlineNode =====

export const plotlineNodeService = {
  async getByPlotlineId(plotlineId: string): Promise<import('../types/plotline').PlotlineNode[]> {
    return db.plotlineNodes.where('plotlineId').equals(plotlineId).sortBy('sortOrder');
  },

  async getAll(projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/plotline').PlotlineNode[]> {
    return db.plotlineNodes.where('projectId').equals(projectId).sortBy('sortOrder');
  },

  async getById(id: string): Promise<import('../types/plotline').PlotlineNode | undefined> {
    return db.plotlineNodes.get(id);
  },

  async create(params: import('../types/plotline').CreatePlotlineNodeParams, projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/plotline').PlotlineNode> {
    const now = Date.now();
    const siblings = await db.plotlineNodes.where('plotlineId').equals(params.plotlineId).sortBy('sortOrder');
    const node: import('../types/plotline').PlotlineNode = {
      id: generateId(),
      plotlineId: params.plotlineId,
      projectId,
      sortOrder: params.sortOrder ?? siblings.length,
      title: params.title,
      content: params.content ?? '',
      outlineNodeRefs: params.outlineNodeRefs ?? [],
      characterRefs: params.characterRefs ?? [],
      settingRefs: params.settingRefs ?? [],
      createdAt: now,
      updatedAt: now,
    };
    await db.plotlineNodes.add(node);
    return node;
  },

  async update(id: string, params: import('../types/plotline').UpdatePlotlineNodeParams): Promise<void> {
    await db.plotlineNodes.update(id, { ...params, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.plotlineNodes.delete(id);
  },
};

// ===== Character =====

export const characterService = {
  async getAll(projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/character').Character[]> {
    return db.characters.where('projectId').equals(projectId).sortBy('createdAt');
  },

  async getById(id: string): Promise<import('../types/character').Character | undefined> {
    return db.characters.get(id);
  },

  async create(params: import('../types/character').CreateCharacterParams, projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/character').Character> {
    const now = Date.now();
    const character: import('../types/character').Character = {
      id: generateId(),
      projectId,
      name: params.name,
      alias: params.alias ?? '',
      appearance: params.appearance ?? '',
      personality: params.personality ?? '',
      background: params.background ?? '',
      faction: params.faction ?? '',
      factionId: params.factionId ?? '',
      tags: params.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    await db.characters.add(character);
    return character;
  },

  async update(id: string, params: import('../types/character').UpdateCharacterParams): Promise<void> {
    await db.characters.update(id, { ...params, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.characters.delete(id);
  },

  async getNames(projectId: string = DEFAULT_PROJECT_ID): Promise<Array<{ id: string; name: string; alias: string }>> {
    const chars = await db.characters.where('projectId').equals(projectId).toArray();
    return chars.map((c) => ({ id: c.id, name: c.name, alias: c.alias }));
  },
};

// ===== Relation =====

export const relationService = {
  async getAll(projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/relation').Relation[]> {
    return db.relations.where('projectId').equals(projectId).sortBy('createdAt');
  },

  async getById(id: string): Promise<import('../types/relation').Relation | undefined> {
    return db.relations.get(id);
  },

  async create(params: import('../types/relation').CreateRelationParams, projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/relation').Relation> {
    const now = Date.now();
    const relation: import('../types/relation').Relation = {
      id: generateId(),
      projectId,
      sourceId: params.sourceId,
      targetId: params.targetId,
      relationType: params.relationType,
      description: params.description ?? '',
      createdAt: now,
      updatedAt: now,
    };
    await db.relations.add(relation);
    return relation;
  },

  async update(id: string, params: import('../types/relation').UpdateRelationParams): Promise<void> {
    await db.relations.update(id, { ...params, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.relations.delete(id);
  },

  async getByCharacterId(characterId: string, projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/relation').Relation[]> {
    const all = await db.relations.where('projectId').equals(projectId).toArray();
    return all.filter((r) => r.sourceId === characterId || r.targetId === characterId);
  },
};

// ===== SettingCategory =====

export const settingCategoryService = {
  async getAll(projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/setting').SettingCategory[]> {
    return db.settingCategories.where('projectId').equals(projectId).sortBy('sortOrder');
  },

  async getById(id: string): Promise<import('../types/setting').SettingCategory | undefined> {
    return db.settingCategories.get(id);
  },

  async create(params: import('../types/setting').CreateSettingCategoryParams, projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/setting').SettingCategory> {
    const now = Date.now();
    const siblings = await db.settingCategories.where('projectId').equals(projectId).sortBy('sortOrder');
    const category: import('../types/setting').SettingCategory = {
      id: generateId(),
      projectId,
      name: params.name,
      icon: params.icon ?? '📁',
      sortOrder: params.sortOrder ?? siblings.length,
      createdAt: now,
    };
    await db.settingCategories.add(category);
    return category;
  },

  async update(id: string, params: import('../types/setting').UpdateSettingCategoryParams): Promise<void> {
    await db.settingCategories.update(id, params);
  },

  async delete(id: string): Promise<void> {
    // 事务包装：先删设定项再删分类，保证原子性
    const itemIds = await db.settingItems.where('categoryId').equals(id).primaryKeys();
    await db.transaction('rw', db.settingItems, db.settingCategories, async () => {
      await db.settingItems.bulkDelete(itemIds);
      await db.settingCategories.delete(id);
    });
  },
};

// ===== SettingItem =====

export const settingItemService = {
  async getByCategoryId(categoryId: string): Promise<import('../types/setting').SettingItem[]> {
    return db.settingItems.where('categoryId').equals(categoryId).sortBy('createdAt');
  },

  async getAll(projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/setting').SettingItem[]> {
    return db.settingItems.where('projectId').equals(projectId).sortBy('createdAt');
  },

  async getById(id: string): Promise<import('../types/setting').SettingItem | undefined> {
    return db.settingItems.get(id);
  },

  async create(params: import('../types/setting').CreateSettingItemParams, projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/setting').SettingItem> {
    const now = Date.now();
    const item: import('../types/setting').SettingItem = {
      id: generateId(),
      categoryId: params.categoryId,
      projectId,
      name: params.name,
      content: params.content ?? '',
      tags: params.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    await db.settingItems.add(item);
    return item;
  },

  async update(id: string, params: import('../types/setting').UpdateSettingItemParams): Promise<void> {
    await db.settingItems.update(id, { ...params, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.settingItems.delete(id);
  },
};

// ===== Reference =====

export const referenceService = {
  async getByTarget(targetType: ReferenceEntityType, targetId: string): Promise<import('../types/linkage').Reference[]> {
    return db.references.where('targetType').equals(targetType).filter((r) => r.targetId === targetId).toArray();
  },

  async getBySource(sourceType: ReferenceEntityType, sourceId: string): Promise<import('../types/linkage').Reference[]> {
    return db.references.where('sourceType').equals(sourceType).filter((r) => r.sourceId === sourceId).toArray();
  },

  async create(params: import('../types/linkage').CreateReferenceParams): Promise<import('../types/linkage').Reference> {
    const ref: import('../types/linkage').Reference = {
      id: generateId(),
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      targetType: params.targetType,
      targetId: params.targetId,
      fieldName: params.fieldName,
      matchText: params.matchText,
      createdAt: Date.now(),
    };
    await db.references.add(ref);
    return ref;
  },

  async delete(id: string): Promise<void> {
    await db.references.delete(id);
  },

  async deleteByTarget(targetType: ReferenceEntityType, targetId: string): Promise<void> {
    await db.references.where('targetType').equals(targetType).filter((r) => r.targetId === targetId).delete();
  },

  async deleteBySource(sourceType: ReferenceEntityType, sourceId: string): Promise<void> {
    await db.references.where('sourceType').equals(sourceType).filter((r) => r.sourceId === sourceId).delete();
  },

  async updateMatchText(id: string, newMatchText: string): Promise<void> {
    await db.references.update(id, { matchText: newMatchText });
  },
};

// ===== ImpactAlert =====

export const impactAlertService = {
  async getActive(projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/linkage').ImpactAlert[]> {
    return db.impactAlerts.where('projectId').equals(projectId).filter((a) => !a.dismissed).sortBy('createdAt');
  },

  async getAll(projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/linkage').ImpactAlert[]> {
    return db.impactAlerts.where('projectId').equals(projectId).sortBy('createdAt');
  },

  async create(params: import('../types/linkage').CreateImpactAlertParams, projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/linkage').ImpactAlert> {
    const alert: import('../types/linkage').ImpactAlert = {
      id: generateId(),
      projectId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      sourceAction: params.sourceAction,
      targetType: params.targetType,
      targetId: params.targetId,
      targetFieldName: params.targetFieldName,
      description: params.description,
      level: params.level ?? ImpactLevel.WARNING,
      dismissed: false,
      createdAt: Date.now(),
    };
    await db.impactAlerts.add(alert);
    return alert;
  },

  async dismiss(id: string): Promise<void> {
    await db.impactAlerts.update(id, { dismissed: true });
  },

  async dismissAll(projectId: string = DEFAULT_PROJECT_ID): Promise<void> {
    const alerts = await db.impactAlerts.where('projectId').equals(projectId).toArray();
    const ids = alerts.map((a) => a.id);
    await Promise.all(ids.map((id) => db.impactAlerts.update(id, { dismissed: true })));
  },

  async deleteBySource(sourceType: ReferenceEntityType, sourceId: string): Promise<void> {
    await db.impactAlerts.where('sourceType').equals(sourceType).filter((a) => a.sourceId === sourceId).delete();
  },
};

// ===== AIConfig =====

export const aiConfigService = {
  async get(projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/ai').AIConfig | undefined> {
    const configs = await db.aiConfigs.where('projectId').equals(projectId).toArray();
    return configs[0];
  },

  async save(config: Omit<import('../types/ai').AIConfig, 'id'>): Promise<import('../types/ai').AIConfig> {
    const existing = await aiConfigService.get(config.projectId);
    if (existing) {
      await db.aiConfigs.update(existing.id, config);
      return { ...existing, ...config };
    }
    const newConfig: import('../types/ai').AIConfig = { id: generateId(), ...config };
    await db.aiConfigs.add(newConfig);
    return newConfig;
  },
};

// ===== ProjectConfig =====

export const projectConfigService = {
  async get(id: string = DEFAULT_PROJECT_ID): Promise<import('../types/ai').ProjectConfig | undefined> {
    return db.projectConfigs.get(id);
  },

  async create(name: string, description: string = ''): Promise<import('../types/ai').ProjectConfig> {
    const now = Date.now();
    const config: import('../types/ai').ProjectConfig = {
      id: DEFAULT_PROJECT_ID,
      name,
      description,
      createdAt: now,
      updatedAt: now,
    };
    await db.projectConfigs.add(config);
    return config;
  },

  async update(id: string, data: Partial<import('../types/ai').ProjectConfig>): Promise<void> {
    await db.projectConfigs.update(id, { ...data, updatedAt: Date.now() });
  },
};

// ===== Chapter =====

export const chapterService = {
  async getAll(projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/chapter').Chapter[]> {
    return db.chapters.where('projectId').equals(projectId).sortBy('sortOrder');
  },

  async getById(id: string): Promise<import('../types/chapter').Chapter | undefined> {
    return db.chapters.get(id);
  },

  async getChildren(parentId: string): Promise<import('../types/chapter').Chapter[]> {
    return db.chapters.where('parentId').equals(parentId).sortBy('sortOrder');
  },

  async create(params: import('../types/chapter').CreateChapterParams, projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/chapter').Chapter> {
    const now = Date.now();
    const siblings = await db.chapters.where('parentId').equals(params.parentId ?? '').sortBy('sortOrder');
    const chapter: import('../types/chapter').Chapter = {
      id: generateId(),
      projectId,
      volumeId: params.volumeId ?? '',
      parentId: params.parentId ?? '',
      sortOrder: params.sortOrder ?? siblings.length,
      title: params.title,
      content: params.content ?? '',
      wordCount: 0,
      outlineNodeId: params.outlineNodeId ?? '',
      characterRefs: [],
      settingRefs: [],
      status: params.status ?? ChapterStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
    };
    await db.chapters.add(chapter);
    return chapter;
  },

  async update(id: string, params: import('../types/chapter').UpdateChapterParams): Promise<void> {
    await db.chapters.update(id, { ...params, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.chapters.delete(id);
  },

  async deleteRecursive(id: string): Promise<void> {
    const children = await db.chapters.where('parentId').equals(id).toArray();
    for (const child of children) {
      await chapterService.deleteRecursive(child.id);
    }
    await db.chapters.delete(id);
  },
};

// ===== Faction =====

export const factionService = {
  async getAll(projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/faction').Faction[]> {
    return db.factions.where('projectId').equals(projectId).sortBy('createdAt');
  },

  async getById(id: string): Promise<import('../types/faction').Faction | undefined> {
    return db.factions.get(id);
  },

  async create(params: import('../types/faction').CreateFactionParams, projectId: string = DEFAULT_PROJECT_ID): Promise<import('../types/faction').Faction> {
    const now = Date.now();
    const faction: import('../types/faction').Faction = {
      id: generateId(),
      projectId,
      name: params.name,
      description: params.description ?? '',
      factionType: params.factionType ?? import('../types/faction').FactionType.ORGANIZATION,
      parentId: params.parentId ?? '',
      leaderId: params.leaderId ?? '',
      color: params.color ?? '#1976d2',
      tags: params.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    await db.factions.add(faction);
    return faction;
  },

  async update(id: string, params: import('../types/faction').UpdateFactionParams): Promise<void> {
    await db.factions.update(id, { ...params, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    // 将属于该组织的角色的 factionId 清空
    const members = await db.characters.where('factionId').equals(id).toArray();
    for (const char of members) {
      await db.characters.update(char.id, { factionId: '', faction: '' });
    }
    // 将子组织的 parentId 清空
    const children = await db.factions.where('parentId').equals(id).toArray();
    for (const child of children) {
      await db.factions.update(child.id, { parentId: '' });
    }
    await db.factions.delete(id);
  },
};
