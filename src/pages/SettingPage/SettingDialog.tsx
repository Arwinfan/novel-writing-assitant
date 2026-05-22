/**
 * 新增/编辑设定弹窗
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

interface SettingDialogProps {
  open: boolean;
  isItem?: boolean;
  onConfirm: (name: string, icon: string, itemName?: string) => Promise<void>;
  onCancel: () => void;
}

export const SettingDialog: React.FC<SettingDialogProps> = ({
  open,
  isItem = false,
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [itemName, setItemName] = useState('');

  const handleSubmit = () => {
    if (isItem) {
      if (!itemName.trim()) return;
      onConfirm(name, icon, itemName.trim());
    } else {
      if (!name.trim()) return;
      onConfirm(name.trim(), icon || '📁');
    }
    setName('');
    setIcon('📁');
    setItemName('');
  };

  const handleCancel = () => {
    setName('');
    setIcon('📁');
    setItemName('');
    onCancel();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{isItem ? '新增设定项' : '新增设定分类'}</DialogTitle>
      <DialogContent>
        {!isItem ? (
          <>
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              label="分类名称"
              fullWidth
              variant="outlined"
              autoFocus
              sx={{ mt: 1, mb: 2 }}
            />
            <TextField
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              label="图标（Emoji）"
              fullWidth
              variant="outlined"
              placeholder="📁"
            />
          </>
        ) : (
          <TextField
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            label="设定项名称"
            fullWidth
            variant="outlined"
            autoFocus
            sx={{ mt: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>取消</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isItem ? !itemName.trim() : !name.trim()}
        >
          创建
        </Button>
      </DialogActions>
    </Dialog>
  );
};
