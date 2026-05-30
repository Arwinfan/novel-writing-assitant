/**
 * 联动修改引擎核心
 * 协调引用追踪、名称同步、影响分析
 */
import { ReferenceEntityType, ImpactAction, ImpactLevel } from '../types/linkage';
import type { Reference, ImpactAlert } from '../types/linkage';
import { referenceService, impactAlertService } from './dbService';
import { nameSyncService } from './nameSyncService';
import { impactAnalyzer } from './impactAnalyzer';
import { DEFAULT_PROJECT_ID } from '../utils/constants';

/** 联动引擎 - 处理要素变更时的联动逻辑 */
export const linkageEngine = {
  /** 已处理的实体ID集合，防止循环联动 */
  _processingSet: new Set<string>(),
  _processingLock: false,

  /**
   * 名称变更联动处理
   * 当人物名/设定名变更时，自动同步替换所有引用
   */
  async onNameChange(
    entityType: ReferenceEntityType,
    entityId: string,
    oldName: string,
    newName: string,
  ): Promise<Array<{ sourceId: string; sourceType: ReferenceEntityType; fieldName: string }>> {
    // 防止循环：如果该实体已在处理中，跳过
    const key = `${entityType}:${entityId}`;
    if (linkageEngine._processingSet.has(key)) return [];
    linkageEngine._processingSet.add(key);

    try {
      const references = await referenceService.getByTarget(entityType, entityId);
      const affectedSources: Array<{ sourceId: string; sourceType: ReferenceEntityType; fieldName: string }> = [];

      for (const ref of references) {
        const updated = await nameSyncService.replaceInField(ref, oldName, newName);
        if (updated) {
          affectedSources.push({
            sourceId: ref.sourceId,
            sourceType: ref.sourceType,
            fieldName: ref.fieldName,
          });
          await referenceService.updateMatchText(ref.id, newName);
        }
      }

      return affectedSources;
    } finally {
      linkageEngine._processingSet.delete(key);
    }
  },

  /**
   * 实体内容变更联动处理
   * 修改设定内容等场景，生成影响提醒
   */
  async onEntityChange(
    entityType: ReferenceEntityType,
    entityId: string,
    action: ImpactAction,
    entityName?: string,
  ): Promise<ImpactAlert[]> {
    // 防重入锁
    if (linkageEngine._processingLock) return [];
    linkageEngine._processingLock = true;

    try {
      const references = await referenceService.getByTarget(entityType, entityId);
      const alerts = impactAnalyzer.analyzeImpact(references, action, entityType, entityId, entityName);

      const savedAlerts: ImpactAlert[] = [];
      for (const alertData of alerts) {
        const alert = await impactAlertService.create(alertData);
        savedAlerts.push(alert);
      }

      if (action === ImpactAction.DELETE) {
        await referenceService.deleteByTarget(entityType, entityId);
      }

      return savedAlerts;
    } finally {
      linkageEngine._processingLock = false;
    }
  },

  /**
   * 创建引用关系
   */
  async createReference(params: {
    sourceType: ReferenceEntityType;
    sourceId: string;
    targetType: ReferenceEntityType;
    targetId: string;
    fieldName: string;
    matchText: string;
  }): Promise<Reference> {
    return referenceService.create(params);
  },

  /**
   * 删除实体时的联动处理
   * 清理所有相关引用并生成影响提醒
   */
  async onEntityDelete(
    entityType: ReferenceEntityType,
    entityId: string,
    entityName?: string,
  ): Promise<ImpactAlert[]> {
    return this.onEntityChange(entityType, entityId, ImpactAction.DELETE, entityName);
  },
};
