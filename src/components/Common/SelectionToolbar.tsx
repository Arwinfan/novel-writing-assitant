/**
 * 多选操作工具栏
 * 当有选中项时显示，提供全选/取消、批量删除等操作
 */
import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Checkbox,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  SelectAll as SelectAllIcon,
  Deselect as DeselectIcon,
} from '@mui/icons-material';

interface SelectionToolbarProps {
  /** 选中的数量 */
  selectedCount: number;
  /** 总数量 */
  totalCount: number;
  /** 取消选择 */
  onClearSelection: () => void;
  /** 全选 */
  onSelectAll: () => void;
  /** 批量删除 */
  onDelete: () => void;
  /** 额外操作按钮 */
  extraActions?: React.ReactNode;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onDelete,
  extraActions,
}) => {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <Fade in={selectedCount > 0}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.5,
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          borderRadius: 1,
          mb: 0.5,
        }}
      >
        <Checkbox
          size="small"
          checked={allSelected}
          indeterminate={!allSelected && selectedCount > 0}
          onChange={() => allSelected ? onClearSelection() : onSelectAll()}
          sx={{
            color: 'primary.contrastText',
            '&.Mui-checked': { color: 'primary.contrastText' },
            '&.MuiCheckbox-indeterminate': { color: 'primary.contrastText' },
            p: 0.5,
          }}
        />
        <Typography variant="body2" fontWeight={600} sx={{ mr: 'auto' }}>
          已选 {selectedCount}/{totalCount}
        </Typography>

        {extraActions}

        <Tooltip title={allSelected ? '取消全选' : '全选'}>
          <IconButton size="small" onClick={allSelected ? onClearSelection : onSelectAll}
            sx={{ color: 'primary.contrastText' }}
          >
            {allSelected ? <DeselectIcon fontSize="small" /> : <SelectAllIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title="批量删除">
          <IconButton size="small" onClick={onDelete}
            sx={{ color: 'error.contrastText', '&:hover': { bgcolor: 'error.dark' } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="取消选择">
          <IconButton size="small" onClick={onClearSelection}
            sx={{ color: 'primary.contrastText' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Fade>
  );
};
