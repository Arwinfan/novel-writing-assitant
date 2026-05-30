/**
 * 设定分类列表（支持多选）
 */
import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Divider,
  Box,
  Checkbox,
  Tooltip,
  Fade,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, SelectAll as SelectAllIcon, Close as CloseIcon } from '@mui/icons-material';
import type { SettingCategory, SettingItem } from '../../types/setting';
import { useSettingStore } from '../../stores/settingStore';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';

interface SettingCategoryListProps {
  categories: SettingCategory[];
  items: SettingItem[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onSelectItem: (id: string) => void;
  onAddItem: () => void;
  onBatchDelete?: (ids: string[]) => void;
}

export const SettingCategoryList: React.FC<SettingCategoryListProps> = ({
  categories,
  items,
  selectedCategoryId,
  onSelectCategory,
  onSelectItem,
  onAddItem,
  onBatchDelete,
}) => {
  const deleteCategory = useSettingStore((s) => s.deleteCategory);
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
      await deleteCategory(deleteTarget);
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

  const selectAll = () => setSelectedIds(new Set(categories.map((c) => c.id)));
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
        await deleteCategory(id);
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
              checked={selectedIds.size === categories.length && categories.length > 0}
              indeterminate={selectedIds.size > 0 && selectedIds.size < categories.length}
              onChange={() => selectedIds.size === categories.length ? setSelectedIds(new Set()) : selectAll()}
              sx={{ color: 'primary.contrastText', p: 0.3 }}
            />
            <Typography variant="body2" fontWeight={600} sx={{ mr: 'auto' }}>
              已选 {selectedIds.size}/{categories.length}
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

      {!selectionMode && categories.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
          <Tooltip title="多选模式">
            <IconButton size="small" onClick={enterSelectionMode}>
              <SelectAllIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <List dense>
        {categories.sort((a, b) => a.sortOrder - b.sortOrder).map((cat) => {
          const catItems = items.filter((i) => i.categoryId === cat.id);
          const isSelected = selectedCategoryId === cat.id;
          const isChecked = selectedIds.has(cat.id);

          return (
            <Box key={cat.id}>
              <ListItem
                disablePadding
                secondaryAction={!selectionMode ? (
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }}>
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                ) : undefined}
              >
                <ListItemButton
                  selected={isSelected}
                  onClick={() => selectionMode ? toggleSelect(cat.id) : onSelectCategory(cat.id)}
                  sx={{ borderRadius: 1 }}
                >
                  {selectionMode && (
                    <Checkbox
                      size="small"
                      checked={isChecked}
                      onClick={(e) => { e.stopPropagation(); toggleSelect(cat.id); }}
                      sx={{ mr: 0.5, p: 0.3 }}
                    />
                  )}
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                  </ListItemIcon>
                  <ListItemText
                    primary={cat.name}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItemButton>
              </ListItem>

              {isSelected && !selectionMode && (
                <Box sx={{ pl: 3, mb: 0.5 }}>
                  {catItems.map((item) => (
                    <ListItem key={item.id} disablePadding>
                      <ListItemButton sx={{ py: 0.3, borderRadius: 1 }} onClick={() => onSelectItem(item.id)}>
                        <ListItemText primary={item.name} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  <ListItem disablePadding>
                    <ListItemButton sx={{ py: 0.3 }} onClick={onAddItem}>
                      <AddIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      <Typography variant="caption" color="primary">添加设定项</Typography>
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
        title="删除分类"
        message="确定要删除此分类及其所有设定项吗？"
        confirmColor="error"
        confirmLabel="删除"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setDeleteTarget(null); }}
      />

      <ConfirmDialog
        open={batchDeleteOpen}
        title="批量删除分类"
        message={`确定要删除选中的 ${selectedIds.size} 个分类及其所有设定项吗？此操作不可撤销。`}
        confirmColor="error"
        confirmLabel="删除"
        onConfirm={confirmBatchDelete}
        onCancel={() => setBatchDeleteOpen(false)}
      />
    </>
  );
};
