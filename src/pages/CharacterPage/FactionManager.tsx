/**
 * 家族/组织管理组件
 * 在角色页面中以标签页形式展示
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useFactionStore } from '../../stores/factionStore';
import { useCharacterStore } from '../../stores/characterStore';
import { FactionType, FACTION_TYPE_LABELS, FACTION_TYPE_ICONS } from '../../types/faction';
import type { Faction, CreateFactionParams, UpdateFactionParams } from '../../types/faction';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';
import { TagInput } from '../../components/Common/TagInput';

const FACTION_COLORS = [
  '#1976d2', '#2e7d32', '#ed6c02', '#9c27b0',
  '#d32f2f', '#00838f', '#f57c00', '#5d4037',
  '#0288d1', '#689f38', '#c2185b', '#455a64',
];

export const FactionManager: React.FC = () => {
  const { factions, loadFactions, createFaction, updateFaction, deleteFaction, selectedFactionId, selectFaction } = useFactionStore();
  const { characters, loadCharacters, updateCharacter } = useCharacterStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // 表单状态
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState<FactionType>(FactionType.ORGANIZATION);
  const [formParentId, setFormParentId] = useState('');
  const [formLeaderId, setFormLeaderId] = useState('');
  const [formColor, setFormColor] = useState('#1976d2');
  const [formTags, setFormTags] = useState<string[]>([]);

  useEffect(() => {
    loadFactions();
    loadCharacters();
  }, [loadFactions, loadCharacters]);

  const selectedFaction = factions.find((f) => f.id === selectedFactionId) ?? null;

  // 获取组织的成员
  const getMembers = (factionId: string) => characters.filter((c) => c.factionId === factionId);

  // 获取子组织
  const getChildren = (parentId: string) => factions.filter((f) => f.parentId === parentId);

  // 顶级组织
  const rootFactions = factions.filter((f) => !f.parentId || f.parentId === '');

  const openCreateDialog = () => {
    setEditMode(false);
    setFormName('');
    setFormDesc('');
    setFormType(FactionType.ORGANIZATION);
    setFormParentId('');
    setFormLeaderId('');
    setFormColor(FACTION_COLORS[Math.floor(Math.random() * FACTION_COLORS.length)]);
    setFormTags([]);
    setDialogOpen(true);
  };

  const openEditDialog = (faction: Faction) => {
    setEditMode(true);
    setFormName(faction.name);
    setFormDesc(faction.description);
    setFormType(faction.factionType);
    setFormParentId(faction.parentId);
    setFormLeaderId(faction.leaderId);
    setFormColor(faction.color);
    setFormTags(faction.tags);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    try {
      if (editMode && selectedFactionId) {
        const params: UpdateFactionParams = {
          name: formName.trim(),
          description: formDesc.trim(),
          factionType: formType,
          parentId: formParentId,
          leaderId: formLeaderId,
          color: formColor,
          tags: formTags,
        };
        await updateFaction(selectedFactionId, params);
        setSnackbar({ open: true, message: '组织已更新', severity: 'success' });
      } else {
        const params: CreateFactionParams = {
          name: formName.trim(),
          description: formDesc.trim(),
          factionType: formType,
          parentId: formParentId,
          leaderId: formLeaderId,
          color: formColor,
          tags: formTags,
        };
        const faction = await createFaction(params);
        selectFaction(faction.id);
        setSnackbar({ open: true, message: '组织已创建', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: '操作失败', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteFaction(deleteConfirm);
      setDeleteConfirm(null);
      setSnackbar({ open: true, message: '组织已删除', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '删除失败', severity: 'error' });
    }
  };

  /** 将角色加入组织 */
  const handleAddMember = useCallback(async (characterId: string, factionId: string) => {
    const faction = factions.find((f) => f.id === factionId);
    await updateCharacter(characterId, {
      factionId,
      faction: faction?.name ?? '',
    });
  }, [factions, updateCharacter]);

  /** 将角色移出组织 */
  const handleRemoveMember = useCallback(async (characterId: string) => {
    await updateCharacter(characterId, { factionId: '', faction: '' });
  }, [updateCharacter]);

  // 可加入组织的角色（未加入任何组织的）
  const availableMembers = characters.filter((c) => !c.factionId);

  /** 渲染组织树 */
  const renderFactionItem = (faction: Faction, depth: number = 0): React.ReactNode => {
    const members = getMembers(faction.id);
    const children = getChildren(faction.id);
    const isSelected = selectedFactionId === faction.id;
    const leader = characters.find((c) => c.id === faction.leaderId);
    const icon = FACTION_TYPE_ICONS[faction.factionType] || '🏢';

    return (
      <Box key={faction.id}>
        <Card
          sx={{
            mb: 1,
            ml: depth * 2,
            border: isSelected ? 2 : 0,
            borderColor: faction.color,
            cursor: 'pointer',
            '&:hover': { boxShadow: 3 },
          }}
          elevation={isSelected ? 3 : 1}
          onClick={() => selectFaction(faction.id)}
        >
          <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: faction.color, width: 32, height: 32, fontSize: '1rem' }}>
                {icon}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {faction.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {FACTION_TYPE_LABELS[faction.factionType]}
                  {leader ? ` · 首领: ${leader.name}` : ''}
                  {members.length > 0 ? ` · ${members.length}人` : ''}
                </Typography>
              </Box>
              {isSelected && (
                <Box>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditDialog(faction); }}>
                    <EditIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(faction.id); }}>
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
        {children.map((child) => renderFactionItem(child, depth + 1))}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      {/* 左侧：组织列表 */}
      <Box sx={{ width: 360, flexShrink: 0, overflow: 'auto' }}>
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            组织列表
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={openCreateDialog}>
            新增组织
          </Button>
        </Box>

        {factions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <GroupIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              还没有组织
            </Typography>
            <Typography variant="caption" color="text.secondary">
              创建家族、门派、势力等组织来管理角色
            </Typography>
          </Box>
        ) : (
          rootFactions.map((faction) => renderFactionItem(faction))
        )}
      </Box>

      {/* 右侧：组织详情 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {selectedFaction ? (
          <Card sx={{ height: '100%', overflow: 'auto' }}>
            <CardContent sx={{ p: 3 }}>
              {/* 组织头部 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: selectedFaction.color, width: 48, height: 48, fontSize: '1.5rem' }}>
                  {FACTION_TYPE_ICONS[selectedFaction.factionType]}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" fontWeight={600}>
                    {selectedFaction.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <Chip
                      label={FACTION_TYPE_LABELS[selectedFaction.factionType]}
                      size="small"
                      sx={{ bgcolor: `${selectedFaction.color}22`, color: selectedFaction.color, fontWeight: 600 }}
                    />
                    {selectedFaction.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* 首领 */}
              {(() => {
                const leader = characters.find((c) => c.id === selectedFaction.leaderId);
                if (!leader) return null;
                return (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">首领</Typography>
                    <Chip
                      icon={<PersonIcon />}
                      label={leader.name}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                );
              })()}

              {/* 描述 */}
              {selectedFaction.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>描述</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedFaction.description}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* 成员列表 */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    成员 ({getMembers(selectedFaction.id).length})
                  </Typography>
                  {availableMembers.length > 0 && (
                    <AddMemberSelect
                      availableMembers={availableMembers}
                      onAdd={(charId) => handleAddMember(charId, selectedFaction.id)}
                    />
                  )}
                </Box>

                {getMembers(selectedFaction.id).length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    暂无成员
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {getMembers(selectedFaction.id).map((char) => (
                      <Chip
                        key={char.id}
                        icon={<PersonIcon />}
                        label={char.name + (char.alias ? ` (${char.alias})` : '')}
                        onDelete={() => handleRemoveMember(char.id)}
                        variant="outlined"
                        sx={{ borderColor: selectedFaction.color }}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              {/* 子组织 */}
              {getChildren(selectedFaction.id).length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                    下级组织
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {getChildren(selectedFaction.id).map((child) => (
                      <Chip
                        key={child.id}
                        avatar={<Avatar sx={{ bgcolor: child.color }}>{FACTION_TYPE_ICONS[child.factionType]}</Avatar>}
                        label={child.name}
                        onClick={() => selectFaction(child.id)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary">选择左侧组织查看详情</Typography>
          </Box>
        )}
      </Box>

      {/* 创建/编辑弹窗 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? '编辑组织' : '创建组织'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>组织类型</InputLabel>
            <Select value={formType} label="组织类型" onChange={(e) => setFormType(e.target.value as FactionType)}>
              {Object.values(FactionType).map((type) => (
                <MenuItem key={type} value={type}>
                  {FACTION_TYPE_ICONS[type]} {FACTION_TYPE_LABELS[type]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            label="组织名称"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
            autoFocus
          />
          <TextField
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            label="描述"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            sx={{ mb: 2 }}
            placeholder="描述这个组织的背景、理念..."
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>上级组织</InputLabel>
              <Select value={formParentId} label="上级组织" onChange={(e) => setFormParentId(e.target.value)}>
                <MenuItem value="">无</MenuItem>
                {factions
                  .filter((f) => f.id !== selectedFactionId)
                  .map((f) => (
                    <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>首领</InputLabel>
              <Select value={formLeaderId} label="首领" onChange={(e) => setFormLeaderId(e.target.value)}>
                <MenuItem value="">未指定</MenuItem>
                {characters.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}{c.alias ? ` (${c.alias})` : ''}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {/* 标识颜色 */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>标识颜色</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {FACTION_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => setFormColor(color)}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: color,
                  cursor: 'pointer',
                  border: formColor === color ? 3 : 0,
                  borderColor: 'black',
                  transition: 'transform 0.1s',
                  '&:hover': { transform: 'scale(1.2)' },
                }}
              />
            ))}
          </Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>标签</Typography>
          <TagInput tags={formTags} onChange={setFormTags} placeholder="添加标签" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formName.trim()}>
            {editMode ? '保存' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="删除组织"
        message="确定要删除此组织吗？组织内的角色将自动移出，下级组织的归属关系将解除。"
        confirmColor="error"
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Box>
  );
};

/** 添加成员的小组件 */
const AddMemberSelect: React.FC<{
  availableMembers: { id: string; name: string; alias: string }[];
  onAdd: (charId: string) => void;
}> = ({ availableMembers, onAdd }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="small" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
        添加成员
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>选择要加入的角色</DialogTitle>
        <DialogContent>
          {availableMembers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              所有角色都已加入组织
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {availableMembers.map((c) => (
                <Button
                  key={c.id}
                  variant="outlined"
                  size="small"
                  startIcon={<PersonIcon />}
                  onClick={() => { onAdd(c.id); setOpen(false); }}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {c.name}{c.alias ? ` (${c.alias})` : ''}
                </Button>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
