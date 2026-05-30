/**
 * 搜索框组件
 */
import React, { useState, useRef, useEffect } from 'react';
import { TextField, InputAdornment, Popper, Paper, List, ListItem, ListItemText, ListItemIcon, Box, Typography } from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon, AccountTree as OutlineIcon, Settings as SettingIcon } from '@mui/icons-material';
import { useAppStore } from '../../stores/appStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useOutlineStore } from '../../stores/outlineStore';
import { useSettingStore } from '../../stores/settingStore';

interface SearchResult {
  id: string;
  type: string;
  label: string;
  sublabel?: string;
}

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const characters = useCharacterStore((s) => s.characters);
  const outlineNodes = useOutlineStore((s) => s.nodes);
  const settingItems = useSettingStore((s) => s.items);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const q = query.toLowerCase();
    const found: SearchResult[] = [];

    for (const char of characters) {
      if (char.name.toLowerCase().includes(q) || char.alias.toLowerCase().includes(q)) {
        found.push({ id: char.id, type: 'character', label: char.name, sublabel: '角色' });
      }
    }

    for (const node of outlineNodes) {
      if (node.title.toLowerCase().includes(q)) {
        found.push({ id: node.id, type: 'outline', label: node.title, sublabel: '大纲节点' });
      }
    }

    for (const item of settingItems) {
      if (item.name.toLowerCase().includes(q)) {
        found.push({ id: item.id, type: 'setting', label: item.name, sublabel: '设定项' });
      }
    }

    setResults(found.slice(0, 10));
    setOpen(found.length > 0);
  }, [query, characters, outlineNodes, settingItems]);

  const handleSelect = (result: SearchResult) => {
    setCurrentPage(result.type);
    setQuery('');
    setOpen(false);
  };

  const iconMap: Record<string, React.ReactElement> = {
    character: <PersonIcon fontSize="small" />,
    outline: <OutlineIcon fontSize="small" />,
    setting: <SettingIcon fontSize="small" />,
  };

  return (
    <Box ref={anchorRef} sx={{ width: '100%' }}>
      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索角色、大纲、设定..."
        variant="outlined"
        size="small"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'grey.100',
          },
        }}
      />
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={{ zIndex: 1300, width: anchorRef.current?.offsetWidth }}
      >
        <Paper elevation={3} sx={{ mt: 0.5 }}>
          <List dense>
            {results.map((r) => (
              <ListItem key={`${r.type}-${r.id}`} onClick={() => handleSelect(r)} sx={{ cursor: 'pointer' }}>
                <ListItemIcon sx={{ minWidth: 32 }}>{iconMap[r.type]}</ListItemIcon>
                <ListItemText primary={r.label} secondary={r.sublabel} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Popper>
    </Box>
  );
};
