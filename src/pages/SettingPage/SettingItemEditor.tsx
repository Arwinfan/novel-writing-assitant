/**
 * 设定项编辑器
 */
import React from 'react';
import {
  Card,
  CardContent,
  TextField,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import type { SettingItem } from '../../types/setting';
import { useSettingStore } from '../../stores/settingStore';
import { EditableText } from '../../components/Common/EditableText';
import { TagInput } from '../../components/Common/TagInput';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';

interface SettingItemEditorProps {
  item: SettingItem;
}

export const SettingItemEditor: React.FC<SettingItemEditorProps> = ({ item }) => {
  const updateItem = useSettingStore((s) => s.updateItem);
  const deleteItem = useSettingStore((s) => s.deleteItem);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleUpdate = async (params: import('../../types/setting').UpdateSettingItemParams) => {
    await updateItem(item.id, params);
  };

  return (
    <Card sx={{ height: '100%', overflow: 'auto' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flexGrow: 1 }}>
            <EditableText
              value={item.name}
              onChange={(v) => handleUpdate({ name: v })}
              variant="h5"
              fontWeight={600}
              placeholder="设定项名称"
            />
          </Box>
          <IconButton color="error" onClick={() => setConfirmOpen(true)}>
            <DeleteIcon />
          </IconButton>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>内容</Typography>
          <TextField
            value={item.content}
            onChange={(e) => handleUpdate({ content: e.target.value })}
            multiline
            minRows={8}
            maxRows={30}
            fullWidth
            placeholder="输入设定内容..."
            variant="outlined"
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>标签</Typography>
          <TagInput
            tags={item.tags}
            onChange={(tags) => handleUpdate({ tags })}
            placeholder="添加标签"
          />
        </Box>

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            创建于 {new Date(item.createdAt).toLocaleString()} · 更新于 {new Date(item.updatedAt).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        title="删除设定项"
        message={`确定要删除设定项"${item.name}"吗？`}
        confirmColor="error"
        confirmLabel="删除"
        onConfirm={async () => { await deleteItem(item.id); setConfirmOpen(false); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
};
