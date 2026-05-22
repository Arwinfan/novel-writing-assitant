/**
 * 根组件（路由+布局）
 */
import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, FormControlLabel, Checkbox } from '@mui/material';
import { AppLayout } from './components/Layout/AppLayout';
import { AIChatPanel } from './components/AI/AIChatPanel';
import { LinkagePanel } from './pages/LinkagePanel/LinkagePanel';
import { ProjectDialog } from './components/Layout/ProjectDialog';
import { useAppStore } from './stores/appStore';
import { useLinkageStore } from './stores/linkageStore';
import { useAIStore } from './stores/aiStore';
import { useExportImport } from './hooks/useExportImport';

// 页面组件
import { OutlinePage } from './pages/OutlinePage/OutlinePage';
import { PlotlinePage } from './pages/PlotlinePage/PlotlinePage';
import { CharacterPage } from './pages/CharacterPage/CharacterPage';
import { RelationPage } from './pages/RelationPage/RelationPage';
import { SettingPage } from './pages/SettingPage/SettingPage';
import { ChapterPage } from './pages/ChapterPage/ChapterPage';

/** MUI 主题 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif',
  },
});

/** 页面映射 */
const PAGE_MAP: Record<string, React.FC> = {
  outline: OutlinePage,
  chapter: ChapterPage,
  plotline: PlotlinePage,
  character: CharacterPage,
  relation: RelationPage,
  setting: SettingPage,
};

const App: React.FC = () => {
  const currentPage = useAppStore((s) => s.currentPage);
  const initialize = useAppStore((s) => s.initialize);
  const initialized = useAppStore((s) => s.initialized);
  const importDialogOpen = useAppStore((s) => s.importDialogOpen);
  const setImportDialogOpen = useAppStore((s) => s.setImportDialogOpen);

  const loadAlerts = useLinkageStore((s) => s.loadAlerts);
  const loadConfig = useAIStore((s) => s.loadConfig);

  const [mergeMode, setMergeMode] = useState(false);
  const { importProject } = useExportImport();

  /** 初始化应用 */
  useEffect(() => {
    const init = async () => {
      await initialize();
      await loadAlerts();
      await loadConfig();
    };
    init();
  }, [initialize, loadAlerts, loadConfig]);

  /** 导入处理 */
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importProject(file, mergeMode);
      setImportDialogOpen(false);
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
    e.target.value = '';
  };

  if (!initialized) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <Typography variant="h5" color="text.secondary">加载中...</Typography>
        </div>
      </ThemeProvider>
    );
  }

  const CurrentPage = PAGE_MAP[currentPage] ?? OutlinePage;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppLayout>
        <CurrentPage />
      </AppLayout>

      {/* 全局面板 */}
      <AIChatPanel />
      <LinkagePanel />
      <ProjectDialog />

      {/* 导入对话框 */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>导入项目</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            选择一个之前导出的 JSON 文件来恢复项目数据。
          </Typography>
          <FormControlLabel
            control={
              <Checkbox checked={mergeMode} onChange={(e) => setMergeMode(e.target.checked)} />
            }
            label="合并模式（保留现有数据）"
          />
          <Button variant="contained" component="label" fullWidth sx={{ mt: 2 }}>
            选择文件
            <input type="file" hidden accept=".json" onChange={handleImport} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default App;
