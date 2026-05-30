/**
 * 剧情线列表组件（支持多选）
 */
import React, { useState } from 'react';
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
  Checkbox,
  Tooltip,
  Fade,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, SelectAll as SelectAllIcon, Close as CloseIcon } from '@mui/icons-material';
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
  onBatchDelete?: (ids: string[]) => void;
}

export const PlotlineList: React.FC<PlotlineListProps> = ({
  plotlines,
  selectedId,
  onSelect,
  nodes,
  onNodeSelect,
  onAddNode,
  onBatchDelete,
}) => {
  const deletePlotline = usePlotlineStore((s) => s.deletePlotline);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  // 多选
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(plotlines.map((p) => p.id)));
  const clearSelection = () => { setSelectedIds(new Set()); setSelectionMode(false); };
  const enterSelectionMode = () => setSelectionMode(true);

  const handleBatchDelete = () => {
    if (selectedIds.size > 0) setBatchDeleteOpen(true);
  };

  const confirmBatchDelete = async () => {
    if (onBatchDelete) {
      onBatchDelete(Array.from(selectedIds));
    } else {
      for (const id of selectedIds) {
        await deletePlotline(id);
      }
    }
    setSelectedIds(new Set());
    setSelectionMode(false);
    setBatchDeleteOpen(false);
  };

  return (
    <>
      {/* 多选工具栏 */}
      {selectionMode && (
        <Fade in>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.5,
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            borderRadius: 1,
            mb: 0.5,
          }}>
            <Checkbox
              size="small"
              checked={selectedIds.size === plotlines.length && plotlines.length > 0}
              indeterminate={selectedIds.size > 0 && selectedIds.size < plotlines.length}
              onChange={() => selectedIds.size === plotlines.length ? setSelectedIds(new Set()) : selectAll()}
              sx={{ color: 'primary.contrastText', p: 0.3 }}
            />
            <Typography variant="body2" fontWeight={600} sx={{ mr: 'auto' }}>
              已选 {selectedIds.size}/{plotlines.length}
            </Typography>
            <IconButton size="small" onClick={handleBatchDelete} disabled={selectedIds.size === 0}
              sx={{ color: selectedIds.size > 0 ? 'error.main' : 'primary.contrastText' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={clearSelection} sx={{ color: 'primary.contrastText' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Fade>
      )}

      {!selectionMode && plotlines.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
          <Tooltip title="多选模式">
            <IconButton size="small" onClick={enterSelectionMode}>
              <SelectAllIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <List dense>
        {plotlines.map((pl) => {
          const plNodes = nodes.filter((n) => n.plotlineId === pl.id).sort((a, b) => a.sortOrder - b.sortOrder);
          const isSelected = selectedId === pl.id;
          const isChecked = selectedIds.has(pl.id);

          return (
            <Box key={pl.id}>
              <ListItem
                disablePadding
                secondaryAction={!selectionMode ? (
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(pl.id); }}>
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                ) : undefined}
              >
                <ListItemButton
                  selected={isSelected}
                  onClick={() => selectionMode ? toggleSelect(pl.id) : onSelect(pl.id)}
                  sx={{ borderRadius: 1 }}
                >
                  {selectionMode && (
                    <Checkbox
                      size="small"
                      checked={isChecked}
                      onClick={(e) => { e.stopPropagation(); toggleSelect(pl.id); }}
                      sx={{ mr: 0.5, p: 0.3 }}
                    />
                  )}
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

              {isSelected && !selectionMode && (
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

      <ConfirmDialog
        open={batchDeleteOpen}
        title="批量删除剧情线"
        message={`确定要删除选中的 ${selectedIds.size} 条剧情线及其所有节点吗？此操作不可撤销。`}
        confirmColor="error"
        confirmLabel="删除"
        onConfirm={confirmBatchDelete}
        onCancel={() => setBatchDeleteOpen(false)}
      />
    </>
  );
};
