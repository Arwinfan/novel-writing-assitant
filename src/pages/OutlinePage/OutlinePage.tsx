/**
 * 大纲管理页
 */
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import { Add as AddIcon, Folder as FolderIcon, AutoAwesome as AIIcon } from '@mui/icons-material';
import { useOutlineStore } from '../../stores/outlineStore';
import { OutlineNodeType } from '../../types/outline';
import { OutlineTree } from './OutlineTree';
import { OutlineNodeEditor } from './OutlineNodeEditor';
import { OutlineNodeDialog } from './OutlineNodeDialog';
import { EmptyState } from '../../components/Common/EmptyState';
import { AIGenerateDialog } from '../../components/AI/AIGenerateDialog';
import { aiGenerateService } from '../../services/aiGenerateService';

export const OutlinePage: React.FC = () => {
  const { nodes, selectedNodeId, loadNodes, createNode, selectNode } = useOutlineStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogParentId, setDialogParentId] = useState('');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    loadNodes();
  }, [loadNodes]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const handleAddRoot = () => {
    setDialogParentId('');
    setDialogOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    setDialogParentId(parentId);
    setDialogOpen(true);
  };

  const handleCreateNode = async (title: string, nodeType: OutlineNodeType, parentId: string) => {
    await createNode({ title, nodeType, parentId });
    setDialogOpen(false);
  };

  /** AI 生成大纲采纳处理 */
  const handleAIAdopt = async (content: string) => {
    setAiResult(content);
    const parsed = aiGenerateService.parseOutlineResult(content);
    if (parsed.length === 0) {
      setSnackbar({ open: true, message: 'AI 生成的格式无法解析，请手动创建', severity: 'error' });
      return;
    }

    try {
      // 按层级创建大纲节点
      const idMap: Record<number, string> = {}; // indent → parentId
      let count = 0;

      for (const item of parsed) {
        const nodeType = item.nodeType === 'VOLUME' ? OutlineNodeType.VOLUME
          : item.nodeType === 'CHAPTER' ? OutlineNodeType.CHAPTER
          : OutlineNodeType.SECTION;

        // 找父节点：indent-1 层级的最后一个节点
        const parentId = item.indent > 0 ? (idMap[item.indent - 1] ?? '') : '';

        const node = await createNode({
          title: item.title,
          nodeType,
          parentId,
          content: item.content,
        });
        idMap[item.indent] = node.id;
        count++;
      }

      setSnackbar({ open: true, message: `成功创建 ${count} 个大纲节点`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '创建失败：' + (err instanceof Error ? err.message : '未知错误'), severity: 'error' });
    }
  };

  const rootNodes = nodes
    .filter((n) => !n.parentId || n.parentId === '')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (nodes.length === 0) {
    return (
      <>
        <EmptyState
          icon={<FolderIcon />}
          title="还没有大纲节点"
          description="创建大纲节点来组织你的故事结构，支持卷/章/节多级嵌套"
          actionLabel="创建第一个大纲节点"
          onAction={handleAddRoot}
        />
        <Box sx={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)' }}>
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={() => setAiDialogOpen(true)}
            sx={{ borderColor: 'primary.main', color: 'primary.main' }}
          >
            AI 一键生成大纲
          </Button>
        </Box>
        <OutlineNodeDialog
          open={dialogOpen}
          parentId={dialogParentId}
          onConfirm={handleCreateNode}
          onCancel={() => setDialogOpen(false)}
        />
        <AIGenerateDialog
          open={aiDialogOpen}
          module="outline"
          moduleLabel="大纲"
          existingNames={nodes.map((n) => n.title)}
          existingContext={nodes.length > 0 ? ['已有大纲节点：', ...nodes.map((n) => `- ${n.title}${n.content ? `：${n.content.slice(0, 80)}` : ''}`)].join('\n') : undefined}
          onAdopt={handleAIAdopt}
          onClose={() => setAiDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      {/* 左侧树形列表 */}
      <Box sx={{ width: 320, flexShrink: 0, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1, p: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            大纲结构
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button size="small" startIcon={<AIIcon />} onClick={() => setAiDialogOpen(true)} color="secondary">
              AI生成
            </Button>
            <Button size="small" startIcon={<AddIcon />} onClick={handleAddRoot}>
              新增
            </Button>
          </Box>
        </Box>
        <OutlineTree
          nodes={nodes}
          selectedId={selectedNodeId}
          onSelect={selectNode}
          onAddChild={handleAddChild}
        />
      </Box>

      {/* 右侧编辑区 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {selectedNode ? (
          <OutlineNodeEditor node={selectedNode} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary">选择左侧节点进行编辑</Typography>
          </Box>
        )}
      </Box>

      <OutlineNodeDialog
        open={dialogOpen}
        parentId={dialogParentId}
        onConfirm={handleCreateNode}
        onCancel={() => setDialogOpen(false)}
      />

      <AIGenerateDialog
        open={aiDialogOpen}
        module="outline"
        moduleLabel="大纲"
        existingNames={nodes.map((n) => n.title)}
        existingContext={nodes.length > 0 ? ['已有大纲节点：', ...nodes.map((n) => `- ${n.title}${n.content ? `：${n.content.slice(0, 80)}` : ''}`)].join('\n') : undefined}
        onAdopt={handleAIAdopt}
        onClose={() => setAiDialogOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
