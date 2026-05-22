/**
 * 大纲树组件
 * 使用自定义递归列表实现（MUI 6 核心不含 TreeView）
 */
import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { OutlineNode } from '../../types/outline';
import { OUTLINE_NODE_TYPE_LABELS } from '../../utils/constants';
import { useOutlineStore } from '../../stores/outlineStore';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';

interface OutlineTreeProps {
  nodes: OutlineNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddChild: (parentId: string) => void;
}

export const OutlineTree: React.FC<OutlineTreeProps> = ({
  nodes,
  selectedId,
  onSelect,
  onAddChild,
}) => {
  const deleteNode = useOutlineStore((s) => s.deleteNode);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const getChildren = (parentId: string): OutlineNode[] => {
    return nodes
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const rootNodes = nodes
    .filter((n) => !n.parentId || n.parentId === '')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteNode(deleteTarget);
    }
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  const renderNode = (node: OutlineNode, depth: number = 0): React.ReactNode => {
    const children = getChildren(node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;
    const nodeLabel = OUTLINE_NODE_TYPE_LABELS[node.nodeType] ?? node.nodeType;

    return (
      <Box key={node.id}>
        <Box sx={{ display: 'flex', alignItems: 'center', pl: depth * 2 }}>
          <IconButton size="small" onClick={() => hasChildren && toggleExpand(node.id)} sx={{ visibility: hasChildren ? 'visible' : 'hidden' }}>
            {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
          </IconButton>
          <ListItemButton
            selected={isSelected}
            onClick={() => onSelect(node.id)}
            sx={{ borderRadius: 1, flexGrow: 1, py: 0.3 }}
            dense
          >
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.7rem', mr: 0.5 }}>
              {nodeLabel}
            </Typography>
            <ListItemText primary={node.title} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItemButton>
          <IconButton size="small" onClick={() => onAddChild(node.id)}>
            <AddIcon sx={{ fontSize: 14 }} />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(node.id)}>
            <DeleteIcon sx={{ fontSize: 14 }} color="error" />
          </IconButton>
        </Box>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List disablePadding>
              {children.map((child) => renderNode(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <>
      <List dense disablePadding>
        {rootNodes.map((node) => renderNode(node))}
      </List>

      <ConfirmDialog
        open={confirmOpen}
        title="删除大纲节点"
        message="确定要删除此节点及其所有子节点吗？此操作不可撤销。"
        confirmColor="error"
        confirmLabel="删除"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setDeleteTarget(null); }}
      />
    </>
  );
};
