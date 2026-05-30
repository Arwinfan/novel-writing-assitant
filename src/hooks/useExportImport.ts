/**
 * 导入导出 Hook
 */
import { useCallback } from 'react';
import { exportImportService, type ExportOptions, type ExportFormat } from '../services/exportImportService';
import { useAppStore } from '../stores/appStore';
import { useOutlineStore } from '../stores/outlineStore';
import { usePlotlineStore } from '../stores/plotlineStore';
import { useCharacterStore } from '../stores/characterStore';
import { useRelationStore } from '../stores/relationStore';
import { useSettingStore } from '../stores/settingStore';
import { useChapterStore } from '../stores/chapterStore';

/** 导入导出 Hook */
export function useExportImport() {
  const project = useAppStore((s) => s.project);
  const loadOutlineNodes = useOutlineStore((s) => s.loadNodes);
  const loadPlotlines = usePlotlineStore((s) => s.loadPlotlines);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const loadRelations = useRelationStore((s) => s.loadRelations);
  const loadCategories = useSettingStore((s) => s.loadCategories);
  const loadAllItems = useSettingStore((s) => s.loadAllItems);
  const loadChapters = useChapterStore((s) => s.loadChapters);

  /** 刷新所有数据 */
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadOutlineNodes(),
      loadPlotlines(),
      loadCharacters(),
      loadRelations(),
      loadCategories(),
      loadAllItems(),
      loadChapters(),
    ]);
  }, [loadOutlineNodes, loadPlotlines, loadCharacters, loadRelations, loadCategories, loadAllItems, loadChapters]);

  /** 导出项目 */
  const exportProject = useCallback(async (options: ExportOptions) => {
    const projectId = project?.id ?? 'default-project';
    const name = project?.name ?? '我的小说';
    const description = project?.description ?? '';
    await exportImportService.downloadExport(projectId, name, description, options);
  }, [project]);

  /** 同步到腾讯文档 */
  const syncToCloud = useCallback(async () => {
    const projectId = project?.id ?? 'default-project';
    const name = project?.name ?? '我的小说';
    const description = project?.description ?? '';
    await exportImportService.syncToServer(projectId, name, description);
  }, [project]);

  /** 导入项目 */
  const importProject = useCallback(
    async (file: File, mergeMode: boolean = false) => {
      const projectId = project?.id ?? 'default-project';
      const json = await exportImportService.readImportFile(file);
      await exportImportService.importProject(json, projectId, mergeMode);
      await refreshAll();
    },
    [project, refreshAll],
  );

  return {
    exportProject,
    importProject,
    syncToCloud,
  };
}
