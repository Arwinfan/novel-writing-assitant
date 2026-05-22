/**
 * AI 对话面板
 */
import React, { useRef, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Delete as ClearIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
} from '@mui/icons-material';
import { useAIStore } from '../../stores/aiStore';
import { AIConfigDialog } from './AIConfigDialog';

export const AIChatPanel: React.FC = () => {
  const {
    chatPanelOpen,
    messages,
    isGenerating,
    sendMessage,
    clearMessages,
    setChatPanelOpen,
  } = useAIStore();

  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={chatPanelOpen}
        onClose={() => setChatPanelOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 420,
          },
        }}
      >
        {/* 头部 */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BotIcon color="primary" />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AI 创作助手
          </Typography>
          <IconButton size="small" onClick={clearMessages} title="清空对话">
            <ClearIcon />
          </IconButton>
          <IconButton onClick={() => setChatPanelOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* 消息列表 */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {messages.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <BotIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography color="text.secondary">开始与 AI 创作助手对话</Typography>
              <Typography variant="caption" color="text.secondary">
                你可以让 AI 帮你续写、提供建议或完善设定
              </Typography>
            </Box>
          )}

          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                gap: 1,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: msg.role === 'user' ? 'secondary.main' : 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {msg.role === 'user' ? <UserIcon sx={{ fontSize: 16 }} /> : <BotIcon sx={{ fontSize: 16 }} />}
              </Box>
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: '80%',
                  bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
              </Paper>
            </Box>
          ))}

          {isGenerating && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <BotIcon color="primary" sx={{ fontSize: 28 }} />
              <CircularProgress size={20} />
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        {/* 输入区 */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的创作需求..."
              multiline
              maxRows={4}
              fullWidth
              size="small"
              disabled={isGenerating}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              sx={{ minWidth: 40, px: 1 }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Box>
      </Drawer>

      <AIConfigDialog />
    </>
  );
};
