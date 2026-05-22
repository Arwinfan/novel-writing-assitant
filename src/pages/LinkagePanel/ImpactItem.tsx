/**
 * 影响项组件
 */
import React from 'react';
import {
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import type { ImpactAlert } from '../../types/linkage';
import { ImpactLevel } from '../../types/linkage';
import { useLinkageStore } from '../../stores/linkageStore';

interface ImpactItemProps {
  alert: ImpactAlert;
}

const LEVEL_COLORS: Record<string, 'default' | 'warning' | 'error'> = {
  [ImpactLevel.INFO]: 'default',
  [ImpactLevel.WARNING]: 'warning',
  [ImpactLevel.CRITICAL]: 'error',
};

const LEVEL_LABELS: Record<string, string> = {
  [ImpactLevel.INFO]: '信息',
  [ImpactLevel.WARNING]: '警告',
  [ImpactLevel.CRITICAL]: '严重',
};

export const ImpactItem: React.FC<ImpactItemProps> = ({ alert }) => {
  const dismissAlert = useLinkageStore((s) => s.dismissAlert);

  return (
    <ListItem
      sx={{
        opacity: alert.dismissed ? 0.5 : 1,
        bgcolor: alert.dismissed ? 'grey.100' : 'background.paper',
        mb: 0.5,
        borderRadius: 1,
      }}
      secondaryAction={
        !alert.dismissed && (
          <IconButton size="small" onClick={() => dismissAlert(alert.id)} title="标记已读">
            <CheckIcon fontSize="small" />
          </IconButton>
        )
      }
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Chip
              label={LEVEL_LABELS[alert.level] ?? alert.level}
              size="small"
              color={LEVEL_COLORS[alert.level] ?? 'default'}
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
            <Typography variant="caption" color="text.secondary">
              {new Date(alert.createdAt).toLocaleString()}
            </Typography>
          </Box>
        }
        secondary={alert.description}
        secondaryTypographyProps={{ variant: 'body2' }}
      />
    </ListItem>
  );
};
