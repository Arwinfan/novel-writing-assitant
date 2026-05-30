/**
 * 章节列表组件 - 左侧栏（支持多选）
 */
import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Menu,
  MenuItem,
  Divider,
  Checkbox,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AutoAwesome as AIIcon,
  Folder as VolumeIcon,
  Description as ChapterIcon,
  Close as CloseIcon,
  SelectAll as SelectAllIcon,
  Deselect as DeselectIcon,
} from '@mui/icons-material';
import type { Chapter } from '../../types/chapter';
import { ChapterStatus, CHAPTER_STATUS_LABELS, CHAPTER_STATUS_COLORS } from '../../types/chapter';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';

interface ChapterListProps {
  chapters: Chapter[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (title: string, parentId: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onAIGenerate: () => void;
  onBatchDelete?: (ids: string[]) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onAIGenerate,
  onBatchDelete,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Chapter | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuTarget, setMenuTarget] = useState<Chapter | null>(null);
  // 多选相关
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  /** 顶层章节（无 parentId 的） */
  const topLevelChapters = chapters.filter((c) => !c.parentId || c.parentId === '');
  /** 子章节映射 */
  const childMap = new Map<string, Chapter[]>();
  chapters.forEach((c) => {
    if (c.parentId && c.parentId !== '') {
      const list = childMap.get(c.parentId) ?? [];
      list.push(c);
      childMap.set(c.parentId, list);
    }
  });

  const handleCreate = () => {
    if (newTitle.trim()) {
      onCreate(newTitle.trim(), newParentId);
      setNewTitle('');
      setNewParentId('');
      setCreateDialogOpen(false);
    }
  };

  const handleRename = () => {
    if (renameTarget && renameTitle.trim()) {
      onRename(renameTarget.id, renameTitle.trim());
      setRenameDialogOpen(false);
      setRenameTarget(null);
      setRenameTitle('');
    }
  };

  const handleMenuOpen = (e: React.MouseEvent, chapter: Chapter) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget as HTMLElement);
    setMenuTarget(chapter);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuTarget(null);
  };

  /** 多选：切换选中 */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /** 多选：全选 */
  const selectAll = () => {
    setSelectedIds(new Set(chapters.map((c) => c.id)));
  };

  /** 多选：取消全选/退出多选模式 */
  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  /** 多选：进入选择模式 */
  const enterSelectionMode = () => {
    setSelectionMode(true);
  };

  /** 多选：批量删除 */
  const handleBatchDelete = () => {
    if (selectedIds.size > 0) {
      setBatchDeleteOpen(true);
    }
  };

  const confirmBatchDelete = () => {
    if (onBatchDelete) {
      onBatchDelete(Array.from(selectedIds));
    } else {
      // 回退：逐个删除
      selectedIds.forEach((id) => onDelete(id));
    }
    setSelectedIds(new Set());
    setSelectionMode(false);
    setBatchDeleteOpen(false);
  };

  const renderChapter = (chapter: Chapter, depth: number = 0) => {
    const children = childMap.get(chapter.id) ?? [];
    const isSelected = selectedId === chapter.id;
    const isChecked = selectedIds.has(chapter.id);
    const statusColor = CHAPTER_STATUS_COLORS[chapter.status] || '#9e9e9e';

    return (
      <Box key={chapter.id}>
        <ListItem
          disablePadding
          sx={{ pl: depth * 2 }}
        >
          <ListItemButton
            selected={isSelected}
            onClick={() => selectionMode ? toggleSelect(chapter.id) : onSelect(chapter.id)}
            sx={{
              borderRadius: 1,
              mb: 0.3,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.light' },
              },
            }}
          >
            {selectionMode && (
              <Checkbox
                size="small"
                checked={isChecked}
                onClick={(e) => { e.stopPropagation(); toggleSelect(chapter.id); }}
                sx={{ mr: 0.5, p: 0.3 }}
              />
            )}
            <ChapterIcon sx={{ fontSize: 18, mr: 1, color: isSelected ? 'inherit' : statusColor }} />
            <ListItemText
              primary={chapter.title}
              secondary={`${chapter.wordCount}字`}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isSelected ? 600 : 400,
                noWrap: true,
              }}
              secondaryTypographyProps={{
                fontSize: '0.7rem',
                color: isSelected ? 'rgba(255,255,255,0.7)' : 'text.secondary',
              }}
            />
            {!selectionMode && (
              <>
                <Chip
                  label={CHAPTER_STATUS_LABELS[chapter.status]}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    bgcolor: `${statusColor}22`,
                    color: statusColor,
                    fontWeight: 600,
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, chapter)}
                  sx={{ ml: 0.5, color: isSelected ? 'inherit' : 'text.secondary' }}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </ListItemButton>
        </ListItem>
        {children.map((child) => renderChapter(child, depth + 1))}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 工具栏 */}
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={600}>
          章节
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {!selectionMode ? (
            <>
              <Tooltip title="多选">
                <IconButton size="small" onClick={enterSelectionMode} title="多选">
                  <SelectAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={onAIGenerate} color="secondary" title="AI生成">
                <AIIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setCreateDialogOpen(true)} color="primary" title="新增章节">
                <AddIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: '24px', mr: 0.5 }}>
                已选 {selectedIds.size}
              </Typography>
              <IconButton size="small" onClick={selectAll} title="全选" disabled={selectedIds.size === chapters.length}>
                <SelectAllIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleBatchDelete} color="error" title="批量删除" disabled={selectedIds.size === 0}>
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={clearSelection} title="取消">
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      {/* 章节列表 */}
      <List sx={{ flexGrow: 1, overflow: 'auto', px: 1, py: 0.5 }}>
        {topLevelChapters.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              还没有章节
            </Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)} sx={{ mt: 1 }}>
              创建第一章
            </Button>
          </Box>
        ) : (
          topLevelChapters
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((chapter) => renderChapter(chapter))
        )}
      </List>

      {/* 字数统计 */}
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          总字数：{chapters.reduce((sum, c) => sum + c.wordCount, 0).toLocaleString()} | 共 {chapters.length} 章
        </Typography>
      </Box>

      {/* 右键菜单 */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (menuTarget) {
            setRenameTarget(menuTarget);
            setRenameTitle(menuTarget.title);
            setRenameDialogOpen(true);
          }
          handleMenuClose();
        }}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} /> 重命名
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuTarget) {
            setNewParentId(menuTarget.id);
            setCreateDialogOpen(true);
          }
          handleMenuClose();
        }}>
          <AddIcon sx={{ mr: 1, fontSize: 18 }} /> 添加子章节
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          if (menuTarget) {
            onDelete(menuTarget.id);
          }
          handleMenuClose();
        }} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} /> 删除
        </MenuItem>
      </Menu>

      {/* 创建对话框 */}
      <Dialog open={createDialogOpen} onClose={() => { setCreateDialogOpen(false); setNewParentId(''); }} maxWidth="xs" fullWidth>
        <DialogTitle>{newParentId ? '新增子章节' : '新增章节'}</DialogTitle>
        <DialogContent>
          <TextField
            label="章节标题"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            fullWidth
            size="small"
            autoFocus
            sx={{ mt: 1 }}
            placeholder="如：第一章 初入江湖"
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateDialogOpen(false); setNewParentId(''); }}>取消</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newTitle.trim()}>创建</Button>
        </DialogActions>
      </Dialog>

      {/* 重命名对话框 */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>重命名章节</DialogTitle>
        <DialogContent>
          <TextField
            label="章节标题"
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            fullWidth
            size="small"
            autoFocus
            sx={{ mt: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleRename} disabled={!renameTitle.trim()}>确定</Button>
        </DialogActions>
      </Dialog>

      {/* 批量删除确认 */}
      <ConfirmDialog
        open={batchDeleteOpen}
        title="批量删除章节"
        message={`确定要删除选中的 ${selectedIds.size} 个章节吗？此操作不可撤销。`}
        confirmColor="error"
        confirmLabel="删除"
        onConfirm={confirmBatchDelete}
        onCancel={() => setBatchDeleteOpen(false)}
      />
    </Box>
  );
};
