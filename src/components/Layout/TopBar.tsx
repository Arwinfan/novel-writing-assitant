/**
 * 顶部栏（支持移动端）
 */
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Box,
  Button,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Settings as SettingsIcon,
  MenuBook as BookIcon,
  SwapHoriz as SwitchIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { TOPBAR_HEIGHT } from '../../utils/constants';
import { useAppStore } from '../../stores/appStore';
import { useAIStore } from '../../stores/aiStore';
import { SearchBar } from '../Common/SearchBar';

interface TopBarProps {
  isMobile: boolean;
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ isMobile, onMenuClick }) => {
  const project = useAppStore((s) => s.project);
  const setChatPanelOpen = useAIStore((s) => s.setChatPanelOpen);
  const setConfigDialogOpen = useAIStore((s) => s.setConfigDialogOpen);
  const setProjectDialogOpen = useAppStore((s) => s.setProjectDialogOpen);

  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        height: TOPBAR_HEIGHT,
        bgcolor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Toolbar variant="dense" sx={{ gap: { xs: 0.5, sm: 2 } }}>
        {/* 移动端汉堡菜单 */}
        {isMobile && (
          <IconButton color="inherit" edge="start" onClick={onMenuClick} sx={{ mr: 0.5 }}>
            <MenuIcon />
          </IconButton>
        )}

        {!isMobile && <BookIcon sx={{ color: 'primary.main' }} fontSize="small" />}

        <Button
          size="small"
          onClick={() => setProjectDialogOpen(true)}
          sx={{
            textTransform: 'none',
            color: 'text.primary',
            minWidth: { xs: 'auto', sm: 'auto' },
            px: { xs: 0.5, sm: 1 },
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' } }}
            noWrap
          >
            {project?.name ?? '我的小说'}
          </Typography>
          {!isMobile && <SwitchIcon sx={{ ml: 0.5, fontSize: 16, color: 'text.secondary' }} />}
        </Button>

        {(project as any)?.genre && !isMobile && (
          <Box
            sx={{
              px: 1,
              py: 0.1,
              borderRadius: 1,
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              fontSize: '0.7rem',
              fontWeight: 500,
            }}
          >
            {(project as any).genre}
          </Box>
        )}

        {/* 搜索栏：桌面端显示 */}
        {!isMobile && (
          <Box sx={{ flexGrow: 1, maxWidth: 400 }}>
            <SearchBar />
          </Box>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* 移动端搜索图标 */}
        {isMobile && (
          <Box sx={{ flexGrow: 1, maxWidth: 120 }}>
            <SearchBar />
          </Box>
        )}

        <Tooltip title="AI 助手">
          <IconButton color="inherit" size={isMobile ? 'small' : 'medium'} onClick={() => setChatPanelOpen(true)}>
            <AIIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>

        <Tooltip title="AI 设置">
          <IconButton color="inherit" size={isMobile ? 'small' : 'medium'} onClick={() => setConfigDialogOpen(true)}>
            <SettingsIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
