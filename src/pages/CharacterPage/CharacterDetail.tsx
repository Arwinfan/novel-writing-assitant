/**
 * 角色详情/编辑 - 含角色关系管理
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Typography,
  Box,
  IconButton,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import type { Character } from '../../types/character';
import type { Relation } from '../../types/relation';
import { useCharacterStore } from '../../stores/characterStore';
import { useRelationStore } from '../../stores/relationStore';
import { EditableText } from '../../components/Common/EditableText';
import { TagInput } from '../../components/Common/TagInput';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';

/** 常用关系类型 */
const COMMON_RELATION_TYPES = [
  '师徒', '朋友', '恋人', '敌对', '盟友',
  '主仆', '亲缘', '暗恋', '利用', '竞争',
  '同门', '搭档', '夫妻', '兄弟姐妹', '宿敌',
];

/** 关系类型颜色映射 */
const RELATION_COLORS: Record<string, string> = {
  '师徒': '#4caf50',
  '朋友': '#2196f3',
  '恋人': '#e91e63',
  '敌对': '#c62828',
  '盟友': '#1565c0',
  '主仆': '#ff9800',
  '亲缘': '#9c27b0',
  '暗恋': '#f06292',
  '利用': '#795548',
  '竞争': '#ff5722',
  '同门': '#00bcd4',
  '搭档': '#009688',
  '夫妻': '#e91e63',
  '兄弟姐妹': '#9c27b0',
  '宿敌': '#b71c1c',
};

interface CharacterDetailProps {
  character: Character;
}

export const CharacterDetail: React.FC<CharacterDetailProps> = ({ character }) => {
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const deleteCharacter = useCharacterStore((s) => s.deleteCharacter);
  const characters = useCharacterStore((s) => s.characters);
  const { relations, loadRelations, createRelation, updateRelation, deleteRelation } = useRelationStore();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addRelOpen, setAddRelOpen] = useState(false);
  const [editRelOpen, setEditRelOpen] = useState(false);
  const [deleteRelConfirm, setDeleteRelConfirm] = useState<string | null>(null);

  // 添加关系表单
  const [targetId, setTargetId] = useState('');
  const [newRelType, setNewRelType] = useState('');
  const [newRelDesc, setNewRelDesc] = useState('');

  // 编辑关系表单
  const [editingRel, setEditingRel] = useState<Relation | null>(null);
  const [editRelType, setEditRelType] = useState('');
  const [editRelDesc, setEditRelDesc] = useState('');

  useEffect(() => {
    loadRelations();
  }, [loadRelations]);

  // 获取与当前角色相关的所有关系
  const charRelations = relations.filter(
    (r) => r.sourceId === character.id || r.targetId === character.id
  );

  // 获取关系的另一方角色名
  const getOtherChar = (rel: Relation): Character | undefined => {
    const otherId = rel.sourceId === character.id ? rel.targetId : rel.sourceId;
    return characters.find((c) => c.id === otherId);
  };

  const handleUpdate = async (params: import('../../types/character').UpdateCharacterParams) => {
    await updateCharacter(character.id, params);
  };

  const handleDelete = async () => {
    await deleteCharacter(character.id);
    setConfirmOpen(false);
  };

  /** 添加关系 */
  const handleAddRelation = async () => {
    if (!targetId || !newRelType) return;
    await createRelation({
      sourceId: character.id,
      targetId,
      relationType: newRelType,
      description: newRelDesc.trim(),
    });
    setAddRelOpen(false);
    setTargetId('');
    setNewRelType('');
    setNewRelDesc('');
  };

  /** 编辑关系 */
  const handleEditRelation = async () => {
    if (!editingRel || !editRelType) return;
    await updateRelation(editingRel.id, {
      relationType: editRelType,
      description: editRelDesc.trim(),
    });
    setEditRelOpen(false);
    setEditingRel(null);
  };

  /** 删除关系 */
  const handleDeleteRelation = async () => {
    if (deleteRelConfirm) {
      await deleteRelation(deleteRelConfirm);
      setDeleteRelConfirm(null);
    }
  };

  // 可选的目标角色（排除自己）
  const availableTargets = characters.filter((c) => c.id !== character.id);

  return (
    <Card sx={{ height: '100%', overflow: 'auto' }}>
      <CardContent sx={{ p: 3 }}>
        {/* 头部：头像 + 名称 + 删除 */}
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
              placeholder="角色名称"
            />
          </Box>
          <IconButton color="error" onClick={() => setConfirmOpen(true)}>
            <DeleteIcon />
          </IconButton>
        </Box>

        {/* 别名 + 阵营 */}
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

        {/* 外貌 */}
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
            placeholder="描述角色的外貌特征..."
          />
        </Box>

        {/* 性格 */}
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
            placeholder="描述角色的性格特点..."
          />
        </Box>

        {/* 背景 */}
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
            placeholder="描述角色的背景故事..."
          />
        </Box>

        {/* 标签 */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>标签</Typography>
          <TagInput
            tags={character.tags}
            onChange={(tags) => handleUpdate({ tags })}
            placeholder="添加标签"
          />
        </Box>

        {/* ====== 角色关系区域 ====== */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            角色关系
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddRelOpen(true)}
            disabled={availableTargets.length === 0}
          >
            添加关系
          </Button>
        </Box>

        {charRelations.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            暂无关系，点击"添加关系"建立角色间的联系
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {charRelations.map((rel) => {
              const otherChar = getOtherChar(rel);
              const relColor = RELATION_COLORS[rel.relationType] || '#757575';
              return (
                <Box
                  key={rel.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  {/* 关系类型标签 */}
                  <Chip
                    label={rel.relationType}
                    size="small"
                    sx={{
                      bgcolor: `${relColor}22`,
                      color: relColor,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      minWidth: 48,
                    }}
                  />
                  {/* 对方角色 */}
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {otherChar?.name ?? '未知角色'}
                    {otherChar?.alias && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                        ({otherChar.alias})
                      </Typography>
                    )}
                  </Typography>
                  {/* 关系描述 */}
                  {rel.description && (
                    <Tooltip title={rel.description}>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                        {rel.description}
                      </Typography>
                    </Tooltip>
                  )}
                  {/* 操作按钮 */}
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingRel(rel);
                      setEditRelType(rel.relationType);
                      setEditRelDesc(rel.description);
                      setEditRelOpen(true);
                    }}
                  >
                    <EditIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteRelConfirm(rel.id)}
                  >
                    <LinkOffIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        )}

        {/* 时间戳 */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            创建于 {new Date(character.createdAt).toLocaleString()} · 更新于 {new Date(character.updatedAt).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>

      {/* 删除角色确认 */}
      <ConfirmDialog
        open={confirmOpen}
        title="删除角色"
        message={`确定要删除角色"${character.name}"吗？所有引用该角色的内容将收到影响提醒。`}
        confirmColor="error"
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* 删除关系确认 */}
      <ConfirmDialog
        open={!!deleteRelConfirm}
        title="删除关系"
        message="确定要删除这条角色关系吗？"
        confirmColor="error"
        confirmLabel="删除"
        onConfirm={handleDeleteRelation}
        onCancel={() => setDeleteRelConfirm(null)}
      />

      {/* 添加关系弹窗 */}
      <Dialog open={addRelOpen} onClose={() => setAddRelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加角色关系</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            当前角色：<strong>{character.name}</strong>
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>目标角色</InputLabel>
            <Select value={targetId} label="目标角色" onChange={(e) => setTargetId(e.target.value)}>
              {availableTargets.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}{c.alias ? ` (${c.alias})` : ''}
                  {c.faction ? ` - ${c.faction}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            value={newRelType}
            onChange={(e) => setNewRelType(e.target.value)}
            label="关系类型"
            fullWidth
            variant="outlined"
            sx={{ mb: 1 }}
            placeholder="如：师徒、朋友、敌对..."
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {COMMON_RELATION_TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                size="small"
                variant={newRelType === type ? 'filled' : 'outlined'}
                color={newRelType === type ? 'primary' : 'default'}
                onClick={() => setNewRelType(type)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
          <TextField
            value={newRelDesc}
            onChange={(e) => setNewRelDesc(e.target.value)}
            label="关系描述"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            placeholder="描述这段关系的细节..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRelOpen(false)}>取消</Button>
          <Button onClick={handleAddRelation} variant="contained" disabled={!targetId || !newRelType}>
            创建
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑关系弹窗 */}
      <Dialog open={editRelOpen} onClose={() => setEditRelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑角色关系</DialogTitle>
        <DialogContent>
          <TextField
            value={editRelType}
            onChange={(e) => setEditRelType(e.target.value)}
            label="关系类型"
            fullWidth
            variant="outlined"
            sx={{ mb: 1, mt: 1 }}
            placeholder="如：师徒、朋友、敌对..."
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {COMMON_RELATION_TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                size="small"
                variant={editRelType === type ? 'filled' : 'outlined'}
                color={editRelType === type ? 'primary' : 'default'}
                onClick={() => setEditRelType(type)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
          <TextField
            value={editRelDesc}
            onChange={(e) => setEditRelDesc(e.target.value)}
            label="关系描述"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            placeholder="描述这段关系的细节..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRelOpen(false)}>取消</Button>
          <Button onClick={handleEditRelation} variant="contained" disabled={!editRelType}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
