/**
 * 双栏布局容器（支持移动端）
 */
import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from '../../utils/constants';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = !useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* 桌面端永久侧边栏 */}
      {!isMobile && (
        <Sidebar variant="permanent" onClose={() => {}} />
      )}
      {/* 移动端临时抽屉 */}
      {isMobile && (
        <Sidebar variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} />
      )}

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar isMobile={isMobile} onMenuClick={() => setMobileOpen(true)} />
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: { xs: 1.5, sm: 2, md: 3 },
            bgcolor: 'grey.50',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
