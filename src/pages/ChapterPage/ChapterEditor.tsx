/**
 * 正文编辑器组件 - 支持Markdown编辑、AI续写、角色/设定引用
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Popover,
  List,
  ListItemButton,
  ListItemText,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Settings as SettingIcon,
  TextFields as TextIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import type { Chapter } from '../../types/chapter';
import { ChapterStatus, CHAPTER_STATUS_LABELS, CHAPTER_STATUS_COLORS } from '../../types/chapter';
import type { Character } from '../../types/character';
import type { SettingItem } from '../../types/setting';
import { useAIStore } from '../../stores/aiStore';
import { aiService } from '../../services/aiService';
import { contextAssembler } from '../../services/contextAssembler';
import { countWords } from '../../stores/chapterStore';

interface ChapterEditorProps {
  chapter: Chapter;
  characters: Character[];
  settingItems: SettingItem[];
  onUpdate: (id: string, params: { content?: string; title?: string; status?: ChapterStatus; characterRefs?: string[]; settingRefs?: string[]; wordCount?: number }) => void;
  onAIContinue: (content: string) => void;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
  chapter,
  characters,
  settingItems,
  onUpdate,
  onAIContinue,
}) => {
  const config = useAIStore((s) => s.config);
  const [content, setContent] = useState(chapter.content);
  const [title, setTitle] = useState(chapter.title);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMode, setAiMode] = useState<'continue' | 'rewrite' | 'expand'>('continue');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [insertAnchor, setInsertAnchor] = useState<HTMLElement | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef(chapter.content);

  /** 内容变更时自动保存 */
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    // 防抖自动保存（3秒）
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const wordCount = countWords(newContent);
      onUpdate(chapter.id, { content: newContent, wordCount });
      lastSavedContentRef.current = newContent;
    }, 3000);
  }, [chapter.id, onUpdate]);

  /** 标题变更 */
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      onUpdate(chapter.id, { title: newTitle });
    }, 3000);
  }, [chapter.id, onUpdate]);

  /** 手动保存 */
  const handleSave = useCallback(async () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaving(true);
    try {
      const wordCount = countWords(content);
      await onUpdate(chapter.id, { content, title, wordCount });
      lastSavedContentRef.current = content;
      setSnackbar({ open: true, message: '已保存', severity: 'success' });
    } finally {
      setSaving(false);
    }
  }, [chapter.id, content, title, onUpdate]);

  /** 切换章节时同步内容 */
  useEffect(() => {
    if (chapter.content !== lastSavedContentRef.current) {
      setContent(chapter.content);
      setTitle(chapter.title);
      lastSavedContentRef.current = chapter.content;
    }
  }, [chapter.id]);

  /** AI 续写/改写/扩写 */
  const handleAIGenerate = useCallback(async () => {
    if (!config.apiKey) {
      setSnackbar({ open: true, message: '请先配置 AI API Key', severity: 'error' });
      return;
    }

    setAiGenerating(true);
    try {
      const context = await contextAssembler.assembleContext({
        additionalInstructions: `当前正在写第"${title}"章节。已有正文内容如下：\n${content.slice(-2000)}`,
      });

      const prompts: Record<string, string> = {
        continue: `请续写以下章节内容，保持风格和视角一致，续写约500字：\n\n${content.slice(-1500) || '（空白章节，请从头开始写作）'}`,
        rewrite: `请改写以下章节内容，使其更生动、更有文学性，保持原有情节不变：\n\n${content || '（空白章节）'}`,
        expand: `请扩写以下章节内容，补充细节描写、心理活动和环境描写：\n\n${content.slice(-1000) || '（空白章节）'}`,
      };

      const result = await aiService.generate(
        {
          prompt: prompts[aiMode],
          systemPrompt: `你是一位资深小说作家。${context.contextText ? `参考设定：\n${context.contextText}` : ''}`,
          temperature: 0.8,
          maxTokens: 2000,
        },
        config,
      );

      if (aiMode === 'continue') {
        const newContent = content + '\n\n' + result.content;
        setContent(newContent);
        // 立即保存AI生成的内容，避免切换章节时丢失
        const wordCount = countWords(newContent);
        onUpdate(chapter.id, { content: newContent, wordCount });
        lastSavedContentRef.current = newContent;
      } else {
        setContent(result.content);
        // 立即保存AI生成的内容
        const wordCount = countWords(result.content);
        onUpdate(chapter.id, { content: result.content, wordCount });
        lastSavedContentRef.current = result.content;
      }

      setSnackbar({ open: true, message: 'AI生成完成', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'AI生成失败：' + (err instanceof Error ? err.message : '未知错误'), severity: 'error' });
    } finally {
      setAiGenerating(false);
      setAiDialogOpen(false);
    }
  }, [config, content, title, aiMode, chapter.id, onUpdate]);

  /** 插入角色引用 */
  const handleInsertCharacter = useCallback((character: Character) => {
    const insertText = `\n【${character.name}】`;
    setContent((prev) => prev + insertText);
    // 更新引用
    const refs = [...new Set([...chapter.characterRefs, character.id])];
    onUpdate(chapter.id, { characterRefs: refs });
    setInsertAnchor(null);
  }, [chapter.id, chapter.characterRefs, onUpdate]);

  /** 插入设定引用 */
  const handleInsertSetting = useCallback((item: SettingItem) => {
    const insertText = `\n「${item.name}」`;
    setContent((prev) => prev + insertText);
    const refs = [...new Set([...chapter.settingRefs, item.id])];
    onUpdate(chapter.id, { settingRefs: refs });
    setInsertAnchor(null);
  }, [chapter.id, chapter.settingRefs, onUpdate]);

  const wordCount = countWords(content);
  const statusColor = CHAPTER_STATUS_COLORS[chapter.status] || '#9e9e9e';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 工具栏 */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 0.8,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}>
        <TextField
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          variant="standard"
          size="small"
          sx={{
            flexGrow: 1,
            '& .MuiInputBase-input': {
              fontSize: '1.1rem',
              fontWeight: 600,
            },
          }}
          placeholder="章节标题"
        />

        <Chip
          label={CHAPTER_STATUS_LABELS[chapter.status]}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.7rem',
            bgcolor: `${statusColor}22`,
            color: statusColor,
            fontWeight: 600,
          }}
        />

        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>状态</InputLabel>
          <Select
            value={chapter.status}
            label="状态"
            onChange={(e) => onUpdate(chapter.id, { status: e.target.value as ChapterStatus })}
            sx={{ fontSize: '0.8rem', height: 30 }}
          >
            {Object.entries(CHAPTER_STATUS_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key} sx={{ fontSize: '0.8rem' }}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="插入角色引用">
          <IconButton size="small" onClick={(e) => setInsertAnchor(e.currentTarget as HTMLElement)}>
            <PersonIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="AI续写/改写">
          <IconButton size="small" color="secondary" onClick={() => setAiDialogOpen(true)}>
            <AIIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="保存">
          <IconButton size="small" color="primary" onClick={handleSave} disabled={saving}>
            <SaveIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Typography variant="caption" color="text.secondary">
          {wordCount.toLocaleString()} 字
        </Typography>
      </Box>

      {/* 引用标签 */}
      {(chapter.characterRefs.length > 0 || chapter.settingRefs.length > 0) && (
        <Box sx={{ px: 2, py: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap', bgcolor: 'grey.50' }}>
          {chapter.characterRefs.map((refId) => {
            const char = characters.find((c) => c.id === refId);
            if (!char) return null;
            return (
              <Chip
                key={refId}
                label={char.name}
                size="small"
                icon={<PersonIcon />}
                onDelete={() => {
                  const refs = chapter.characterRefs.filter((id) => id !== refId);
                  onUpdate(chapter.id, { characterRefs: refs });
                }}
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
            );
          })}
          {chapter.settingRefs.map((refId) => {
            const item = settingItems.find((s) => s.id === refId);
            if (!item) return null;
            return (
              <Chip
                key={refId}
                label={item.name}
                size="small"
                variant="outlined"
                icon={<SettingIcon />}
                onDelete={() => {
                  const refs = chapter.settingRefs.filter((id) => id !== refId);
                  onUpdate(chapter.id, { settingRefs: refs });
                }}
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
            );
          })}
        </Box>
      )}

      {/* 编辑区域 */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <TextField
          multiline
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="开始写作..."
          fullWidth
          variant="standard"
          sx={{
            height: '100%',
            '& .MuiInputBase-root': {
              height: '100%',
              alignItems: 'flex-start',
            },
            '& .MuiInputBase-input': {
              height: '100% !important',
              overflow: 'auto !important',
              p: 3,
              fontSize: '1rem',
              lineHeight: 2,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif',
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'text.disabled',
            },
          }}
          InputProps={{
            disableUnderline: true,
          }}
        />
      </Box>

      {/* 底部状态栏 */}
      <Box sx={{
        px: 2,
        py: 0.5,
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        bgcolor: 'grey.50',
      }}>
        <Typography variant="caption" color="text.secondary">
          自动保存已开启 · Ctrl+S 手动保存
        </Typography>
        <Typography variant="caption" color="text.secondary">
          上次保存：{new Date(chapter.updatedAt).toLocaleTimeString()}
        </Typography>
      </Box>

      {/* 插入引用弹窗 */}
      <Popover
        open={Boolean(insertAnchor)}
        anchorEl={insertAnchor}
        onClose={() => setInsertAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ width: 280, maxHeight: 400, overflow: 'auto' }}>
          <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
            <Typography variant="subtitle2">插入角色</Typography>
          </Box>
          <List dense>
            {characters.map((char) => (
              <ListItemButton key={char.id} onClick={() => handleInsertCharacter(char)}>
                <PersonIcon sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />
                <ListItemText primary={char.name} primaryTypographyProps={{ fontSize: '0.8rem' }} />
              </ListItemButton>
            ))}
            {characters.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                暂无角色
              </Typography>
            )}
          </List>
          <Box sx={{ px: 2, pt: 1, pb: 0.5, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2">插入设定</Typography>
          </Box>
          <List dense>
            {settingItems.map((item) => (
              <ListItemButton key={item.id} onClick={() => handleInsertSetting(item)}>
                <SettingIcon sx={{ mr: 1, fontSize: 16, color: 'secondary.main' }} />
                <ListItemText primary={item.name} primaryTypographyProps={{ fontSize: '0.8rem' }} />
              </ListItemButton>
            ))}
            {settingItems.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                暂无设定
              </Typography>
            )}
          </List>
        </Box>
      </Popover>

      {/* AI 续写/改写对话框 */}
      <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <AIIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'secondary.main' }} />
          AI 辅助写作
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>写作模式</InputLabel>
            <Select
              value={aiMode}
              label="写作模式"
              onChange={(e) => setAiMode(e.target.value as 'continue' | 'rewrite' | 'expand')}
            >
              <MenuItem value="continue">续写（在当前内容后继续）</MenuItem>
              <MenuItem value="rewrite">改写（重写当前内容）</MenuItem>
              <MenuItem value="expand">扩写（补充细节）</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {aiMode === 'continue' && 'AI将在当前内容之后继续写作，保持风格一致'}
            {aiMode === 'rewrite' && 'AI将重新改写当前内容，使其更生动'}
            {aiMode === 'expand' && 'AI将扩写当前内容，补充细节、心理和环境描写'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            startIcon={<AIIcon />}
            onClick={handleAIGenerate}
            disabled={aiGenerating}
            color="secondary"
          >
            {aiGenerating ? '生成中...' : '开始生成'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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
