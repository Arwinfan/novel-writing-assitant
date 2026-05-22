/**
 * 新增/编辑人物弹窗
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

interface CharacterDialogProps {
  open: boolean;
  onConfirm: (name: string, alias: string) => void;
  onCancel: () => void;
}

export const CharacterDialog: React.FC<CharacterDialogProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onConfirm(name.trim(), alias.trim());
    setName('');
    setAlias('');
  };

  const handleCancel = () => {
    setName('');
    setAlias('');
    onCancel();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>新增人物</DialogTitle>
      <DialogContent>
        <TextField
          value={name}
          onChange={(e) => setName(e.target.value)}
          label="姓名"
          fullWidth
          variant="outlined"
          autoFocus
          sx={{ mt: 1, mb: 2 }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />
        <TextField
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          label="别名/绰号"
          fullWidth
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>取消</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!name.trim()}>
          创建
        </Button>
      </DialogActions>
    </Dialog>
  );
};
