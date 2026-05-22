/**
 * 人物关系图页 - 完整交互版
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Snackbar, Alert, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Add as AddIcon, DeviceHub as GraphIcon, AutoAwesome as AIIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useCharacterStore } from '../../stores/characterStore';
import { useRelationStore } from '../../stores/relationStore';
import { useAppStore } from '../../stores/appStore';
import { RelationGraph } from './RelationGraph';
import { RelationDialog } from './RelationDialog';
import { EmptyState } from '../../components/Common/EmptyState';
import { AIGenerateDialog } from '../../components/AI/AIGenerateDialog';
import { aiGenerateService } from '../../services/aiGenerateService';
import type { Character } from '../../types/character';

export const RelationPage: React.FC = () => {
  const { characters, loadCharacters, createCharacter, deleteCharacter, updateCharacter } = useCharacterStore();
  const { relations, loadRelations, createRelation, updateRelation, deleteRelation } = useRelationStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // 编辑人物弹窗
  const [editCharDialogOpen, setEditCharDialogOpen] = useState(false);
  const [editChar, setEditChar] = useState<Character | null>(null);
  const [editCharName, setEditCharName] = useState('');
  const [editCharAppearance, setEditCharAppearance] = useState('');
  const [editCharPersonality, setEditCharPersonality] = useState('');
  const [editCharBackground, setEditCharBackground] = useState('');
  const [editCharFaction, setEditCharFaction] = useState('');

  useEffect(() => {
    loadCharacters();
    loadRelations();
  }, [loadCharacters, loadRelations]);

  /** AI 生成关系采纳处理 */
  const handleAIAdopt = async (content: string) => {
    const parsed = aiGenerateService.parseRelationResult(content);
    if (parsed.length === 0) {
      setSnackbar({ open: true, message: 'AI 生成的格式无法解析，请手动创建', severity: 'error' });
      return;
    }

    try {
      let count = 0;
      let skipped = 0;
      for (const rel of parsed) {
        const source = characters.find(
          (c) => c.name === rel.sourceName || c.alias === rel.sourceName,
        );
        const target = characters.find(
          (c) => c.name === rel.targetName || c.alias === rel.targetName,
        );

        if (source && target) {
          await createRelation({
            sourceId: source.id,
            targetId: target.id,
            relationType: rel.relationType,
            description: rel.description,
          });
          count++;
        } else {
          skipped++;
        }
      }

      const msg = skipped > 0
        ? `成功创建 ${count} 条关系，${skipped} 条因找不到对应人物而跳过`
        : `成功创建 ${count} 条关系`;
      setSnackbar({ open: true, message: msg, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '创建失败：' + (err instanceof Error ? err.message : '未知错误'), severity: 'error' });
    }
  };

  /** 编辑关系（从图中的边点击） */
  const handleEditRelation = useCallback(async (id: string, relationType: string, description: string) => {
    try {
      await updateRelation(id, { relationType, description });
      setSnackbar({ open: true, message: '关系已更新', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '更新失败', severity: 'error' });
    }
  }, [updateRelation]);

  /** 删除关系（从图中的边点击） */
  const handleDeleteRelation = useCallback(async (id: string) => {
    try {
      await deleteRelation(id);
      setSnackbar({ open: true, message: '关系已删除', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '删除失败', severity: 'error' });
    }
  }, [deleteRelation]);

  /** 从图中添加关系（右键菜单） */
  const handleGraphAddRelation = useCallback(async (sourceId: string, targetId: string, relationType: string, description: string) => {
    try {
      await createRelation({ sourceId, targetId, relationType, description });
      setSnackbar({ open: true, message: '关系已创建', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '创建失败', severity: 'error' });
    }
  }, [createRelation]);

  /** 编辑人物（从图中右键菜单） */
  const handleEditCharacter = useCallback((character: Character) => {
    setEditChar(character);
    setEditCharName(character.name);
    setEditCharAppearance(character.appearance);
    setEditCharPersonality(character.personality);
    setEditCharBackground(character.background);
    setEditCharFaction(character.faction);
    setEditCharDialogOpen(true);
  }, []);

  /** 删除人物（从图中右键菜单） */
  const handleDeleteCharacter = useCallback(async (characterId: string) => {
    try {
      await deleteCharacter(characterId);
      setSnackbar({ open: true, message: '人物已删除', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '删除失败', severity: 'error' });
    }
  }, [deleteCharacter]);

  /** 保存人物编辑 */
  const handleSaveCharacterEdit = async () => {
    if (!editChar || !editCharName.trim()) return;
    try {
      await updateCharacter(editChar.id, {
        name: editCharName.trim(),
        appearance: editCharAppearance,
        personality: editCharPersonality,
        background: editCharBackground,
        faction: editCharFaction,
      });
      setEditCharDialogOpen(false);
      setSnackbar({ open: true, message: '人物信息已更新', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '更新失败', severity: 'error' });
    }
  };

  if (characters.length < 2) {
    return (
      <>
        <EmptyState
          icon={<GraphIcon />}
          title="需要至少两个人物"
          description="请先在人物页面创建至少两个人物，然后才能建立关系图"
          actionLabel="去创建人物"
          onAction={() => {
            useAppStore.getState().setCurrentPage('character');
          }}
        />
        <AIGenerateDialog
          open={aiDialogOpen}
          module="relation"
          moduleLabel="人物关系"
          existingNames={characters.map((c) => c.name)}
          existingContext={characters.map((c) => `${c.name}${c.alias ? `(${c.alias})` : ''}${c.personality ? ` - ${c.personality}` : ''}`).join('\n')}
          onAdopt={handleAIAdopt}
          onClose={() => setAiDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 工具栏 */}
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          💡 拖拽移动节点 · 点击关系标签编辑 · 右键节点添加关系/编辑/删除
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<AIIcon />} onClick={() => setAiDialogOpen(true)} color="secondary" size="small">
            AI生成关系
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} size="small">
            添加关系
          </Button>
        </Box>
      </Box>

      {/* 关系图 */}
      <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <RelationGraph
          characters={characters}
          relations={relations}
          onEditRelation={handleEditRelation}
          onDeleteRelation={handleDeleteRelation}
          onAddRelation={handleGraphAddRelation}
          onDeleteCharacter={handleDeleteCharacter}
          onEditCharacter={handleEditCharacter}
        />
      </Box>

      {/* 手动添加关系弹窗 */}
      <RelationDialog
        open={dialogOpen}
        characters={characters}
        onConfirm={async (sourceId, targetId, relationType, description) => {
          await createRelation({ sourceId, targetId, relationType, description });
          setDialogOpen(false);
        }}
        onCancel={() => setDialogOpen(false)}
      />

      {/* AI生成弹窗 */}
      <AIGenerateDialog
        open={aiDialogOpen}
        module="relation"
        moduleLabel="人物关系"
        existingNames={characters.map((c) => c.name)}
        existingContext={characters.map((c) => `${c.name}${c.alias ? `(${c.alias})` : ''}${c.personality ? ` - ${c.personality}` : ''}`).join('\n')}
        onAdopt={handleAIAdopt}
        onClose={() => setAiDialogOpen(false)}
      />

      {/* 编辑人物弹窗 */}
      <Dialog open={editCharDialogOpen} onClose={() => setEditCharDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑人物</DialogTitle>
        <DialogContent>
          <TextField
            label="姓名"
            value={editCharName}
            onChange={(e) => setEditCharName(e.target.value)}
            fullWidth
            size="small"
            sx={{ mt: 1, mb: 1.5 }}
          />
          <TextField
            label="外貌"
            value={editCharAppearance}
            onChange={(e) => setEditCharAppearance(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="性格"
            value={editCharPersonality}
            onChange={(e) => setEditCharPersonality(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="背景"
            value={editCharBackground}
            onChange={(e) => setEditCharBackground(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="所属势力"
            value={editCharFaction}
            onChange={(e) => setEditCharFaction(e.target.value)}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCharDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleSaveCharacterEdit} disabled={!editCharName.trim()}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

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
