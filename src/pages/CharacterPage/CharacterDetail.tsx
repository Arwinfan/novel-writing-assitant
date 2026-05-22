/**
 * 人物详情/编辑
 */
import React from 'react';
import {
  Card,
  CardContent,
  TextField,
  Typography,
  Box,
  IconButton,
  Button,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import type { Character } from '../../types/character';
import { useCharacterStore } from '../../stores/characterStore';
import { EditableText } from '../../components/Common/EditableText';
import { TagInput } from '../../components/Common/TagInput';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';

interface CharacterDetailProps {
  character: Character;
}

export const CharacterDetail: React.FC<CharacterDetailProps> = ({ character }) => {
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const deleteCharacter = useCharacterStore((s) => s.deleteCharacter);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleUpdate = async (params: import('../../types/character').UpdateCharacterParams) => {
    await updateCharacter(character.id, params);
  };

  const handleDelete = async () => {
    await deleteCharacter(character.id);
    setConfirmOpen(false);
  };

  return (
    <Card sx={{ height: '100%', overflow: 'auto' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {character.name.charAt(0)}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <EditableText
              value={character.name}
              onChange={(v) => handleUpdate({ name: v })}
              variant="h5"
              fontWeight={600}
              placeholder="人物名称"
            />
          </Box>
          <IconButton color="error" onClick={() => setConfirmOpen(true)}>
            <DeleteIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
          <TextField
            label="别名"
            value={character.alias}
            onChange={(e) => handleUpdate({ alias: e.target.value })}
            variant="outlined"
            size="small"
            fullWidth
          />
          <TextField
            label="阵营"
            value={character.faction}
            onChange={(e) => handleUpdate({ faction: e.target.value })}
            variant="outlined"
            size="small"
            fullWidth
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>外貌</Typography>
          <TextField
            value={character.appearance}
            onChange={(e) => handleUpdate({ appearance: e.target.value })}
            multiline
            rows={2}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="描述人物的外貌特征..."
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>性格</Typography>
          <TextField
            value={character.personality}
            onChange={(e) => handleUpdate({ personality: e.target.value })}
            multiline
            rows={2}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="描述人物的性格特点..."
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>背景</Typography>
          <TextField
            value={character.background}
            onChange={(e) => handleUpdate({ background: e.target.value })}
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="描述人物的背景故事..."
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>标签</Typography>
          <TagInput
            tags={character.tags}
            onChange={(tags) => handleUpdate({ tags })}
            placeholder="添加标签"
          />
        </Box>

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            创建于 {new Date(character.createdAt).toLocaleString()} · 更新于 {new Date(character.updatedAt).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        title="删除人物"
        message={`确定要删除人物"${character.name}"吗？所有引用该人物的内容将收到影响提醒。`}
        confirmColor="error"
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
};
