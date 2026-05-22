/**
 * 顶部栏
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
} from '@mui/icons-material';
import { TOPBAR_HEIGHT } from '../../utils/constants';
import { useAppStore } from '../../stores/appStore';
import { useAIStore } from '../../stores/aiStore';
import { SearchBar } from '../Common/SearchBar';

export const TopBar: React.FC = () => {
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
      <Toolbar variant="dense" sx={{ gap: 2 }}>
        <BookIcon sx={{ color: 'primary.main' }} fontSize="small" />

        <Button
          size="small"
          onClick={() => setProjectDialogOpen(true)}
          sx={{
            textTransform: 'none',
            color: 'text.primary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {project?.name ?? '我的小说'}
          </Typography>
          <SwitchIcon sx={{ ml: 0.5, fontSize: 16, color: 'text.secondary' }} />
        </Button>

        {(project as any)?.genre && (
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

        <Box sx={{ flexGrow: 1, maxWidth: 400 }}>
          <SearchBar />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="AI 助手">
          <IconButton color="inherit" onClick={() => setChatPanelOpen(true)}>
            <AIIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="AI 设置">
          <IconButton color="inherit" onClick={() => setConfigDialogOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
