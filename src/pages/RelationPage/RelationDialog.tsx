/**
 * 新增/编辑关系弹窗
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
} from '@mui/material';
import type { Character } from '../../types/character';

interface RelationDialogProps {
  open: boolean;
  characters: Character[];
  defaultSourceId?: string;
  onConfirm: (sourceId: string, targetId: string, relationType: string, description: string) => Promise<void>;
  onCancel: () => void;
}

/** 常用关系类型 */
const COMMON_RELATION_TYPES = [
  '师徒', '朋友', '恋人', '敌对', '盟友',
  '主仆', '亲缘', '暗恋', '利用', '竞争',
  '同门', '搭档', '邻居', '上司', '下属',
  '宿敌', '知己', '搭档', '夫妻', '兄弟姐妹',
];

export const RelationDialog: React.FC<RelationDialogProps> = ({
  open,
  characters,
  defaultSourceId,
  onConfirm,
  onCancel,
}) => {
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relationType, setRelationType] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (defaultSourceId) {
      setSourceId(defaultSourceId);
    }
  }, [defaultSourceId]);

  const handleSubmit = async () => {
    if (!sourceId || !targetId || !relationType) return;
    await onConfirm(sourceId, targetId, relationType, description.trim());
    resetForm();
  };

  const resetForm = () => {
    setSourceId('');
    setTargetId('');
    setRelationType('');
    setDescription('');
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>添加人物关系</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
          <InputLabel>人物A</InputLabel>
          <Select value={sourceId} label="人物A" onChange={(e) => setSourceId(e.target.value)}>
            {characters.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}{c.alias ? ` (${c.alias})` : ''}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>人物B</InputLabel>
          <Select value={targetId} label="人物B" onChange={(e) => setTargetId(e.target.value)}>
            {characters.filter((c) => c.id !== sourceId).map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}{c.alias ? ` (${c.alias})` : ''}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          value={relationType}
          onChange={(e) => setRelationType(e.target.value)}
          label="关系类型"
          fullWidth
          variant="outlined"
          sx={{ mb: 1 }}
          placeholder="如：师徒、朋友、敌对..."
        />

        {/* 快速选择常用关系类型 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {COMMON_RELATION_TYPES.map((type) => (
            <Chip
              key={type}
              label={type}
              size="small"
              variant={relationType === type ? 'filled' : 'outlined'}
              color={relationType === type ? 'primary' : 'default'}
              onClick={() => setRelationType(type)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>

        <TextField
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          label="关系描述"
          fullWidth
          variant="outlined"
          multiline
          rows={2}
          placeholder="描述这段关系的细节..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>取消</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!sourceId || !targetId || !relationType}
        >
          创建
        </Button>
      </DialogActions>
    </Dialog>
  );
};
