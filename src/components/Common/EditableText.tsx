/**
 * 可编辑文本组件
 * 点击展示文本，双击进入编辑模式
 */
import React, { useState, useRef, useEffect } from 'react';
import { TextField, Typography, Box, SxProps, Theme } from '@mui/material';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  variant?: 'h5' | 'h6' | 'subtitle1' | 'body1' | 'body2';
  placeholder?: string;
  sx?: SxProps<Theme>;
  multiline?: boolean;
  fontWeight?: number | string;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  variant = 'body1',
  placeholder = '点击输入...',
  sx,
  multiline = false,
  fontWeight,
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = () => {
    setEditing(true);
    setEditValue(value);
  };

  const handleBlur = () => {
    setEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <TextField
        inputRef={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        multiline={multiline}
        variant="standard"
        fullWidth
        size="small"
        sx={{ ...sx }}
      />
    );
  }

  return (
    <Box onDoubleClick={handleDoubleClick} sx={{ cursor: 'text', ...sx }}>
      <Typography variant={variant} sx={{ fontWeight, minHeight: '1.5em' }}>
        {value || <span style={{ color: '#999' }}>{placeholder}</span>}
      </Typography>
    </Box>
  );
};
