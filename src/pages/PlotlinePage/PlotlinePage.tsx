/**
 * 剧情线管理页
 */
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import { Add as AddIcon, Timeline as TimelineIcon, AutoAwesome as AIIcon } from '@mui/icons-material';
import { usePlotlineStore } from '../../stores/plotlineStore';
import { PlotlineType } from '../../types/plotline';
import { PlotlineList } from './PlotlineList';
import { PlotlineNodeEditor } from './PlotlineNodeEditor';
import { PlotlineNodeDialog } from './PlotlineNodeDialog';
import { EmptyState } from '../../components/Common/EmptyState';
import { AIGenerateDialog } from '../../components/AI/AIGenerateDialog';
import { aiGenerateService } from '../../services/aiGenerateService';
import { DEFAULT_PLOTLINE_COLORS, PLOTLINE_TYPE_LABELS } from '../../utils/constants';
import { generateId } from '../../utils/id';

export const PlotlinePage: React.FC = () => {
  const {
    plotlines, plotlineNodes, selectedPlotlineId, selectedNodeId,
    loadPlotlines, createPlotline, selectPlotline, selectNode, createPlotlineNode,
  } = usePlotlineStore();
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiModule, setAiModule] = useState<'plotline'>('plotline');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    loadPlotlines();
  }, [loadPlotlines]);

  const selectedPlotline = plotlines.find((p) => p.id === selectedPlotlineId);
  const selectedNode = plotlineNodes.find((n) => n.id === selectedNodeId);
  const currentNodes = selectedPlotlineId
    ? plotlineNodes.filter((n) => n.plotlineId === selectedPlotlineId).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const handleCreatePlotline = async (type: PlotlineType) => {
    const colorIndex = plotlines.length % DEFAULT_PLOTLINE_COLORS.length;
    await createPlotline({
      lineType: type,
      name: `${PLOTLINE_TYPE_LABELS[type]}${plotlines.filter((p) => p.lineType === type).length + 1}`,
      color: DEFAULT_PLOTLINE_COLORS[colorIndex],
    });
  };

  const handleAddNode = () => {
    if (selectedPlotlineId) {
      setNodeDialogOpen(true);
    }
  };

  const handleCreateNode = async (title: string) => {
    if (selectedPlotlineId) {
      await createPlotlineNode({ plotlineId: selectedPlotlineId, title });
      setNodeDialogOpen(false);
    }
  };

  /** AI 生成剧情节点采纳 */
  const handleAIAdopt = async (content: string) => {
    const parsed = aiGenerateService.parsePlotlineResult(content);
    if (parsed.length === 0) {
      setSnackbar({ open: true, message: 'AI 生成的格式无法解析，请手动创建', severity: 'error' });
      return;
    }

    // 如果没有选中的剧情线，先创建一条
    let plotlineId = selectedPlotlineId;
    if (!plotlineId) {
      const colorIndex = plotlines.length % DEFAULT_PLOTLINE_COLORS.length;
      const plotline = await createPlotline({
        lineType: PlotlineType.MAIN,
        name: `AI生成主线`,
        color: DEFAULT_PLOTLINE_COLORS[colorIndex],
      });
      plotlineId = plotline.id;
    }

    try {
      let count = 0;
      for (const item of parsed) {
        await createPlotlineNode({
          plotlineId: plotlineId!,
          title: item.title,
          content: item.content,
        });
        count++;
      }
      setSnackbar({ open: true, message: `成功创建 ${count} 个剧情节点`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '创建失败：' + (err instanceof Error ? err.message : '未知错误'), severity: 'error' });
    }
  };

  if (plotlines.length === 0) {
    return (
      <>
        <EmptyState
          icon={<TimelineIcon />}
          title="还没有剧情线"
          description="创建主线和支线来追踪故事的发展脉络"
          actionLabel="创建主线"
          onAction={() => handleCreatePlotline(PlotlineType.MAIN)}
        />
        <Box sx={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={() => setAiDialogOpen(true)}
            sx={{ borderColor: 'primary.main', color: 'primary.main' }}
          >
            AI 一键生成剧情
          </Button>
        </Box>
        <AIGenerateDialog
          open={aiDialogOpen}
          module="plotline"
          moduleLabel="剧情线"
          existingNames={plotlineNodes.map((n) => n.title)}
          existingContext={[
            '已有剧情线：',
            ...plotlines.map((p) => `- ${p.name}（${p.lineType === PlotlineType.MAIN ? '主线' : '支线'}）${p.description ? `：${p.description}` : ''}`),
            plotlineNodes.length > 0 ? '\n已有剧情节点：' : '',
            ...plotlineNodes.map((n) => `- ${n.title}${n.content ? `：${n.content.slice(0, 80)}` : ''}`),
          ].filter(Boolean).join('\n')}
          onAdopt={handleAIAdopt}
          onClose={() => setAiDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      {/* 左侧剧情线列表 */}
      <Box sx={{ width: 280, flexShrink: 0, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1, p: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">剧情线</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button size="small" startIcon={<AIIcon />} onClick={() => setAiDialogOpen(true)} color="secondary">
              AI
            </Button>
            <Button size="small" onClick={() => handleCreatePlotline(PlotlineType.MAIN)}>+ 主线</Button>
            <Button size="small" onClick={() => handleCreatePlotline(PlotlineType.SUB)}>+ 支线</Button>
          </Box>
        </Box>
        <PlotlineList
          plotlines={plotlines}
          selectedId={selectedPlotlineId}
          onSelect={selectPlotline}
          nodes={plotlineNodes}
          onNodeSelect={(nodeId) => { selectNode(nodeId); }}
          onAddNode={handleAddNode}
        />
      </Box>

      {/* 右侧编辑区 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {selectedNode ? (
          <PlotlineNodeEditor node={selectedNode} />
        ) : selectedPlotline ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              选择一个剧情节点进行编辑
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddNode}>
                添加剧情节点
              </Button>
              <Button variant="outlined" startIcon={<AIIcon />} onClick={() => setAiDialogOpen(true)} color="secondary">
                AI生成节点
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary">选择左侧剧情线</Typography>
          </Box>
        )}
      </Box>

      <PlotlineNodeDialog
        open={nodeDialogOpen}
        onConfirm={handleCreateNode}
        onCancel={() => setNodeDialogOpen(false)}
      />

      <AIGenerateDialog
        open={aiDialogOpen}
        module="plotline"
        moduleLabel="剧情线"
        existingNames={plotlineNodes.map((n) => n.title)}
        existingContext={[
          '已有剧情线：',
          ...plotlines.map((p) => `- ${p.name}（${p.lineType === PlotlineType.MAIN ? '主线' : '支线'}）${p.description ? `：${p.description}` : ''}`),
          plotlineNodes.length > 0 ? '\n已有剧情节点：' : '',
          ...plotlineNodes.map((n) => `- ${n.title}${n.content ? `：${n.content.slice(0, 80)}` : ''}`),
        ].filter(Boolean).join('\n')}
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
