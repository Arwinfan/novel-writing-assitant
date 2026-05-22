/**
 * 联动提醒面板
 */
import React, { useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import { Close as CloseIcon, Notifications as AlertIcon } from '@mui/icons-material';
import { useLinkageStore } from '../../stores/linkageStore';
import { ImpactItem } from './ImpactItem';

export const LinkagePanel: React.FC = () => {
  const { panelOpen, alerts, setPanelOpen, loadAlerts, dismissAll } = useLinkageStore();
  const undismissed = alerts.filter((a) => !a.dismissed);

  useEffect(() => {
    if (panelOpen) {
      loadAlerts();
    }
  }, [panelOpen, loadAlerts]);

  return (
    <Drawer
      anchor="right"
      open={panelOpen}
      onClose={() => setPanelOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: 360,
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AlertIcon color="primary" />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          联动提醒
        </Typography>
        <IconButton onClick={() => setPanelOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {undismissed.length > 0 && (
        <Box sx={{ px: 2, py: 1 }}>
          <Button size="small" onClick={dismissAll}>
            全部标记已读
          </Button>
        </Box>
      )}

      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {alerts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">暂无联动提醒</Typography>
          </Box>
        ) : (
          alerts.map((alert) => <ImpactItem key={alert.id} alert={alert} />)
        )}
      </List>
    </Drawer>
  );
};
