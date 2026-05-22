/**
 * 设定分类列表
 */
import React from 'react';
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
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
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
}

export const SettingCategoryList: React.FC<SettingCategoryListProps> = ({
  categories,
  items,
  selectedCategoryId,
  onSelectCategory,
  onSelectItem,
  onAddItem,
}) => {
  const deleteCategory = useSettingStore((s) => s.deleteCategory);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

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

  return (
    <>
      <List dense>
        {categories.sort((a, b) => a.sortOrder - b.sortOrder).map((cat) => {
          const catItems = items.filter((i) => i.categoryId === cat.id);
          const isSelected = selectedCategoryId === cat.id;

          return (
            <Box key={cat.id}>
              <ListItem
                disablePadding
                secondaryAction={
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }}>
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                }
              >
                <ListItemButton selected={isSelected} onClick={() => onSelectCategory(cat.id)} sx={{ borderRadius: 1 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                  </ListItemIcon>
                  <ListItemText
                    primary={cat.name}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItemButton>
              </ListItem>

              {isSelected && (
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
    </>
  );
};
