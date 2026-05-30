/**
 * AI 一键生成对话框
 * 通用组件：条件选择 → 输入提示 → 生成 → 预览 → 采纳
 */
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  useMediaQuery,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { useAIStore } from '../../stores/aiStore';
import {
  aiGenerateService,
  type GenerateModule,
  type GenerateOption,
  MODULE_OPTIONS,
} from '../../services/aiGenerateService';

interface AIGenerateDialogProps {
  open: boolean;
  module: GenerateModule;
  moduleLabel: string;
  existingNames?: string[];
  existingContext?: string;
  onAdopt: (content: string) => void;
  onClose: () => void;
}

const MODULE_PLACEHOLDERS: Record<GenerateModule, string> = {
  outline: '如：主角从废材逆袭的故事...',
  chapter: '如：第一章开场的场景描写...',
  plotline: '如：围绕主角复仇的主线...',
  character: '如：需要一个亦正亦邪的角色...',
  relation: '如：角色间要有爱恨纠葛...',
  setting: '如：独特的魔法体系...',
};

export const AIGenerateDialog: React.FC<AIGenerateDialogProps> = ({
  open,
  module,
  moduleLabel,
  existingNames = [],
  existingContext,
  onAdopt,
  onClose,
}) => {
  const isMobileDialog = useMediaQuery('(max-width:600px)');
  const config = useAIStore((s) => s.config);
  const [hint, setHint] = useState('');
  const [optionValues, setOptionValues] = useState<Record<string, string>>(() => {
    // 初始化默认值
    const defaults: Record<string, string> = {};
    MODULE_OPTIONS[module]?.forEach((opt) => {
      if (opt.defaultValue) defaults[opt.key] = opt.defaultValue;
    });
    return defaults;
  });
  const [optionsExpanded, setOptionsExpanded] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [finalContent, setFinalContent] = useState('');
  const [error, setError] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const moduleOptions = MODULE_OPTIONS[module] ?? [];

  const handleGenerate = async () => {
    if (!config.apiKey) {
      setError('请先在 AI 设置中配置 API Key');
      return;
    }

    setGenerating(true);
    setError('');
    setStreamContent('');
    setFinalContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await aiGenerateService.generate({
        module,
        userHint: hint,
        optionValues,
        existingContext,
        existingNames,
        config,
        signal: controller.signal,
        onChunk: (chunk) => {
          setStreamContent((prev) => prev + chunk);
        },
      });
      setFinalContent(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // 用户主动取消，不显示错误
      } else {
        setError(err instanceof Error ? err.message : '生成失败，请重试');
      }
    } finally {
      setGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleAdopt = () => {
    onAdopt(finalContent || streamContent);
    resetState();
    onClose();
  };

  /** 重置内部状态 */
  const resetState = () => {
    setHint('');
    setStreamContent('');
    setFinalContent('');
    setError('');
  };

  const handleClose = () => {
    if (generating) {
      // 生成过程中取消：中断请求并关闭弹窗
      abortControllerRef.current?.abort();
    }
    resetState();
    onClose();
  };

  const displayContent = finalContent || streamContent;

  const renderOption = (option: GenerateOption) => {
    const value = optionValues[option.key] ?? '';

    if (option.type === 'select' && option.options) {
      return (
        <FormControl key={option.key} fullWidth size="small" sx={{ mb: 1.5 }}>
          <InputLabel>{option.label}</InputLabel>
          <Select
            value={value}
            label={option.label}
            onChange={(e) =>
              setOptionValues((prev) => ({ ...prev, [option.key]: e.target.value }))
            }
          >
            {option.options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (option.type === 'number') {
      return (
        <TextField
          key={option.key}
          label={option.label}
          type="number"
          value={value}
          onChange={(e) =>
            setOptionValues((prev) => ({ ...prev, [option.key]: e.target.value }))
          }
          size="small"
          fullWidth
          sx={{ mb: 1.5 }}
        />
      );
    }

    return (
      <TextField
        key={option.key}
        label={option.label}
        value={value}
        onChange={(e) =>
          setOptionValues((prev) => ({ ...prev, [option.key]: e.target.value }))
        }
        placeholder={option.placeholder}
        size="small"
        fullWidth
        sx={{ mb: 1.5 }}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobileDialog}
      PaperProps={{ sx: { minHeight: 480 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AIIcon color="primary" />
        AI 一键生成{moduleLabel}
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* 输入区 */}
        {!displayContent && !generating && (
          <Box sx={{ mt: 1 }}>
            {/* 条件选项 */}
            {moduleOptions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Button
                  size="small"
                  startIcon={<TuneIcon />}
                  endIcon={optionsExpanded ? <CollapseIcon /> : <ExpandIcon />}
                  onClick={() => setOptionsExpanded(!optionsExpanded)}
                  sx={{ mb: 1, textTransform: 'none' }}
                >
                  生成条件
                </Button>
                <Collapse in={optionsExpanded}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, px: 0.5 }}>
                    {moduleOptions.map(renderOption)}
                  </Box>
                </Collapse>
              </Box>
            )}

            <TextField
              label="额外提示（可选）"
              placeholder={MODULE_PLACEHOLDERS[module]}
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              multiline
              rows={2}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />

            {existingNames.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  已有内容（AI将避免重复）：
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {existingNames.slice(0, 20).map((name) => (
                    <Chip key={name} label={name} size="small" variant="outlined" />
                  ))}
                  {existingNames.length > 20 && (
                    <Chip label={`+${existingNames.length - 20}`} size="small" />
                  )}
                </Box>
              </Box>
            )}

            {error && (
              <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
        )}

        {/* 生成中 - 流式展示 */}
        {generating && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="primary">
                AI 正在生成{moduleLabel}...
              </Typography>
            </Box>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                maxHeight: 400,
                overflow: 'auto',
                bgcolor: 'grey.50',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: 1.6,
              }}
            >
              {streamContent || '等待生成...'}
            </Paper>
          </Box>
        )}

        {/* 生成完成 - 预览 */}
        {displayContent && !generating && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              生成结果预览：
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                maxHeight: 400,
                overflow: 'auto',
                bgcolor: 'grey.50',
                whiteSpace: 'pre-wrap',
                fontSize: '0.875rem',
                lineHeight: 1.6,
              }}
            >
              {displayContent}
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!displayContent && !generating ? (
          <>
            <Button onClick={handleClose}>取消</Button>
            <Button
              variant="contained"
              startIcon={<AIIcon />}
              onClick={handleGenerate}
            >
              开始生成
            </Button>
          </>
        ) : generating ? (
          <Button onClick={handleClose} color="inherit">
            取消生成
          </Button>
        ) : (
          <>
            <Button onClick={handleClose}>放弃</Button>
            <Button
              variant="contained"
              startIcon={<CheckIcon />}
              onClick={handleAdopt}
              color="success"
            >
              采纳并创建
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
