/**
 * 新增/编辑剧情节点弹窗
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';

interface PlotlineNodeDialogProps {
  open: boolean;
  onConfirm: (title: string) => void;
  onCancel: () => void;
}

export const PlotlineNodeDialog: React.FC<PlotlineNodeDialogProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onConfirm(title.trim());
    setTitle('');
  };

  const handleCancel = () => {
    setTitle('');
    onCancel();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>新增剧情节点</DialogTitle>
      <DialogContent>
        <TextField
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          label="节点标题"
          fullWidth
          variant="outlined"
          autoFocus
          sx={{ mt: 1 }}
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
