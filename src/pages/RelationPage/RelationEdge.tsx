/**
 * 自定义关系边 - 可点击编辑，显示关系类型
 */
import React, { useState, useRef, memo } from 'react';
import {
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from '@xyflow/react';
import type { Relation } from '../../types/relation';
import { Box, Popover, Button, TextField, Typography, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';

interface RelationEdgeData {
  relation: Relation;
  onEdit?: (relationId: string, relationType: string, description: string) => void;
  onDelete?: (relationId: string) => void;
  [key: string]: unknown;
}

/** 关系类型对应的颜色 */
const RELATION_COLORS: Record<string, string> = {
  '师徒': '#2e7d32',
  '师': '#2e7d32',
  '徒': '#2e7d32',
  '恋': '#d32f2f',
  '爱': '#d32f2f',
  '情': '#d32f2f',
  '敌': '#c62828',
  '对': '#c62828',
  '仇': '#c62828',
  '盟': '#1565c0',
  '友': '#1565c0',
  '亲': '#6a1b9a',
  '父': '#6a1b9a',
  '母': '#6a1b9a',
  '兄': '#6a1b9a',
  '弟': '#6a1b9a',
  '姐': '#6a1b9a',
  '妹': '#6a1b9a',
  '主': '#e65100',
  '仆': '#e65100',
  '暗恋': '#ad1457',
  '利用': '#4e342e',
  '竞争': '#f57f17',
};

function getRelationColor(type: string): string {
  for (const [key, color] of Object.entries(RELATION_COLORS)) {
    if (type.includes(key)) return color;
  }
  return '#666';
}

export const RelationEdge: React.FC<EdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  selected,
}) => {
  const edgeData = data as unknown as RelationEdgeData | undefined;
  const relation = edgeData?.relation;
  const color = relation ? getRelationColor(relation.relationType) : '#666';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const [editType, setEditType] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (relation) {
      setEditType(relation.relationType);
      setEditDesc(relation.description);
    }
    // 使用隐藏的 HTML div 作为锚点，避免 SVG g 元素定位异常
    if (menuAnchorRef.current) {
      setAnchorEl(menuAnchorRef.current);
    }
  };

  const handleSave = () => {
    if (relation && edgeData?.onEdit) {
      edgeData.onEdit(relation.id, editType, editDesc);
    }
    setAnchorEl(null);
  };

  const handleDelete = () => {
    if (edgeData?.onDelete) {
      edgeData.onDelete(id);
    }
    setAnchorEl(null);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: color,
          cursor: 'pointer',
        }}
      />

      {/* 关系标签 - 可点击 */}
      {relation?.relationType && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              cursor: 'pointer',
            }}
            className="nodrag nopan"
          >
            {/* 隐藏的 HTML 锚点，用于 Popover 定位 */}
            <div
              ref={menuAnchorRef}
              style={{ position: 'absolute', width: 1, height: 1, pointerEvents: 'none' }}
            />
            <Box
              onClick={handleLabelClick}
              sx={{
                px: 1,
                py: 0.2,
                borderRadius: 1,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: color,
                fontSize: '0.75rem',
                fontWeight: 500,
                color: color,
                whiteSpace: 'nowrap',
                boxShadow: 1,
                '&:hover': {
                  bgcolor: 'grey.100',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.15s',
              }}
            >
              {relation.relationType}
            </Box>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* 编辑弹窗 */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box sx={{ p: 2, minWidth: 240 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            编辑关系
          </Typography>
          <TextField
            label="关系类型"
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            size="small"
            fullWidth
            sx={{ mb: 1 }}
            placeholder="如：师徒、恋人、敌对..."
          />
          <TextField
            label="关系描述"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 1 }}
            placeholder="描述这段关系的细节..."
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
              删除
            </Button>
            <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={!editType}>
              保存
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
});

RelationEdge.displayName = 'RelationEdge';
