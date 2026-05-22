/**
 * 联动修改 Hook
 * 封装联动引擎的常用操作，供组件使用
 */
import { useCallback } from 'react';
import { linkageEngine } from '../services/linkageEngine';
import { referenceTracker } from '../services/referenceTracker';
import { ReferenceEntityType, ImpactAction } from '../types/linkage';
import { useLinkageStore } from '../stores/linkageStore';
import { useOutlineStore } from '../stores/outlineStore';
import { useCharacterStore } from '../stores/characterStore';
import { usePlotlineStore } from '../stores/plotlineStore';

/** 联动修改 Hook */
export function useLinkage() {
  const addAlert = useLinkageStore((s) => s.addAlert);
  const loadAlerts = useLinkageStore((s) => s.loadAlerts);
  const loadOutlineNodes = useOutlineStore((s) => s.loadNodes);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const loadPlotlines = usePlotlineStore((s) => s.loadPlotlines);

  /** 名称变更联动 */
  const onNameChange = useCallback(
    async (entityType: ReferenceEntityType, entityId: string, oldName: string, newName: string) => {
      const affected = await linkageEngine.onNameChange(entityType, entityId, oldName, newName);
      // 刷新受影响的数据
      if (affected.some((a) => a.sourceType === ReferenceEntityType.OUTLINE_NODE)) {
        await loadOutlineNodes();
      }
      if (affected.some((a) => a.sourceType === ReferenceEntityType.PLOTLINE_NODE)) {
        await loadPlotlines();
      }
      return affected;
    },
    [loadOutlineNodes, loadPlotlines],
  );

  /** 实体删除联动 */
  const onEntityDelete = useCallback(
    async (entityType: ReferenceEntityType, entityId: string, entityName?: string) => {
      const alerts = await linkageEngine.onEntityDelete(entityType, entityId, entityName);
      for (const alert of alerts) {
        addAlert(alert);
      }
      await loadAlerts();
    },
    [addAlert, loadAlerts],
  );

  /** 创建引用 */
  const createReference = useCallback(
    async (params: {
      sourceType: ReferenceEntityType;
      sourceId: string;
      targetType: ReferenceEntityType;
      targetId: string;
      fieldName: string;
      matchText: string;
    }) => {
      return linkageEngine.createReference(params);
    },
    [],
  );

  /** 扫描并索引大纲节点 */
  const scanOutlineNode = useCallback(async (nodeId: string) => {
    return referenceTracker.scanAndIndexOutlineNode(nodeId);
  }, []);

  /** 扫描并索引剧情节点 */
  const scanPlotlineNode = useCallback(async (nodeId: string) => {
    return referenceTracker.scanAndIndexPlotlineNode(nodeId);
  }, []);

  return {
    onNameChange,
    onEntityDelete,
    createReference,
    scanOutlineNode,
    scanPlotlineNode,
  };
}
