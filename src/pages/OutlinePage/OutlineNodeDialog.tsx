/**
 * 新增/编辑大纲节点弹窗
 */
import React, { useState } from 'react';
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
} from '@mui/material';
import { OutlineNodeType } from '../../types/outline';
import { OUTLINE_NODE_TYPE_LABELS } from '../../utils/constants';

interface OutlineNodeDialogProps {
  open: boolean;
  parentId: string;
  onConfirm: (title: string, nodeType: OutlineNodeType, parentId: string) => void;
  onCancel: () => void;
}

export const OutlineNodeDialog: React.FC<OutlineNodeDialogProps> = ({
  open,
  parentId,
  onConfirm,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [nodeType, setNodeType] = useState<OutlineNodeType>(OutlineNodeType.CHAPTER);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onConfirm(title.trim(), nodeType, parentId);
    setTitle('');
    setNodeType(OutlineNodeType.CHAPTER);
  };

  const handleCancel = () => {
    setTitle('');
    setNodeType(OutlineNodeType.CHAPTER);
    onCancel();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>新增大纲节点</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
          <InputLabel>节点类型</InputLabel>
          <Select value={nodeType} label="节点类型" onChange={(e) => setNodeType(e.target.value as OutlineNodeType)}>
            {Object.entries(OUTLINE_NODE_TYPE_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          label="标题"
          fullWidth
          variant="outlined"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>取消</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!title.trim()}>
          创建
        </Button>
      </DialogActions>
    </Dialog>
  );
};
