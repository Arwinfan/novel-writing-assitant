/**
 * 大纲节点编辑器
 */
import React from 'react';
import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import type { OutlineNode } from '../../types/outline';
import { OutlineNodeType, UpdateOutlineNodeParams } from '../../types/outline';
import { useOutlineStore } from '../../stores/outlineStore';
import { EditableText } from '../../components/Common/EditableText';
import { TagInput } from '../../components/Common/TagInput';
import { OUTLINE_NODE_TYPE_LABELS } from '../../utils/constants';

interface OutlineNodeEditorProps {
  node: OutlineNode;
}

export const OutlineNodeEditor: React.FC<OutlineNodeEditorProps> = ({ node }) => {
  const updateNode = useOutlineStore((s) => s.updateNode);

  const handleUpdate = async (params: UpdateOutlineNodeParams) => {
    await updateNode(node.id, params);
  };

  return (
    <Card sx={{ height: '100%', overflow: 'auto' }}>
      <CardContent sx={{ p: 3 }}>
        {/* 节点类型 */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>节点类型</InputLabel>
            <Select
              value={node.nodeType}
              label="节点类型"
              onChange={(e) => handleUpdate({ nodeType: e.target.value as OutlineNodeType })}
            >
              {Object.entries(OUTLINE_NODE_TYPE_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 标题 */}
        <EditableText
          value={node.title}
          onChange={(v) => handleUpdate({ title: v })}
          variant="h5"
          fontWeight={600}
          placeholder="输入标题..."
        />

        {/* 内容 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            内容
          </Typography>
          <TextField
            value={node.content}
            onChange={(e) => handleUpdate({ content: e.target.value })}
            multiline
            minRows={8}
            maxRows={20}
            fullWidth
            placeholder="输入大纲内容..."
            variant="outlined"
          />
        </Box>

        {/* 关联人物 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            关联人物
          </Typography>
          <TagInput
            tags={node.characterRefs}
            onChange={(tags) => handleUpdate({ characterRefs: tags })}
            placeholder="添加人物ID"
          />
        </Box>

        {/* 关联设定 */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            关联设定
          </Typography>
          <TagInput
            tags={node.settingRefs}
            onChange={(tags) => handleUpdate({ settingRefs: tags })}
            placeholder="添加设定ID"
          />
        </Box>

        {/* 关联剧情线 */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            关联剧情线
          </Typography>
          <TagInput
            tags={node.plotlineRefs}
            onChange={(tags) => handleUpdate({ plotlineRefs: tags })}
            placeholder="添加剧情线ID"
          />
        </Box>

        {/* 元信息 */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            创建于 {new Date(node.createdAt).toLocaleString()} · 更新于 {new Date(node.updatedAt).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
