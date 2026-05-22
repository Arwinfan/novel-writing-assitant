/**
 * 自定义人物节点 - 支持右键菜单和拖拽
 */
import React, { useState, useRef, memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Box, Typography, Paper, Popover, Button, IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, PersonAdd as AddRelIcon } from '@mui/icons-material';
import type { Character } from '../../types/character';

interface CharacterNodeData {
  character: Character;
  onEdit?: (character: Character) => void;
  onDelete?: (characterId: string) => void;
  onAddRelation?: (characterId: string) => void;
  [key: string]: unknown;
}

export const CharacterNode: React.FC<NodeProps> = memo(({ data }) => {
  const charData = data as unknown as CharacterNodeData;
  const character = charData.character;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuAnchorRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // 使用专门的隐藏 HTML div 作为锚点，避免 SVG 元素定位问题
    if (menuAnchorRef.current) {
      setAnchorEl(menuAnchorRef.current);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    charData.onEdit?.(character);
    handleClose();
  };

  const handleDelete = () => {
    charData.onDelete?.(character.id);
    handleClose();
  };

  const handleAddRelation = () => {
    charData.onAddRelation?.(character.id);
    handleClose();
  };

  return (
    <>
      {/* 隐藏的 HTML 元素作为 Popover 锚点，避免 SVG g 元素定位异常 */}
      <div
        ref={menuAnchorRef}
        style={{ position: 'absolute', width: 1, height: 1, pointerEvents: 'none' }}
      />

      <Paper
        elevation={3}
        onContextMenu={handleContextMenu}
        sx={{
          px: 2,
          py: 1,
          minWidth: 90,
          textAlign: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: 2,
          cursor: 'grab',
          transition: 'box-shadow 0.2s',
          '&:hover': {
            boxShadow: 6,
            bgcolor: 'primary.dark',
          },
        }}
      >
        <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', lineHeight: 1.2 }}>
          {character.name}
        </Typography>
        {character.alias && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {character.alias}
          </Typography>
        )}
        {character.faction && (
          <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', mt: 0.3 }}>
            {character.faction}
          </Typography>
        )}
        <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
      </Paper>

      {/* 右键菜单 */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 120 }}>
          <Button size="small" startIcon={<EditIcon />} onClick={handleEdit} sx={{ justifyContent: 'flex-start' }}>
            编辑人物
          </Button>
          <Button size="small" startIcon={<AddRelIcon />} onClick={handleAddRelation} sx={{ justifyContent: 'flex-start' }}>
            添加关系
          </Button>
          <Button size="small" startIcon={<DeleteIcon />} onClick={handleDelete} color="error" sx={{ justifyContent: 'flex-start' }}>
            删除人物
          </Button>
        </Box>
      </Popover>
    </>
  );
});

CharacterNode.displayName = 'CharacterNode';
