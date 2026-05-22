/**
 * AI 配置弹窗
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Slider,
} from '@mui/material';
import { useAIStore } from '../../stores/aiStore';
import { aiService } from '../../services/aiService';

export const AIConfigDialog: React.FC = () => {
  const {
    configDialogOpen,
    setConfigDialogOpen,
    config,
    saveConfig,
  } = useAIStore();

  const [form, setForm] = useState({
    apiEndpoint: config.apiEndpoint,
    apiKey: config.apiKey,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    setForm({
      apiEndpoint: config.apiEndpoint,
      apiKey: config.apiKey,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
  }, [config, configDialogOpen]);

  const handleSave = async () => {
    await saveConfig(form);
    setConfigDialogOpen(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const success = await aiService.testConnection({
      ...config,
      ...form,
    });
    setTestResult(success ? 'success' : 'error');
    setTesting(false);
  };

  return (
    <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>AI 配置</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          API Key 存储在浏览器本地，请确保使用安全的环境。
        </Alert>

        <TextField
          label="API 地址"
          value={form.apiEndpoint}
          onChange={(e) => setForm({ ...form, apiEndpoint: e.target.value })}
          fullWidth
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
          placeholder="https://api.openai.com/v1/chat/completions"
        />

        <TextField
          label="API Key"
          value={form.apiKey}
          onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
          fullWidth
          variant="outlined"
          size="small"
          type="password"
          sx={{ mb: 2 }}
        />

        <TextField
          label="模型"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          fullWidth
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
          placeholder="gpt-4o"
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Temperature: {form.temperature}
          </Typography>
          <Slider
            value={form.temperature}
            onChange={(_, v) => setForm({ ...form, temperature: v as number })}
            min={0}
            max={2}
            step={0.1}
          />
        </Box>

        <TextField
          label="Max Tokens"
          value={form.maxTokens}
          onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) || 2048 })}
          fullWidth
          variant="outlined"
          size="small"
          type="number"
          sx={{ mb: 2 }}
        />

        {testResult && (
          <Alert severity={testResult === 'success' ? 'success' : 'error'} sx={{ mb: 2 }}>
            {testResult === 'success' ? '连接成功！' : '连接失败，请检查配置。'}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleTest} disabled={testing || !form.apiKey}>
          {testing ? '测试中...' : '测试连接'}
        </Button>
        <Button onClick={() => setConfigDialogOpen(false)}>取消</Button>
        <Button onClick={handleSave} variant="contained">保存</Button>
      </DialogActions>
    </Dialog>
  );
};
