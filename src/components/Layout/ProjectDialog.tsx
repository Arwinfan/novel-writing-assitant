/**
 * 项目管理对话框
 * 创建/切换/删除小说项目
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Box,
  Chip,
  Tooltip,
  Divider,
  Alert,
} from '@mui/material';
import {
  MenuBook as BookIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  AutoStories as StoriesIcon,
} from '@mui/icons-material';
import { useAppStore } from '../../stores/appStore';

const GENRE_OPTIONS = [
  { label: '玄幻', value: '玄幻' },
  { label: '仙侠', value: '仙侠' },
  { label: '都市', value: '都市' },
  { label: '科幻', value: '科幻' },
  { label: '悬疑', value: '悬疑' },
  { label: '历史', value: '历史' },
  { label: '言情', value: '言情' },
  { label: '武侠', value: '武侠' },
  { label: '恐怖', value: '恐怖' },
  { label: '奇幻', value: '奇幻' },
  { label: '其他', value: '其他' },
];

export const ProjectDialog: React.FC = () => {
  const { projects, project, projectDialogOpen, setProjectDialogOpen, createProject, switchProject, deleteProject } = useAppStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const p = await createProject(newName.trim(), newDesc.trim(), newGenre);
    setNewName('');
    setNewDesc('');
    setNewGenre('');
    setCreating(false);
  };

  const handleSwitch = async (id: string) => {
    await switchProject(id);
    // 切换项目后需要重新加载所有数据
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete === id) {
      await deleteProject(id);
      setConfirmDelete(null);
      if (projects.length <= 1) {
        // 如果删除的是最后一个项目，刷新
        window.location.reload();
      }
    } else {
      setConfirmDelete(id);
    }
  };

  return (
    <Dialog
      open={projectDialogOpen}
      onClose={() => setProjectDialogOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { minHeight: 400 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <StoriesIcon color="primary" />
        小说项目管理
      </DialogTitle>

      <DialogContent>
        {/* 创建新区 */}
        {creating ? (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>创建新小说</Typography>
            <TextField
              label="小说名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 1.5 }}
              autoFocus
            />
            <TextField
              label="简介（可选）"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
              sx={{ mb: 1.5 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              选择类型
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
              {GENRE_OPTIONS.map((g) => (
                <Chip
                  key={g.value}
                  label={g.label}
                  size="small"
                  variant={newGenre === g.value ? 'filled' : 'outlined'}
                  color={newGenre === g.value ? 'primary' : 'default'}
                  onClick={() => setNewGenre(g.value)}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => { setCreating(false); setNewName(''); setNewDesc(''); setNewGenre(''); }}>
                取消
              </Button>
              <Button size="small" variant="contained" startIcon={<CheckIcon />} onClick={handleCreate} disabled={!newName.trim()}>
                创建
              </Button>
            </Box>
          </Box>
        ) : (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCreating(true)}
            fullWidth
            sx={{ mb: 2 }}
          >
            创建新小说
          </Button>
        )}

        <Divider sx={{ mb: 1 }} />

        {/* 项目列表 */}
        <List dense>
          {projects.map((p) => (
            <ListItem
              key={p.id}
              disablePadding
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {p.id === project?.id && (
                    <Chip label="当前" size="small" color="primary" variant="outlined" />
                  )}
                  {projects.length > 1 && (
                    <Tooltip title={confirmDelete === p.id ? '再次点击确认删除' : '删除项目'}>
                      <IconButton
                        size="small"
                        color={confirmDelete === p.id ? 'error' : 'default'}
                        onClick={() => handleDelete(p.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              }
            >
              <ListItemButton
                selected={p.id === project?.id}
                onClick={() => {
                  if (p.id !== project?.id) handleSwitch(p.id);
                }}
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BookIcon fontSize="small" color={p.id === project?.id ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText
                  primary={p.name}
                  secondary={
                    <Box component="span" sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      {(p as any).genre && <Chip label={(p as any).genre} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />}
                      <Typography variant="caption" color="text.secondary" component="span">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {confirmDelete && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            ⚠️ 再次点击删除按钮确认删除，该操作不可恢复！
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => { setProjectDialogOpen(false); setConfirmDelete(null); }}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
};
