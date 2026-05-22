/**
 * 引用追踪器
 * 负责建立、查询、维护引用关系
 */
import { ReferenceEntityType } from '../types/linkage';
import type { Reference, CreateReferenceParams } from '../types/linkage';
import { referenceService, outlineNodeService, plotlineNodeService, characterService, settingItemService } from './dbService';
import { scanForNames } from '../utils/text';
import { DEFAULT_PROJECT_ID } from '../utils/constants';

/** 引用追踪器 */
export const referenceTracker = {
  /**
   * 获取所有引用某实体的 Reference
   */
  async getReferencesTo(targetType: ReferenceEntityType, targetId: string): Promise<Reference[]> {
    return referenceService.getByTarget(targetType, targetId);
  },

  /**
   * 获取某实体发出的所有 Reference
   */
  async getReferencesFrom(sourceType: ReferenceEntityType, sourceId: string): Promise<Reference[]> {
    return referenceService.getBySource(sourceType, sourceId);
  },

  /**
   * 手动建立引用关系
   */
  async createReference(params: CreateReferenceParams): Promise<Reference> {
    return referenceService.create(params);
  },

  /**
   * 删除引用关系
   */
  async deleteReference(id: string): Promise<void> {
    return referenceService.delete(id);
  },

  /**
   * 扫描大纲节点内容，自动建立对人物和设定的隐式引用
   */
  async scanAndIndexOutlineNode(nodeId: string): Promise<Reference[]> {
    const node = await outlineNodeService.getById(nodeId);
    if (!node) return [];

    const references: Reference[] = [];
    const characters = await characterService.getAll(node.projectId);
    const settingItems = await settingItemService.getAll(node.projectId);

    const charNames = characters.map((c) => c.name).filter(Boolean);
    const settingNames = settingItems.map((s) => s.name).filter(Boolean);

    const contentRefs = scanForNames(node.content, charNames);
    for (const ref of contentRefs) {
      const char = characters.find((c) => c.name === ref.name);
      if (char) {
        const existing = await this.findExistingReference(
          ReferenceEntityType.OUTLINE_NODE, nodeId,
          ReferenceEntityType.CHARACTER, char.id,
          'content',
        );
        if (!existing) {
          const created = await referenceService.create({
            sourceType: ReferenceEntityType.OUTLINE_NODE,
            sourceId: nodeId,
            targetType: ReferenceEntityType.CHARACTER,
            targetId: char.id,
            fieldName: 'content',
            matchText: ref.name,
          });
          references.push(created);
        }
      }
    }

    const settingRefs = scanForNames(node.content, settingNames);
    for (const ref of settingRefs) {
      const item = settingItems.find((s) => s.name === ref.name);
      if (item) {
        const existing = await this.findExistingReference(
          ReferenceEntityType.OUTLINE_NODE, nodeId,
          ReferenceEntityType.SETTING_ITEM, item.id,
          'content',
        );
        if (!existing) {
          const created = await referenceService.create({
            sourceType: ReferenceEntityType.OUTLINE_NODE,
            sourceId: nodeId,
            targetType: ReferenceEntityType.SETTING_ITEM,
            targetId: item.id,
            fieldName: 'content',
            matchText: ref.name,
          });
          references.push(created);
        }
      }
    }

    return references;
  },

  /**
   * 扫描剧情节点内容，自动建立引用
   */
  async scanAndIndexPlotlineNode(nodeId: string): Promise<Reference[]> {
    const node = await plotlineNodeService.getById(nodeId);
    if (!node) return [];

    const references: Reference[] = [];
    const characters = await characterService.getAll(node.projectId);
    const settingItems = await settingItemService.getAll(node.projectId);

    const charNames = characters.map((c) => c.name).filter(Boolean);
    const settingNames = settingItems.map((s) => s.name).filter(Boolean);

    const contentRefs = scanForNames(node.content, charNames);
    for (const ref of contentRefs) {
      const char = characters.find((c) => c.name === ref.name);
      if (char) {
        const existing = await this.findExistingReference(
          ReferenceEntityType.PLOTLINE_NODE, nodeId,
          ReferenceEntityType.CHARACTER, char.id,
          'content',
        );
        if (!existing) {
          const created = await referenceService.create({
            sourceType: ReferenceEntityType.PLOTLINE_NODE,
            sourceId: nodeId,
            targetType: ReferenceEntityType.CHARACTER,
            targetId: char.id,
            fieldName: 'content',
            matchText: ref.name,
          });
          references.push(created);
        }
      }
    }

    const settingRefs = scanForNames(node.content, settingNames);
    for (const ref of settingRefs) {
      const item = settingItems.find((s) => s.name === ref.name);
      if (item) {
        const existing = await this.findExistingReference(
          ReferenceEntityType.PLOTLINE_NODE, nodeId,
          ReferenceEntityType.SETTING_ITEM, item.id,
          'content',
        );
        if (!existing) {
          const created = await referenceService.create({
            sourceType: ReferenceEntityType.PLOTLINE_NODE,
            sourceId: nodeId,
            targetType: ReferenceEntityType.SETTING_ITEM,
            targetId: item.id,
            fieldName: 'content',
            matchText: ref.name,
          });
          references.push(created);
        }
      }
    }

    return references;
  },

  /**
   * 查找是否已存在相同的引用
   */
  async findExistingReference(
    sourceType: ReferenceEntityType,
    sourceId: string,
    targetType: ReferenceEntityType,
    targetId: string,
    fieldName: string,
  ): Promise<Reference | undefined> {
    const refs = await referenceService.getBySource(sourceType, sourceId);
    return refs.find((r) => r.targetType === targetType && r.targetId === targetId && r.fieldName === fieldName);
  },
};
