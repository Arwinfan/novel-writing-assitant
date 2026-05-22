/**
 * 正文编辑写作页
 * 左侧章节列表 + 右侧编辑器
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Snackbar, Alert } from '@mui/material';
import { Description as ChapterIcon, AutoAwesome as AIIcon } from '@mui/icons-material';
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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    loadChapters();
    loadCharacters();
    loadCategories();
    loadAllItems();
  }, [loadChapters, loadCharacters, loadCategories, loadAllItems]);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) ?? null;

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
  const handleRename = useCallback(async (id: string, title: string) => {
    try {
      await updateChapter(id, { title });
    } catch (err) {
      setSnackbar({ open: true, message: '重命名失败', severity: 'error' });
    }
  }, [updateChapter]);

  /** 更新章节内容 */
  const handleUpdate = useCallback(async (id: string, params: any) => {
    try {
      const wordCount = params.content ? countWords(params.content) : undefined;
      await updateChapter(id, { ...params, ...(wordCount !== undefined ? { wordCount } : {}) });
    } catch (err) {
      setSnackbar({ open: true, message: '保存失败', severity: 'error' });
    }
  }, [updateChapter]);

  /** AI 续写后更新 */
  const handleAIContinue = useCallback(async (content: string) => {
    if (selectedChapterId) {
      const wordCount = countWords(content);
      await updateChapter(selectedChapterId, { content, wordCount });
    }
  }, [selectedChapterId, updateChapter]);

  /** AI 生成章节采纳 */
  const handleAIAdopt = async (content: string) => {
    const parsed = aiGenerateService.parseOutlineResult(content);
    if (parsed.length === 0) {
      setSnackbar({ open: true, message: 'AI 生成的格式无法解析', severity: 'error' });
      return;
    }

    try {
      let count = 0;
      for (const item of parsed) {
        await createChapter({
          title: item.title,
          content: item.content,
          status: ChapterStatus.DRAFT,
        });
        count++;
      }
      setSnackbar({ open: true, message: `成功创建 ${count} 个章节`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '创建失败', severity: 'error' });
    }
  };

  /** 快捷键保存 */
  React.useEffect(() => {
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

  if (chapters.length === 0 && !selectedChapter) {
    return (
      <>
        <EmptyState
          icon={<ChapterIcon />}
          title="还没有章节"
          description="创建章节开始写作你的故事"
          actionLabel="创建第一章"
          onAction={() => handleCreate('第一章', '')}
        />
        <Box sx={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)' }}>
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={() => setAiDialogOpen(true)}
            sx={{ borderColor: 'primary.main', color: 'primary.main', mr: 2 }}
          >
            AI 生成章节大纲
          </Button>
        </Box>
        <AIGenerateDialog
          open={aiDialogOpen}
          module="chapter"
          moduleLabel="章节"
          existingNames={chapters.map((c) => c.title)}
          existingContext={[
            ...(chapters.length > 0 ? ['已有章节：', ...chapters.map((c) => `- ${c.title}（${c.status === ChapterStatus.DRAFT ? '草稿' : c.status === ChapterStatus.IN_PROGRESS ? '进行中' : c.status === ChapterStatus.COMPLETE ? '完稿' : '修订'}）${c.content ? ` ${c.content.slice(0, 60)}...` : ''}`)] : []),
            ...(characters.length > 0 ? ['\n已有人物：', ...characters.map((c) => `- ${c.name}${c.alias ? `（${c.alias}）` : ''}${c.personality ? `：${c.personality}` : ''}`)] : []),
            ...(settingItems.length > 0 ? ['\n已有设定：', ...settingItems.map((s) => `- ${s.name}${s.content ? `：${s.content.slice(0, 60)}` : ''}`)] : []),
          ].filter(Boolean).join('\n')}
          onAdopt={handleAIAdopt}
          onClose={() => setAiDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* 左侧章节列表 */}
      <Box sx={{ width: 300, flexShrink: 0, borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <ChapterList
          chapters={chapters}
          selectedId={selectedChapterId}
          onSelect={selectChapter}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onRename={handleRename}
          onAIGenerate={() => setAiDialogOpen(true)}
        />
      </Box>

      {/* 右侧编辑器 */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
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
            <span style={{ color: '#999' }}>选择左侧章节开始写作</span>
          </Box>
        )}
      </Box>

      {/* AI生成弹窗 */}
      <AIGenerateDialog
        open={aiDialogOpen}
        module="chapter"
        moduleLabel="章节"
        existingNames={chapters.map((c) => c.title)}
        existingContext={[
          ...(chapters.length > 0 ? ['已有章节：', ...chapters.map((c) => `- ${c.title}（${c.status === ChapterStatus.DRAFT ? '草稿' : c.status === ChapterStatus.IN_PROGRESS ? '进行中' : c.status === ChapterStatus.COMPLETE ? '完稿' : '修订'}）${c.content ? ` ${c.content.slice(0, 60)}...` : ''}`)] : []),
          ...(characters.length > 0 ? ['\n已有人物：', ...characters.map((c) => `- ${c.name}${c.alias ? `（${c.alias}）` : ''}${c.personality ? `：${c.personality}` : ''}`)] : []),
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
