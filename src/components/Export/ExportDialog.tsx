/**
 * 导出对话框
 * 支持选择导出格式（JSON/TXT/Markdown）和导出模块范围
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  DataObject as JsonIcon,
  TextSnippet as TxtIcon,
  Article as MdIcon,
} from '@mui/icons-material';
import type { ExportFormat, ExportOptions } from '../../services/exportImportService';

interface ExportDialogProps {
  open: boolean;
  projectName: string;
  onExport: (options: ExportOptions) => Promise<void>;
  onClose: () => void;
}

const FORMAT_INFO: Record<ExportFormat, { label: string; desc: string; icon: React.ReactElement }> = {
  json: { label: 'JSON 数据包', desc: '完整结构化数据，可用于导入恢复', icon: <JsonIcon /> },
  markdown: { label: 'Markdown', desc: '带格式的可读文档，适合阅读和分享', icon: <MdIcon /> },
  txt: { label: '纯文本 TXT', desc: '简洁文本，适合复制到其他平台', icon: <TxtIcon /> },
};

const MODULE_LABELS: Record<string, { label: string; icon: string }> = {
  outline: { label: '大纲', icon: '📋' },
  chapter: { label: '正文', icon: '📖' },
  plotline: { label: '剧情线', icon: '📈' },
  character: { label: '角色', icon: '👤' },
  relation: { label: '角色关系', icon: '🔗' },
  setting: { label: '世界设定', icon: '🌍' },
  faction: { label: '组织', icon: '🏛️' },
};

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  projectName,
  onExport,
  onClose,
}) => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [includeModules, setIncludeModules] = useState<ExportOptions['includeModules']>({
    outline: true,
    chapter: true,
    plotline: true,
    character: true,
    relation: true,
    setting: true,
    faction: true,
  });
  const [onlyCompletedChapters, setOnlyCompletedChapters] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleModuleToggle = (key: string) => {
    setIncludeModules((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(includeModules).every(Boolean);
    setIncludeModules({
      outline: !allSelected,
      chapter: !allSelected,
      plotline: !allSelected,
      character: !allSelected,
      relation: !allSelected,
      setting: !allSelected,
      faction: !allSelected,
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport({ format, includeModules, onlyCompletedChapters });
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const isTextFormat = format !== 'json';
  const hasSelection = Object.values(includeModules).some(Boolean);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ExportIcon color="primary" />
        导出「{projectName}」
      </DialogTitle>

      <DialogContent>
        {/* 格式选择 */}
        <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
          <FormLabel sx={{ mb: 1, fontWeight: 'bold' }}>导出格式</FormLabel>
          <RadioGroup
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
          >
            {Object.entries(FORMAT_INFO).map(([key, info]) => (
              <Paper
                key={key}
                variant="outlined"
                sx={{
                  mb: 1,
                  p: 1.5,
                  cursor: 'pointer',
                  borderColor: format === key ? 'primary.main' : 'divider',
                  bgcolor: format === key ? 'primary.50' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.light' },
                }}
                onClick={() => setFormat(key as ExportFormat)}
              >
                <FormControlLabel
                  value={key}
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {info.icon}
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{info.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{info.desc}</Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ m: 0 }}
                />
              </Paper>
            ))}
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* 模块选择 */}
        <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <FormLabel sx={{ fontWeight: 'bold', m: 0 }}>导出内容</FormLabel>
            <Button size="small" onClick={handleSelectAll}>
              {Object.values(includeModules).every(Boolean) ? '取消全选' : '全选'}
            </Button>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
            {Object.entries(MODULE_LABELS).map(([key, info]) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={includeModules[key as keyof typeof includeModules]}
                    onChange={() => handleModuleToggle(key)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    {info.icon} {info.label}
                  </Typography>
                }
              />
            ))}
          </Box>
        </FormControl>

        {/* 文本格式额外选项 */}
        {isTextFormat && (
          <>
            <Divider sx={{ my: 2 }} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={onlyCompletedChapters}
                  onChange={(e) => setOnlyCompletedChapters(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  仅导出完稿章节（排除草稿和进行中）
                </Typography>
              }
            />
          </>
        )}

        {!hasSelection && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            请至少选择一个导出模块
          </Alert>
        )}

        {/* 格式说明 */}
        {format === 'json' && (
          <Alert severity="info" sx={{ mt: 2 }} icon={false}>
            JSON 格式包含完整数据结构和引用关系，可用于导入恢复到本应用。
          </Alert>
        )}
        {(format === 'txt' || format === 'markdown') && (
          <Alert severity="info" sx={{ mt: 2 }} icon={false}>
            {format === 'markdown' ? 'Markdown' : '纯文本'}格式适合阅读、分享或导入到其他编辑器，但不支持重新导入本应用。
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>取消</Button>
        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          onClick={handleExport}
          disabled={!hasSelection || exporting}
        >
          {exporting ? '导出中...' : '导出'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
