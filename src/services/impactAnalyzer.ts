/**
 * 影响分析服务
 * 分析要素变更/删除对其他要素的影响，生成 ImpactAlert
 */
import { ReferenceEntityType, ImpactAction, ImpactLevel } from '../types/linkage';
import type { Reference, CreateImpactAlertParams } from '../types/linkage';

/** 实体类型显示名称映射 */
const ENTITY_TYPE_LABELS: Record<string, string> = {
  [ReferenceEntityType.OUTLINE_NODE]: '大纲节点',
  [ReferenceEntityType.PLOTLINE_NODE]: '剧情节点',
  [ReferenceEntityType.CHARACTER]: '角色',
  [ReferenceEntityType.SETTING_ITEM]: '设定项',
};

/** 动作显示名称映射 */
const ACTION_LABELS: Record<string, string> = {
  [ImpactAction.RENAME]: '重命名',
  [ImpactAction.MODIFY]: '修改',
  [ImpactAction.DELETE]: '删除',
};

/** 影响分析器 */
export const impactAnalyzer = {
  /**
   * 分析引用列表中受影响的要素，生成影响提醒
   * @param references 引用关系列表
   * @param action 触发动作
   * @param sourceEntityType 源实体类型
   * @param sourceEntityId 源实体ID
   * @param sourceEntityName 源实体名称（用于描述）
   * @returns 影响提醒参数列表
   */
  analyzeImpact(
    references: Reference[],
    action: ImpactAction,
    sourceEntityType: ReferenceEntityType,
    sourceEntityId: string,
    sourceEntityName?: string,
  ): CreateImpactAlertParams[] {
    const alerts: CreateImpactAlertParams[] = [];
    const sourceLabel = ENTITY_TYPE_LABELS[sourceEntityType] ?? sourceEntityType;
    const actionLabel = ACTION_LABELS[action] ?? action;
    const namePart = sourceEntityName ? `"${sourceEntityName}"` : '';

    for (const ref of references) {
      const targetLabel = ENTITY_TYPE_LABELS[ref.targetType] ?? ref.targetType;
      const level = determineImpactLevel(action, ref);

      alerts.push({
        sourceType: sourceEntityType,
        sourceId: sourceEntityId,
        sourceAction: action,
        targetType: ref.sourceType,
        targetId: ref.sourceId,
        targetFieldName: ref.fieldName,
        description: `${sourceLabel}${namePart}被${actionLabel}，${targetLabel}的"${ref.fieldName}"字段中引用了此内容`,
        level,
      });
    }

    return alerts;
  },
};

/**
 * 根据动作类型和引用关系确定影响级别
 */
function determineImpactLevel(action: ImpactAction, _ref: Reference): ImpactLevel {
  switch (action) {
    case ImpactAction.DELETE:
      return ImpactLevel.CRITICAL;
    case ImpactAction.RENAME:
      return ImpactLevel.WARNING;
    case ImpactAction.MODIFY:
      return ImpactLevel.INFO;
    default:
      return ImpactLevel.INFO;
  }
}
