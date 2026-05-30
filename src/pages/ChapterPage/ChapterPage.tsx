/**
 * 正文编辑写作页（响应式：桌面端双栏/移动端切换）
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Snackbar, Alert, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Description as ChapterIcon, AutoAwesome as AIIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useChapterStore, countWords } from '../../stores/chapterStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useSettingStore } from '../../stores/settingStore';
import { ChapterList } from './ChapterList';
import { ChapterEditor } from './ChapterEditor';
import { AIGenerateDialog } from '../../components/AI/AIGenerateDialog';
import { aiGenerateService } from '../../services/aiGenerateService';
import { EmptyState } from '../../components/Common/EmptyState';
import { ChapterStatus } from '../../types/chapter';

export const ChapterPage: React.FC = () => {
  const { chapters, selectedChapterId, loadChapters, createChapter, updateChapter, deleteChapter, selectChapter } = useChapterStore();
  const { characters, loadCharacters } = useCharacterStore();
  const { items: settingItems, loadCategories, loadAllItems } = useSettingStore();
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [showList, setShowList] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const theme = useTheme();
  const isMobile = !useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    loadChapters();
    loadCharacters();
    loadCategories();
    loadAllItems();
  }, [loadChapters, loadCharacters, loadCategories, loadAllItems]);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) ?? null;

  /** 选择章节（移动端切换到编辑器） */
  const handleSelect = useCallback((id: string | null) => {
    selectChapter(id);
    if (isMobile && id) setShowList(false);
  }, [selectChapter, isMobile]);

  /** 返回列表（移动端） */
  const handleBackToList = useCallback(() => {
    setShowList(true);
  }, []);

  /** 创建章节 */
  const handleCreate = useCallback(async (title: string, parentId: string) => {
    try {
      await createChapter({ title, parentId: parentId || undefined });
      setSnackbar({ open: true, message: '章节已创建', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '创建失败', severity: 'error' });
    }
  }, [createChapter]);

  /** 删除章节 */
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteChapter(id);
      setSnackbar({ open: true, message: '章节已删除', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '删除失败', severity: 'error' });
    }
  }, [deleteChapter]);

  /** 重命名章节 */
  const handleRename = useCallback(async (id: string, newTitle: string) => {
    try {
      await updateChapter(id, { title: newTitle });
      setSnackbar({ open: true, message: '章节已重命名', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '重命名失败', severity: 'error' });
    }
  }, [updateChapter]);

  /** 更新章节内容 */
  const handleUpdate = useCallback(async (id: string, data: any) => {
    try {
      await updateChapter(id, data);
    } catch (err) {
      setSnackbar({ open: true, message: '保存失败', severity: 'error' });
    }
  }, [updateChapter]);

  /** AI 续写 */
  const handleAIContinue = useCallback((text: string) => {
    if (selectedChapter) setAiDialogOpen(true);
  }, [selectedChapter]);

  /** AI 生成结果采纳 */
  const handleAIAdopt = useCallback(async (content: string) => {
    const parsed = aiGenerateService.parseChapterResult(content);
    if (parsed.length === 0) {
      setSnackbar({ open: true, message: 'AI 生成的格式无法解析，请手动创建', severity: 'error' });
      return;
    }

    try {
      let count = 0;
      for (const item of parsed) {
        await createChapter({
          title: item.title || '无标题',
          content: item.content || '',
          status: ChapterStatus.DRAFT,
        });
        count++;
      }
      setSnackbar({ open: true, message: `成功创建 ${count} 个章节`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '创建失败', severity: 'error' });
    }
  }, [createChapter]);

  /** 批量删除章节 */
  const handleBatchDelete = useCallback(async (ids: string[]) => {
    try {
      for (const id of ids) {
        await deleteChapter(id);
      }
      setSnackbar({ open: true, message: `已删除 ${ids.length} 个章节`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '批量删除失败', severity: 'error' });
    }
  }, [deleteChapter]);

  /** 快捷键保存 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (selectedChapter) {
          const wordCount = countWords(selectedChapter.content);
          updateChapter(selectedChapter.id, {
            content: selectedChapter.content,
            title: selectedChapter.title,
            wordCount,
          });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedChapter, updateChapter]);

  // ====== 空状态 ======
  if (chapters.length === 0) {
    return (
      <>
        <EmptyState
          icon={<ChapterIcon />}
          title="还没有章节"
          description="创建章节开始写作你的故事"
          actionLabel="创建第一章"
          onAction={() => handleCreate('第一章', '')}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button variant="outlined" startIcon={<AIIcon />} onClick={() => setAiDialogOpen(true)}>
            AI 生成章节
          </Button>
        </Box>
        <AIGenerateDialog
          open={aiDialogOpen}
          module="chapter"
          moduleLabel="章节"
          existingNames={chapters.map((c) => c.title)}
          existingContext={[
            ...(chapters.length > 0 ? ['已有章节：', ...chapters.map((c) => `- ${c.title}（${c.status === ChapterStatus.DRAFT ? '草稿' : c.status === ChapterStatus.IN_PROGRESS ? '进行中' : c.status === ChapterStatus.COMPLETE ? '完稿' : '修订'}）${c.content ? ` ${c.content.slice(0, 60)}...` : ''}`)] : []),
            ...(characters.length > 0 ? ['\n已有角色：', ...characters.map((c) => `- ${c.name}${c.alias ? `（${c.alias}）` : ''}${c.personality ? `：${c.personality}` : ''}`)] : []),
            ...(settingItems.length > 0 ? ['\n已有设定：', ...settingItems.map((s) => `- ${s.name}${s.content ? `：${s.content.slice(0, 60)}` : ''}`)] : []),
          ].filter(Boolean).join('\n')}
          onAdopt={handleAIAdopt}
          onClose={() => setAiDialogOpen(false)}
        />
      </>
    );
  }

  // ====== 章节列表（移动端全宽显示） ======
  const chapterListView = (
    <Box sx={{
      width: isMobile ? '100%' : 260,
      flexShrink: 0,
      borderRight: isMobile ? 0 : 1,
      borderColor: 'divider',
      bgcolor: 'background.paper',
      overflow: 'auto',
    }}>
      <ChapterList
        chapters={chapters}
        selectedId={selectedChapterId}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onRename={handleRename}
        onAIGenerate={() => setAiDialogOpen(true)}
        onBatchDelete={handleBatchDelete}
      />
    </Box>
  );

  // ====== 编辑器（桌面端右侧 / 移动端全宽） ======
  const editorView = (
    <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {isMobile && (
        <Box sx={{ px: 1, py: 0.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <IconButton size="small" onClick={handleBackToList}>
            <BackIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
            {selectedChapter?.title || '章节'}
          </Typography>
        </Box>
      )}
      {selectedChapter ? (
        <ChapterEditor
          chapter={selectedChapter}
          characters={characters}
          settingItems={settingItems}
          onUpdate={handleUpdate}
          onAIContinue={handleAIContinue}
        />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography color="text.secondary">选择左侧章节开始写作</Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* 桌面端：双栏 */}
      {!isMobile && (
        <>
          {chapterListView}
          {editorView}
        </>
      )}
      {/* 移动端：单栏切换 */}
      {isMobile && (
        showList ? chapterListView : editorView
      )}

      {/* AI生成弹窗 */}
      <AIGenerateDialog
        open={aiDialogOpen}
        module="chapter"
        moduleLabel="章节"
        existingNames={chapters.map((c) => c.title)}
        existingContext={[
          ...(chapters.length > 0 ? ['已有章节：', ...chapters.map((c) => `- ${c.title}（${c.status === ChapterStatus.DRAFT ? '草稿' : c.status === ChapterStatus.IN_PROGRESS ? '进行中' : c.status === ChapterStatus.COMPLETE ? '完稿' : '修订'}）${c.content ? ` ${c.content.slice(0, 60)}...` : ''}`)] : []),
          ...(characters.length > 0 ? ['\n已有角色：', ...characters.map((c) => `- ${c.name}${c.alias ? `（${c.alias}）` : ''}${c.personality ? `：${c.personality}` : ''}`)] : []),
          ...(settingItems.length > 0 ? ['\n已有设定：', ...settingItems.map((s) => `- ${s.name}${s.content ? `：${s.content.slice(0, 60)}` : ''}`)] : []),
        ].filter(Boolean).join('\n')}
        onAdopt={handleAIAdopt}
        onClose={() => setAiDialogOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
