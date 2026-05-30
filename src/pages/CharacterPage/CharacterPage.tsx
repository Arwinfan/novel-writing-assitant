/**
 * 角色管理页 - 含角色和组织两个标签页
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Snackbar, Alert, Tabs, Tab } from '@mui/material';
import { Add as AddIcon, Person as PersonIcon, AutoAwesome as AIIcon, Group as GroupIcon } from '@mui/icons-material';
import { useCharacterStore } from '../../stores/characterStore';
import { CharacterCardList } from './CharacterCardList';
import { CharacterDetail } from './CharacterDetail';
import { CharacterDialog } from './CharacterDialog';
import { FactionManager } from './FactionManager';
import { EmptyState } from '../../components/Common/EmptyState';
import { AIGenerateDialog } from '../../components/AI/AIGenerateDialog';
import { aiGenerateService } from '../../services/aiGenerateService';

export const CharacterPage: React.FC = () => {
  const { characters, selectedCharacterId, loadCharacters, createCharacter, deleteCharacter, selectCharacter } = useCharacterStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
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

  /** AI 生成角色采纳处理 */
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
      setSnackbar({ open: true, message: `成功创建 ${count} 个角色`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '创建失败：' + (err instanceof Error ? err.message : '未知错误'), severity: 'error' });
    }
  };

  /** 批量删除角色 */
  const handleBatchDelete = useCallback(async (ids: string[]) => {
    try {
      for (const id of ids) {
        await deleteCharacter(id);
      }
      setSnackbar({ open: true, message: `已删除 ${ids.length} 个角色`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '批量删除失败', severity: 'error' });
    }
  }, [deleteCharacter]);

  if (characters.length === 0) {
    return (
      <>
        <EmptyState
          icon={<PersonIcon />}
          title="还没有角色"
          description="创建角色卡片来管理你的故事角色"
          actionLabel="创建第一个角色"
          onAction={() => setDialogOpen(true)}
        />
        <Box sx={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)' }}>
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={() => setAiDialogOpen(true)}
            sx={{ borderColor: 'primary.main', color: 'primary.main' }}
          >
            AI 一键生成角色
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
          moduleLabel="角色"
          existingNames={characters.map((c) => c.name)}
          existingContext={characters.length > 0 ? ['已有角色：', ...characters.map((c) => `- ${c.name}${c.alias ? `（${c.alias}）` : ''}${c.personality ? `：${c.personality}` : ''}${c.faction ? ` | 势力：${c.faction}` : ''}`)].join('\n') : undefined}
          onAdopt={handleAIAdopt}
          onClose={() => setAiDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 标签页切换 */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
      >
        <Tab icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="角色" sx={{ minHeight: 40, py: 0 }} />
        <Tab icon={<GroupIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="组织" sx={{ minHeight: 40, py: 0 }} />
      </Tabs>

      {/* 标签页内容 */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {activeTab === 0 ? (
          // 角色标签页
          <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
            {/* 左侧角色卡片列表 */}
            <Box sx={{ width: 360, flexShrink: 0, overflow: 'auto' }}>
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Button size="small" startIcon={<AIIcon />} onClick={() => setAiDialogOpen(true)} color="secondary">
                  AI生成
                </Button>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
                  新增角色
                </Button>
              </Box>
              <CharacterCardList
                characters={characters}
                selectedId={selectedCharacterId}
                onSelect={selectCharacter}
                onBatchDelete={handleBatchDelete}
              />
            </Box>

            {/* 右侧详情 */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {selectedCharacter ? (
                <CharacterDetail character={selectedCharacter} />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <span style={{ color: '#999' }}>选择左侧角色查看详情</span>
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          // 组织标签页
          <FactionManager />
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
        moduleLabel="角色"
        existingNames={characters.map((c) => c.name)}
        existingContext={characters.length > 0 ? ['已有角色：', ...characters.map((c) => `- ${c.name}${c.alias ? `（${c.alias}）` : ''}${c.personality ? `：${c.personality}` : ''}${c.faction ? ` | 势力：${c.faction}` : ''}`)].join('\n') : undefined}
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
