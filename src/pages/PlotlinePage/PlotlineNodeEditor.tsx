/**
 * 剧情节点编辑器
 */
import React from 'react';
import {
  Card,
  CardContent,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import type { PlotlineNode } from '../../types/plotline';
import { usePlotlineStore } from '../../stores/plotlineStore';
import { EditableText } from '../../components/Common/EditableText';
import { TagInput } from '../../components/Common/TagInput';

interface PlotlineNodeEditorProps {
  node: PlotlineNode;
}

export const PlotlineNodeEditor: React.FC<PlotlineNodeEditorProps> = ({ node }) => {
  const updateNode = usePlotlineStore((s) => s.updatePlotlineNode);

  const handleUpdate = async (params: import('../../types/plotline').UpdatePlotlineNodeParams) => {
    await updateNode(node.id, params);
  };

  return (
    <Card sx={{ height: '100%', overflow: 'auto' }}>
      <CardContent sx={{ p: 3 }}>
        <EditableText
          value={node.title}
          onChange={(v) => handleUpdate({ title: v })}
          variant="h5"
          fontWeight={600}
          placeholder="输入节点标题..."
        />

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>内容</Typography>
          <TextField
            value={node.content}
            onChange={(e) => handleUpdate({ content: e.target.value })}
            multiline
            minRows={8}
            maxRows={20}
            fullWidth
            placeholder="输入剧情节点内容..."
            variant="outlined"
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>关联大纲节点</Typography>
          <TagInput
            tags={node.outlineNodeRefs}
            onChange={(tags) => handleUpdate({ outlineNodeRefs: tags })}
            placeholder="添加大纲节点ID"
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>关联人物</Typography>
          <TagInput
            tags={node.characterRefs}
            onChange={(tags) => handleUpdate({ characterRefs: tags })}
            placeholder="添加人物ID"
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>关联设定</Typography>
          <TagInput
            tags={node.settingRefs}
            onChange={(tags) => handleUpdate({ settingRefs: tags })}
            placeholder="添加设定ID"
          />
        </Box>

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            创建于 {new Date(node.createdAt).toLocaleString()} · 更新于 {new Date(node.updatedAt).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
