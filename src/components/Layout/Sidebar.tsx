/**
 * 左侧导航栏（响应式：桌面端永久/移动端临时抽屉）
 */
import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { NAV_ITEMS, SIDEBAR_WIDTH } from '../../utils/constants';
import { useAppStore } from '../../stores/appStore';
import { useLinkageStore } from '../../stores/linkageStore';
import { useExportImport } from '../../hooks/useExportImport';
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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

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
      await syncToCloud();
      setSnackbar({ open: true, message: '数据已同步到本地，正在上传腾讯文档...', severity: 'success' });
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
            <ListItemText primary={syncing ? '同步中...' : '同步到腾讯文档'} />
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
      </List>

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
