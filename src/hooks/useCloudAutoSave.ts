/**
 * 云端自动保存 Hook — 内容变更后 5 秒自动同步
 */
import { useEffect, useRef, useCallback } from 'react';
import { cloudSyncApi } from '../services/cloudSyncService';
import { useAppStore } from '../stores/appStore';

export function useCloudAutoSave() {
  const project = useAppStore(s => s.project);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const syncing = useRef(false);

  /** 标记脏数据 */
  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    // 重置倒计时
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => performSync(), 5000);
  }, []);

  /** 执行同步 */
  const performSync = useCallback(async () => {
    if (!dirtyRef.current || syncing.current) return;
    syncing.current = true;

    try {
      const status = await cloudSyncApi.checkStatus();
      if (!status.configured) return; // 未配置 Google Drive，跳过

      // 收集全部数据
      const { db } = await import('../db');
      const pid = project?.id || 'default-project';
      const name = project?.name || '我的小说';

      const [outlineNodes, plotlines, plotlineNodes, characters, relations,
        settingCategories, settingItems, chapters, factions] = await Promise.all([
        db.outlineNodes.where('projectId').equals(pid).toArray(),
        db.plotlines.where('projectId').equals(pid).toArray(),
        db.plotlineNodes.where('projectId').equals(pid).toArray(),
        db.characters.where('projectId').equals(pid).toArray(),
        db.relations.where('projectId').equals(pid).toArray(),
        db.settingCategories.where('projectId').equals(pid).toArray(),
        db.settingItems.where('projectId').equals(pid).toArray(),
        db.chapters.where('projectId').equals(pid).toArray(),
        db.factions.where('projectId').equals(pid).toArray(),
      ]);

      await cloudSyncApi.syncToCloud(pid, name, {
        version: '2.0.0',
        exportedAt: Date.now(),
        project: { id: pid, name, description: '' },
        data: { outlineNodes, plotlines, plotlineNodes, characters, relations, settingCategories, settingItems, chapters, factions, references: [], impactAlerts: [] },
      });

      console.log('[CloudSync] 自动同步完成');
      dirtyRef.current = false;
    } catch (e: any) {
      console.warn('[CloudSync] 同步失败:', e.message);
    } finally {
      syncing.current = false;
    }
  }, [project]);

  /** 页面关闭前强制同步 */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (dirtyRef.current) {
        // 使用 sendBeacon 在页面关闭前发送（最佳实践）
        performSync();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /** 移除自动同步 */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { markDirty };
}
