/**
 * 剧情线列表组件
 */
import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Typography,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import type { Plotline, PlotlineNode } from '../../types/plotline';
import { PLOTLINE_TYPE_LABELS } from '../../utils/constants';
import { usePlotlineStore } from '../../stores/plotlineStore';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';

interface PlotlineListProps {
  plotlines: Plotline[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  nodes: PlotlineNode[];
  onNodeSelect: (nodeId: string) => void;
  onAddNode: () => void;
}

export const PlotlineList: React.FC<PlotlineListProps> = ({
  plotlines,
  selectedId,
  onSelect,
  nodes,
  onNodeSelect,
  onAddNode,
}) => {
  const deletePlotline = usePlotlineStore((s) => s.deletePlotline);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deletePlotline(deleteTarget);
    }
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  return (
    <>
      <List dense>
        {plotlines.map((pl) => {
          const plNodes = nodes.filter((n) => n.plotlineId === pl.id).sort((a, b) => a.sortOrder - b.sortOrder);
          const isSelected = selectedId === pl.id;

          return (
            <Box key={pl.id}>
              <ListItem
                disablePadding
                secondaryAction={
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(pl.id); }}>
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                }
              >
                <ListItemButton
                  selected={isSelected}
                  onClick={() => onSelect(pl.id)}
                  sx={{ borderRadius: 1 }}
                >
                  <Box sx={{ width: 4, height: 24, borderRadius: 2, bgcolor: pl.color, mr: 1.5 }} />
                  <ListItemText
                    primary={pl.name}
                    secondary={
                      <Chip
                        label={PLOTLINE_TYPE_LABELS[pl.lineType]}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    }
                  />
                </ListItemButton>
              </ListItem>

              {isSelected && (
                <Box sx={{ pl: 3, mb: 1 }}>
                  {plNodes.map((node) => (
                    <ListItem key={node.id} disablePadding>
                      <ListItemButton
                        sx={{ py: 0.5, borderRadius: 1 }}
                        onClick={() => onNodeSelect(node.id)}
                      >
                        <ListItemText primary={node.title} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  <ListItem disablePadding>
                    <ListItemButton sx={{ py: 0.5 }} onClick={onAddNode}>
                      <AddIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      <Typography variant="caption" color="primary">添加节点</Typography>
                    </ListItemButton>
                  </ListItem>
                </Box>
              )}
              <Divider />
            </Box>
          );
        })}
      </List>

      <ConfirmDialog
        open={confirmOpen}
        title="删除剧情线"
        message="确定要删除此剧情线及其所有节点吗？"
        confirmColor="error"
        confirmLabel="删除"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setDeleteTarget(null); }}
      />
    </>
  );
};
