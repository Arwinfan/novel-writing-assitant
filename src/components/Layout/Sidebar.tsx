/**
 * 左侧导航栏
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
} from '@mui/icons-material';
import { NAV_ITEMS, SIDEBAR_WIDTH } from '../../utils/constants';
import { useAppStore } from '../../stores/appStore';
import { useLinkageStore } from '../../stores/linkageStore';
import { useExportImport } from '../../hooks/useExportImport';
import { ExportDialog } from '../Export/ExportDialog';

export const Sidebar: React.FC = () => {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setImportDialogOpen = useAppStore((s) => s.setImportDialogOpen);
  const project = useAppStore((s) => s.project);
  const undismissedCount = useLinkageStore((s) => s.alerts.filter((a) => !a.dismissed).length);
  const togglePanel = useLinkageStore((s) => s.togglePanel);
  const { exportProject } = useExportImport();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

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
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
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
          <ListItemButton onClick={() => setExportDialogOpen(true)}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ExportIcon />
            </ListItemIcon>
            <ListItemText primary="导出项目" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => setImportDialogOpen(true)}>
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
    </Drawer>
  );
};
