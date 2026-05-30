/**
 * 角色卡片网格列表（支持多选）
 */
import React, { useState } from 'react';
import {
  Box,
  Checkbox,
  IconButton,
  Tooltip,
  Typography,
  Fade,
} from '@mui/material';
import {
  SelectAll as SelectAllIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import type { Character } from '../../types/character';
import { CharacterCard } from './CharacterCard';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';

interface CharacterCardListProps {
  characters: Character[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onBatchDelete?: (ids: string[]) => void;
}

export const CharacterCardList: React.FC<CharacterCardListProps> = ({
  characters,
  selectedId,
  onSelect,
  onBatchDelete,
}) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(characters.map((c) => c.id)));
  const clearSelection = () => { setSelectedIds(new Set()); setSelectionMode(false); };
  const enterSelectionMode = () => setSelectionMode(true);

  const handleBatchDelete = () => {
    if (selectedIds.size > 0) setBatchDeleteOpen(true);
  };

  const confirmBatchDelete = () => {
    if (onBatchDelete) onBatchDelete(Array.from(selectedIds));
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
            mb: 1,
          }}>
            <Checkbox
              size="small"
              checked={selectedIds.size === characters.length && characters.length > 0}
              indeterminate={selectedIds.size > 0 && selectedIds.size < characters.length}
              onChange={() => selectedIds.size === characters.length ? setSelectedIds(new Set()) : selectAll()}
              sx={{ color: 'primary.contrastText', p: 0.3 }}
            />
            <Typography variant="body2" fontWeight={600} sx={{ mr: 'auto' }}>
              已选 {selectedIds.size}/{characters.length}
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

      {!selectionMode && characters.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
          <Tooltip title="多选模式">
            <IconButton size="small" onClick={enterSelectionMode}>
              <SelectAllIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {characters.map((char) => (
          <Box key={char.id} sx={{ display: 'flex', alignItems: 'center' }}>
            {selectionMode && (
              <Checkbox
                size="small"
                checked={selectedIds.has(char.id)}
                onClick={(e) => { e.stopPropagation(); toggleSelect(char.id); }}
                sx={{ mr: 0.5, p: 0.3 }}
              />
            )}
            <Box sx={{ flexGrow: 1 }}>
              <CharacterCard
                character={char}
                selected={!selectionMode && char.id === selectedId}
                onSelect={() => selectionMode ? toggleSelect(char.id) : onSelect(char.id)}
              />
            </Box>
          </Box>
        ))}
      </Box>

      <ConfirmDialog
        open={batchDeleteOpen}
        title="批量删除角色"
        message={`确定要删除选中的 ${selectedIds.size} 个角色吗？此操作不可撤销。`}
        confirmColor="error"
        confirmLabel="删除"
        onConfirm={confirmBatchDelete}
        onCancel={() => setBatchDeleteOpen(false)}
      />
    </>
  );
};
