/**
 * 自动保存 Hook
 * 监听数据变更并自动保存，提供未保存状态追踪
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { AUTO_SAVE_INTERVAL } from '../utils/constants';

/** 自动保存 Hook */
export function useAutoSave<TDirty>(
  saveFn: () => Promise<void>,
  dirty: TDirty,
  enabled: boolean = true,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const dirtyRef = useRef(isDirty);

  // 同步 dirty ref
  dirtyRef.current = isDirty;

  // 标记为脏
  useEffect(() => {
    if (!enabled) return;
    setIsDirty(true);
  }, [dirty, enabled]);

  // 自动保存
  useEffect(() => {
    if (!enabled || !isDirty) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await saveFn();
        setIsDirty(false);
        setLastSaved(Date.now());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dirty, saveFn, enabled]);

  // 页面关闭/刷新时警告未保存内容
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = '您有未保存的修改，确定要离开吗？';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // 立即保存
  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      setIsSaving(true);
      await saveFn();
      setIsDirty(false);
      setLastSaved(Date.now());
    } catch (error) {
      console.error('Manual save failed:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [saveFn]);

  return { isDirty, isSaving, lastSaved, saveNow };
}
