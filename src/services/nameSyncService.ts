/**
 * 名称同步替换服务
 * 处理人物名/设定名变更时的文本替换
 */
import { ReferenceEntityType } from '../types/linkage';
import type { Reference } from '../types/linkage';
import { outlineNodeService, plotlineNodeService } from './dbService';
import { replaceWithWordBoundary } from '../utils/text';

/** 名称同步服务 */
export const nameSyncService = {
  /**
   * 在引用源的字段中执行名称替换
   * @param ref 引用关系
   * @param oldName 旧名称
   * @param newName 新名称
   * @returns 是否成功替换
   */
  async replaceInField(
    ref: Reference,
    oldName: string,
    newName: string,
  ): Promise<boolean> {
    if (!oldName || oldName === newName) return false;

    try {
      if (ref.sourceType === ReferenceEntityType.OUTLINE_NODE) {
        return await replaceInOutlineNode(ref, oldName, newName);
      } else if (ref.sourceType === ReferenceEntityType.PLOTLINE_NODE) {
        return await replaceInPlotlineNode(ref, oldName, newName);
      }
      return false;
    } catch (error) {
      console.error('[NameSyncService] Replace failed:', error);
      return false;
    }
  },
};

/** 替换大纲节点中的名称 */
async function replaceInOutlineNode(
  ref: Reference,
  oldName: string,
  newName: string,
): Promise<boolean> {
  const node = await outlineNodeService.getById(ref.sourceId);
  if (!node) return false;

  let updated = false;
  const updates: Record<string, string> = {};

  if (ref.fieldName === 'content' && node.content) {
    const newContent = replaceWithWordBoundary(node.content, oldName, newName);
    if (newContent !== node.content) {
      updates.content = newContent;
      updated = true;
    }
  }

  if (ref.fieldName === 'title' && node.title) {
    const newTitle = replaceWithWordBoundary(node.title, oldName, newName);
    if (newTitle !== node.title) {
      updates.title = newTitle;
      updated = true;
    }
  }

  if (updated) {
    await outlineNodeService.update(node.id, updates);
  }
  return updated;
}

/** 替换剧情节点中的名称 */
async function replaceInPlotlineNode(
  ref: Reference,
  oldName: string,
  newName: string,
): Promise<boolean> {
  const node = await plotlineNodeService.getById(ref.sourceId);
  if (!node) return false;

  let updated = false;
  const updates: Record<string, string> = {};

  if (ref.fieldName === 'content' && node.content) {
    const newContent = replaceWithWordBoundary(node.content, oldName, newName);
    if (newContent !== node.content) {
      updates.content = newContent;
      updated = true;
    }
  }

  if (ref.fieldName === 'title' && node.title) {
    const newTitle = replaceWithWordBoundary(node.title, oldName, newName);
    if (newTitle !== node.title) {
      updates.title = newTitle;
      updated = true;
    }
  }

  if (updated) {
    await plotlineNodeService.update(node.id, updates);
  }
  return updated;
}
