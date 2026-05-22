/**
 * 人物管理页
 */
import React, { useEffect, useState } from 'react';
import { Box, Button, Snackbar, Alert } from '@mui/material';
import { Add as AddIcon, Person as PersonIcon, AutoAwesome as AIIcon } from '@mui/icons-material';
import { useCharacterStore } from '../../stores/characterStore';
import { CharacterCardList } from './CharacterCardList';
import { CharacterDetail } from './CharacterDetail';
import { CharacterDialog } from './CharacterDialog';
import { EmptyState } from '../../components/Common/EmptyState';
import { AIGenerateDialog } from '../../components/AI/AIGenerateDialog';
import { aiGenerateService } from '../../services/aiGenerateService';

export const CharacterPage: React.FC = () => {
  const { characters, selectedCharacterId, loadCharacters, createCharacter, selectCharacter } = useCharacterStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  const handleCreate = async (name: string, alias: string) => {
    await createCharacter({ name, alias });
    setDialogOpen(false);
  };

  /** AI 生成人物采纳处理 */
  const handleAIAdopt = async (content: string) => {
    const parsed = aiGenerateService.parseCharacterResult(content);
    if (parsed.length === 0) {
      setSnackbar({ open: true, message: 'AI 生成的格式无法解析，请手动创建', severity: 'error' });
      return;
    }

    try {
      let count = 0;
      for (const char of parsed) {
        await createCharacter({
          name: char.name,
          alias: char.alias,
          appearance: char.appearance,
          personality: char.personality,
          background: char.background,
          faction: char.faction,
        });
        count++;
      }
      setSnackbar({ open: true, message: `成功创建 ${count} 个人物`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '创建失败：' + (err instanceof Error ? err.message : '未知错误'), severity: 'error' });
    }
  };

  if (characters.length === 0) {
    return (
      <>
        <EmptyState
          icon={<PersonIcon />}
          title="还没有人物"
          description="创建人物卡片来管理你的故事角色"
          actionLabel="创建第一个人物"
          onAction={() => setDialogOpen(true)}
        />
        <Box sx={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)' }}>
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={() => setAiDialogOpen(true)}
            sx={{ borderColor: 'primary.main', color: 'primary.main' }}
          >
            AI 一键生成人物
          </Button>
        </Box>
        <CharacterDialog
          open={dialogOpen}
          onConfirm={handleCreate}
          onCancel={() => setDialogOpen(false)}
        />
        <AIGenerateDialog
          open={aiDialogOpen}
          module="character"
          moduleLabel="人物"
          existingNames={characters.map((c) => c.name)}
          existingContext={characters.length > 0 ? ['已有人物：', ...characters.map((c) => `- ${c.name}${c.alias ? `（${c.alias}）` : ''}${c.personality ? `：${c.personality}` : ''}${c.faction ? ` | 势力：${c.faction}` : ''}`)].join('\n') : undefined}
          onAdopt={handleAIAdopt}
          onClose={() => setAiDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      {/* 左侧人物卡片列表 */}
      <Box sx={{ width: 360, flexShrink: 0, overflow: 'auto' }}>
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Button size="small" startIcon={<AIIcon />} onClick={() => setAiDialogOpen(true)} color="secondary">
            AI生成
          </Button>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            新增人物
          </Button>
        </Box>
        <CharacterCardList
          characters={characters}
          selectedId={selectedCharacterId}
          onSelect={selectCharacter}
        />
      </Box>

      {/* 右侧详情 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {selectedCharacter ? (
          <CharacterDetail character={selectedCharacter} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ color: '#999' }}>选择左侧人物查看详情</span>
          </Box>
        )}
      </Box>

      <CharacterDialog
        open={dialogOpen}
        onConfirm={handleCreate}
        onCancel={() => setDialogOpen(false)}
      />

      <AIGenerateDialog
        open={aiDialogOpen}
        module="character"
        moduleLabel="人物"
        existingNames={characters.map((c) => c.name)}
        existingContext={characters.length > 0 ? ['已有人物：', ...characters.map((c) => `- ${c.name}${c.alias ? `（${c.alias}）` : ''}${c.personality ? `：${c.personality}` : ''}${c.faction ? ` | 势力：${c.faction}` : ''}`)].join('\n') : undefined}
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
