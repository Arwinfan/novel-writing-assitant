/**
 * 左侧导航栏（响应式：桌面端永久/移动端临时抽屉）
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Divider,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  AccountTree as OutlineIcon,
  Description as ChapterIcon,
  Timeline as PlotlineIcon,
  Person as CharacterIcon,
  DeviceHub as RelationIcon,
  Settings as SettingIcon,
  Notifications as AlertIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  CloudSync as SyncIcon,
  CloudDownload as CloudDownIcon,
} from '@mui/icons-material';
import { NAV_ITEMS, SIDEBAR_WIDTH } from '../../utils/constants';
import { useAppStore } from '../../stores/appStore';
import { useLinkageStore } from '../../stores/linkageStore';
import { useExportImport } from '../../hooks/useExportImport';
import { cloudSyncApi } from '../../services/cloudSyncService';
import { ExportDialog } from '../Export/ExportDialog';

interface SidebarProps {
  variant: 'permanent' | 'temporary';
  open?: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ variant, open = false, onClose }) => {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setImportDialogOpen = useAppStore((s) => s.setImportDialogOpen);
  const project = useAppStore((s) => s.project);
  const undismissedCount = useLinkageStore((s) => s.alerts.filter((a) => !a.dismissed).length);
  const togglePanel = useLinkageStore((s) => s.togglePanel);
  const { exportProject, syncToCloud } = useExportImport();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'success',
  });

  // 云端恢复
  const [pullDialogOpen, setPullDialogOpen] = useState(false);
  const [pullInfo, setPullInfo] = useState<{ lastModified: string; summary: string } | null>(null);
  const [pulling, setPulling] = useState(false);

  // 检查云端状态
  useEffect(() => {
    cloudSyncApi.checkStatus().then(s => setCloudConnected(s.configured)).catch(() => {});
  }, []);

  /** 打开云端恢复确认弹窗 */
  const handleOpenPull = async () => {
    setPulling(true);
    try {
      const result = await cloudSyncApi.pullFromCloud();
      if (!result.success) {
        setSnackbar({ open: true, message: result.error || '无云端数据', severity: 'info' });
        return;
      }
      const summary = result.summary
        ? `${result.summary.chapters || 0}章 · ${result.summary.characters || 0}角色 · ${(result.summary.totalWords || 0).toLocaleString()}字`
        : '';
      setPullInfo({
        lastModified: result.lastModified || '未知',
        summary,
      });
      setPullDialogOpen(true);
    } catch (e: any) {
      setSnackbar({ open: true, message: `检查失败: ${e.message}`, severity: 'error' });
    } finally {
      setPulling(false);
    }
  };

  /** 确认云端恢复 */
  const handleConfirmPull = async () => {
    setPulling(true);
    try {
      const result = await cloudSyncApi.pullFromCloud();
      if (!result.success || !result.config) throw new Error(result.error || '无配置数据');
      
      // 将云端配置数据转为完整导出格式并导入
      const importData = {
        version: '2.0.0',
        project: result.config.project,
        data: {
          ...result.config.data,
          chapters: [], // 配置文件不包含正文，通过导出功能另行处理
          references: [],
          impactAlerts: [],
        },
      };
      
      const { db } = await import('../../db');
      const pid = project?.id || 'default-project';
      
      // 彻底清除旧数据（用 put 覆盖方式导入更可靠）
      await Promise.all([
        db.factions.where('projectId').equals(pid).delete(),
        db.characters.where('projectId').equals(pid).delete(),
        db.relations.where('projectId').equals(pid).delete(),
        db.outlineNodes.where('projectId').equals(pid).delete(),
        db.plotlines.where('projectId').equals(pid).delete(),
        db.plotlineNodes.where('projectId').equals(pid).delete(),
        db.settingCategories.where('projectId').equals(pid).delete(),
        db.settingItems.where('projectId').equals(pid).delete(),
        db.chapters.where('projectId').equals(pid).delete(),
        db.impactAlerts.where('projectId').equals(pid).delete(),
        db.references.clear(),
      ]);

      // 直接用 put 写入（避免 Key exists 错误）
      const d = importData.data;
      const addAll = (table: any, items: any[]) => {
        return Promise.all(items.map(item => table.put(item)));
      };
      await addAll(db.characters, d.characters || []);
      await addAll(db.factions, d.factions || []);
      await addAll(db.outlineNodes, d.outlineNodes || []);
      await addAll(db.plotlines, d.plotlines || []);
      await addAll(db.plotlineNodes, d.plotlineNodes || []);
      await addAll(db.relations, d.relations || []);
      await addAll(db.settingCategories, d.settingCategories || []);
      await addAll(db.settingItems, d.settingItems || []);
      await addAll(db.chapters, d.chapterIndex || d.chapters || []);
      await addAll(db.references, d.references || []);
      await addAll(db.impactAlerts, d.impactAlerts || []);
      
      setSnackbar({ open: true, message: '✅ 配置已从云端恢复，刷新页面查看', severity: 'success' });
      setPullDialogOpen(false);
    } catch (e: any) {
      setSnackbar({ open: true, message: `恢复失败: ${e.message}`, severity: 'error' });
    } finally {
      setPulling(false);
    }
  };

  const iconMap: Record<string, React.ReactElement> = {
    outline: <OutlineIcon />,
    chapter: <ChapterIcon />,
    plotline: <PlotlineIcon />,
    character: <CharacterIcon />,
    relation: <RelationIcon />,
    setting: <SettingIcon />,
  };

  const handleNavClick = (key: string) => {
    setCurrentPage(key);
    if (variant === 'temporary') onClose();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // 1. 本地导出到 exports/
      await syncToCloud();
      // 2. 尝试云端同步
      const status = await cloudSyncApi.checkStatus();
      if (status.configured) {
        const { db } = await import('../../db');
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
        const result = await cloudSyncApi.syncToCloud(pid, name, {
          version: '2.0.0',
          exportedAt: Date.now(),
          project: { id: pid, name, description: '' },
          data: { outlineNodes, plotlines, plotlineNodes, characters, relations, settingCategories, settingItems, chapters, factions, references: [], impactAlerts: [] },
        });
        setSnackbar({ open: true, message: `已同步到云端：${result.message}`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: '已保存本地，云端未配置（设置 GOOGLE_DRIVE_FOLDER_ID）', severity: 'info' });
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: `同步失败：${err.message}`, severity: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const sidebarContent = (
    <>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
          小说写作助手
        </Typography>
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.key} disablePadding>
            <ListItemButton
              selected={currentPage === item.key}
              onClick={() => handleNavClick(item.key)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.light' },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: currentPage === item.key ? 'primary.contrastText' : 'inherit',
                  minWidth: 36,
                }}
              >
                {iconMap[item.key]}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={togglePanel}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Badge badgeContent={undismissedCount} color="error">
                <AlertIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="联动提醒" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => { setExportDialogOpen(true); if (variant === 'temporary') onClose(); }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ExportIcon />
            </ListItemIcon>
            <ListItemText primary="导出项目" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => { handleSync(); if (variant === 'temporary') onClose(); }} disabled={syncing}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {syncing ? <CircularProgress size={20} /> : <SyncIcon />}
            </ListItemIcon>
            <ListItemText primary={syncing ? '同步中...' : '同步到云端'} secondary={
              cloudConnected
                ? 'Google Drive 已连接'
                : '未配置 Google Drive'
            } />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => { setImportDialogOpen(true); if (variant === 'temporary') onClose(); }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ImportIcon />
            </ListItemIcon>
            <ListItemText primary="导入项目" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => { handleOpenPull(); if (variant === 'temporary') onClose(); }} disabled={pulling}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {pulling ? <CircularProgress size={20} /> : <CloudDownIcon />}
            </ListItemIcon>
            <ListItemText primary={pulling ? '检查中...' : '从云端恢复'} />
          </ListItemButton>
        </ListItem>
      </List>

      {/* 从云端恢复确认弹窗 */}
      <Dialog open={pullDialogOpen} onClose={() => setPullDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>确认从云端恢复</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            将从 Google Drive 拉取配置数据，覆盖当前本地数据。
          </Typography>
          {pullInfo && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>云端最后修改时间：</strong>
              </Typography>
              <Typography variant="body1" color="primary.main" fontWeight={600}>
                {new Date(pullInfo.lastModified).toLocaleString('zh-CN')}
              </Typography>
              {pullInfo.summary && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  内容：{pullInfo.summary}
                </Typography>
              )}
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            当前本地数据将被覆盖，建议先导出备份。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPullDialogOpen(false)}>取消</Button>
          <Button onClick={handleConfirmPull} variant="contained" color="primary" disabled={pulling}>
            {pulling ? '恢复中...' : '确认恢复'}
          </Button>
        </DialogActions>
      </Dialog>

      <ExportDialog
        open={exportDialogOpen}
        projectName={project?.name ?? '我的小说'}
        onExport={exportProject}
        onClose={() => setExportDialogOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );

  return (
    <Drawer
      variant={variant}
      open={variant === 'temporary' ? open : true}
      onClose={onClose}
      sx={{
        width: variant === 'permanent' ? SIDEBAR_WIDTH : 'auto',
        flexShrink: variant === 'permanent' ? 0 : undefined,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};
