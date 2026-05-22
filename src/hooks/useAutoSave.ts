/**
 * 自动保存 Hook
 * 监听数据变更并自动保存
 */
import { useEffect, useRef } from 'react';
import { AUTO_SAVE_INTERVAL } from '../utils/constants';

/** 自动保存 Hook */
export function useAutoSave(
  data: unknown,
  saveFn: (data: unknown) => Promise<void>,
  enabled: boolean = true,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    const serialized = JSON.stringify(data);
    if (serialized === lastSavedRef.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        await saveFn(data);
        lastSavedRef.current = serialized;
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, saveFn, enabled]);
}
