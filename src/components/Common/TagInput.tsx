/**
 * 标签输入组件
 */
import React, { useState } from 'react';
import { Box, Chip, TextField, IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  placeholder = '添加标签',
  maxTags = 20,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
      onChange([...tags, trimmed]);
      setInputValue('');
    }
  };

  const handleDelete = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
      {tags.map((tag) => (
        <Chip
          key={tag}
          label={tag}
          size="small"
          onDelete={() => handleDelete(tag)}
          color="primary"
          variant="outlined"
        />
      ))}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TextField
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          variant="standard"
          size="small"
          sx={{ minWidth: 80 }}
          disabled={tags.length >= maxTags}
        />
        <IconButton size="small" onClick={handleAdd} disabled={!inputValue.trim()}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};
