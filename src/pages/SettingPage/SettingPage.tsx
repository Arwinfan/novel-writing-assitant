/**
 * 设定管理页
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import { Add as AddIcon, Settings as SettingsIcon, AutoAwesome as AIIcon } from '@mui/icons-material';
import { useSettingStore } from '../../stores/settingStore';
import { SettingCategoryList } from './SettingCategoryList';
import { SettingItemEditor } from './SettingItemEditor';
import { SettingDialog } from './SettingDialog';
import { EmptyState } from '../../components/Common/EmptyState';
import { AIGenerateDialog } from '../../components/AI/AIGenerateDialog';
import { aiGenerateService } from '../../services/aiGenerateService';

/** 设定分类名称到图标映射 */
const CATEGORY_NAME_TO_ICON: Record<string, string> = {
  '地理': '🌍',
  '势力': '⚔️',
  '魔法体系': '✨',
  '科技': '🔧',
  '种族': '👥',
  '历史': '📜',
  '文化': '🎭',
  '其他': '📁',
};

export const SettingPage: React.FC = () => {
  const {
    categories, items, selectedCategoryId, selectedItemId,
    loadCategories, loadAllItems, createCategory, deleteCategory, selectCategory, selectItem, createItem,
  } = useSettingStore();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    loadCategories();
    loadAllItems();
  }, [loadCategories, loadAllItems]);

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const currentItems = selectedCategoryId
    ? items.filter((i) => i.categoryId === selectedCategoryId)
    : [];

  const handleCreateCategory = async (name: string, icon: string) => {
    await createCategory({ name, icon });
    setCategoryDialogOpen(false);
  };

  const handleCreateItem = async (name: string) => {
    if (selectedCategoryId) {
      await createItem({ categoryId: selectedCategoryId, name });
      setItemDialogOpen(false);
    }
  };

  /** AI 生成设定采纳处理 */
  const handleAIAdopt = async (content: string) => {
    const parsed = aiGenerateService.parseSettingResult(content);
    if (parsed.length === 0) {
      setSnackbar({ open: true, message: 'AI 生成的格式无法解析，请手动创建', severity: 'error' });
      return;
    }

    try {
      let count = 0;
      for (const item of parsed) {
        // 查找或创建分类
        let categoryId = selectedCategoryId;
        const categoryName = item.category;

        if (categoryName) {
          const existingCat = categories.find((c) => c.name === categoryName);
          if (existingCat) {
            categoryId = existingCat.id;
          } else {
            // 自动创建新分类
            const icon = CATEGORY_NAME_TO_ICON[categoryName] ?? '📁';
            const newCat = await createCategory({ name: categoryName, icon });
            categoryId = newCat.id;
          }
        }

        if (categoryId) {
          const newItem = await createItem({
            categoryId,
            name: item.name,
            content: item.content,
          });
          count++;
        }
      }
      setSnackbar({ open: true, message: `成功创建 ${count} 个设定项`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '创建失败：' + (err instanceof Error ? err.message : '未知错误'), severity: 'error' });
    }
  };

  /** 批量删除分类 */
  const handleBatchDelete = useCallback(async (ids: string[]) => {
    try {
      for (const id of ids) {
        await deleteCategory(id);
      }
      setSnackbar({ open: true, message: `已删除 ${ids.length} 个分类`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: '批量删除失败', severity: 'error' });
    }
  }, [deleteCategory]);

  if (categories.length === 0) {
    return (
      <>
        <EmptyState
          icon={<SettingsIcon />}
          title="还没有设定分类"
          description="创建设定分类来组织你的世界观设定"
          actionLabel="创建第一个分类"
          onAction={() => setCategoryDialogOpen(true)}
        />
        <Box sx={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)' }}>
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={() => setAiDialogOpen(true)}
            sx={{ borderColor: 'primary.main', color: 'primary.main' }}
          >
            AI 一键生成设定
          </Button>
        </Box>
        <SettingDialog
          open={categoryDialogOpen}
          onConfirm={handleCreateCategory}
          onCancel={() => setCategoryDialogOpen(false)}
        />
        <AIGenerateDialog
          open={aiDialogOpen}
          module="setting"
          moduleLabel="世界观设定"
          existingNames={items.map((i) => i.name)}
          existingContext={items.length > 0 ? ['已有设定：', ...items.map((i) => `- ${i.name}${i.content ? `：${i.content.slice(0, 80)}` : ''}`)].join('\n') : undefined}
          onAdopt={handleAIAdopt}
          onClose={() => setAiDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      {/* 左侧分类列表 */}
      <Box sx={{ width: 280, flexShrink: 0, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1, p: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">设定分类</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button size="small" startIcon={<AIIcon />} onClick={() => setAiDialogOpen(true)} color="secondary">
              AI
            </Button>
            <Button size="small" startIcon={<AddIcon />} onClick={() => setCategoryDialogOpen(true)}>
              新增
            </Button>
          </Box>
        </Box>
        <SettingCategoryList
          categories={categories}
          items={items}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={selectCategory}
          onSelectItem={selectItem}
          onAddItem={() => setItemDialogOpen(true)}
          onBatchDelete={handleBatchDelete}
        />
      </Box>

      {/* 右侧编辑区 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {selectedItem ? (
          <SettingItemEditor item={selectedItem} />
        ) : selectedCategoryId ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>选择一个设定项进行编辑</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setItemDialogOpen(true)}>
                添加设定项
              </Button>
              <Button variant="outlined" startIcon={<AIIcon />} onClick={() => setAiDialogOpen(true)} color="secondary">
                AI生成设定
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary">选择左侧分类</Typography>
          </Box>
        )}
      </Box>

      <SettingDialog
        open={categoryDialogOpen}
        onConfirm={handleCreateCategory}
        onCancel={() => setCategoryDialogOpen(false)}
      />

      <SettingDialog
        open={itemDialogOpen}
        isItem
        onConfirm={async (_name, _icon, itemName) => { if (itemName) await handleCreateItem(itemName); }}
        onCancel={() => setItemDialogOpen(false)}
      />

      <AIGenerateDialog
        open={aiDialogOpen}
        module="setting"
        moduleLabel="世界观设定"
        existingNames={items.map((i) => i.name)}
        existingContext={items.length > 0 ? ['已有设定：', ...items.map((i) => `- ${i.name}${i.content ? `：${i.content.slice(0, 80)}` : ''}`)].join('\n') : undefined}
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
