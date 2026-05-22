/**
 * 数据库服务集成测试
 * 使用 fake-indexeddb 模拟 IndexedDB
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import { OutlineNodeType } from '../../types/outline';
import { PlotlineType } from '../../types/plotline';
import { ReferenceEntityType } from '../../types/linkage';

// 重新导入 dbService 使其使用同一个 db 实例
import {
  outlineNodeService,
  plotlineService,
  plotlineNodeService,
  characterService,
  relationService,
  settingCategoryService,
  settingItemService,
  referenceService,
  impactAlertService,
  aiConfigService,
  projectConfigService,
} from '../../services/dbService';

const DEFAULT_PROJECT_ID = 'default-project';

describe('CharacterService', () => {
  beforeEach(async () => {
    await db.characters.clear();
  });

  it('应创建人物并返回完整对象', async () => {
    const char = await characterService.create({ name: '张三' });
    expect(char.id).toBeTruthy();
    expect(char.name).toBe('张三');
    expect(char.projectId).toBe(DEFAULT_PROJECT_ID);
    expect(char.alias).toBe('');
    expect(char.tags).toEqual([]);
  });

  it('应获取所有人物', async () => {
    await characterService.create({ name: '张三' });
    await characterService.create({ name: '李四' });
    const chars = await characterService.getAll();
    expect(chars.length).toBe(2);
  });

  it('应按ID获取人物', async () => {
    const char = await characterService.create({ name: '王五' });
    const found = await characterService.getById(char.id);
    expect(found?.name).toBe('王五');
  });

  it('应更新人物', async () => {
    const char = await characterService.create({ name: '赵六' });
    await characterService.update(char.id, { name: '赵六六' });
    const updated = await characterService.getById(char.id);
    expect(updated?.name).toBe('赵六六');
  });

  it('应删除人物', async () => {
    const char = await characterService.create({ name: '孙七' });
    await characterService.delete(char.id);
    const found = await characterService.getById(char.id);
    expect(found).toBeUndefined();
  });

  it('应获取人物名称列表', async () => {
    await characterService.create({ name: '张三', alias: '三哥' });
    await characterService.create({ name: '李四' });
    const names = await characterService.getNames();
    expect(names.length).toBe(2);
    const nameValues = names.map((n) => n.name);
    expect(nameValues).toContain('张三');
    expect(nameValues).toContain('李四');
    const zhangSan = names.find((n) => n.name === '张三');
    expect(zhangSan?.alias).toBe('三哥');
  });

  it('创建人物时所有可选字段应使用默认值', async () => {
    const char = await characterService.create({
      name: '测试',
      alias: '别名',
      appearance: '帅气',
      personality: '热情',
      background: '背景',
      faction: '阵营',
      tags: ['主角'],
    });
    expect(char.alias).toBe('别名');
    expect(char.appearance).toBe('帅气');
    expect(char.tags).toEqual(['主角']);
  });
});

describe('OutlineNodeService', () => {
  beforeEach(async () => {
    await db.outlineNodes.clear();
  });

  it('应创建大纲节点', async () => {
    const node = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.VOLUME,
      title: '第一卷',
      content: '卷内容',
    });
    expect(node.id).toBeTruthy();
    expect(node.title).toBe('第一卷');
    expect(node.nodeType).toBe(OutlineNodeType.VOLUME);
    expect(node.characterRefs).toEqual([]);
  });

  it('应获取子节点', async () => {
    const parent = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.VOLUME,
      title: '第一卷',
    });
    const child = await outlineNodeService.create({
      parentId: parent.id,
      nodeType: OutlineNodeType.CHAPTER,
      title: '第一章',
    });
    const children = await outlineNodeService.getChildren(parent.id);
    expect(children.length).toBe(1);
    expect(children[0].id).toBe(child.id);
  });

  it('应递归删除节点', async () => {
    const parent = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.VOLUME,
      title: '第一卷',
    });
    await outlineNodeService.create({
      parentId: parent.id,
      nodeType: OutlineNodeType.CHAPTER,
      title: '第一章',
    });
    await outlineNodeService.deleteRecursive(parent.id);
    const all = await outlineNodeService.getAll();
    expect(all.length).toBe(0);
  });

  it('应更新节点', async () => {
    const node = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.VOLUME,
      title: '第一卷',
    });
    await outlineNodeService.update(node.id, { title: '第二卷' });
    const updated = await outlineNodeService.getById(node.id);
    expect(updated?.title).toBe('第二卷');
  });
});

describe('PlotlineService', () => {
  beforeEach(async () => {
    await db.plotlines.clear();
    await db.plotlineNodes.clear();
  });

  it('应创建剧情线', async () => {
    const plotline = await plotlineService.create({
      lineType: PlotlineType.MAIN,
      name: '主线剧情',
    });
    expect(plotline.id).toBeTruthy();
    expect(plotline.name).toBe('主线剧情');
    expect(plotline.lineType).toBe(PlotlineType.MAIN);
  });

  it('删除剧情线时应级联删除剧情节点', async () => {
    const plotline = await plotlineService.create({
      lineType: PlotlineType.MAIN,
      name: '主线',
    });
    const node = await plotlineNodeService.create({
      plotlineId: plotline.id,
      title: '节点1',
    });
    await plotlineService.delete(plotline.id);
    const found = await plotlineNodeService.getById(node.id);
    expect(found).toBeUndefined();
  });
});

describe('SettingCategoryService & SettingItemService', () => {
  beforeEach(async () => {
    await db.settingCategories.clear();
    await db.settingItems.clear();
  });

  it('应创建设定分类和设定项', async () => {
    const category = await settingCategoryService.create({ name: '世界观' });
    const item = await settingItemService.create({
      categoryId: category.id,
      name: '灵力体系',
      content: '灵力分为九品',
    });
    expect(item.categoryId).toBe(category.id);
    expect(item.name).toBe('灵力体系');
  });

  it('应按分类获取设定项', async () => {
    const cat1 = await settingCategoryService.create({ name: '分类1' });
    const cat2 = await settingCategoryService.create({ name: '分类2' });
    await settingItemService.create({ categoryId: cat1.id, name: '项1' });
    await settingItemService.create({ categoryId: cat2.id, name: '项2' });
    const items1 = await settingItemService.getByCategoryId(cat1.id);
    expect(items1.length).toBe(1);
  });

  it('删除分类时应级联删除设定项', async () => {
    const cat = await settingCategoryService.create({ name: '分类' });
    await settingItemService.create({ categoryId: cat.id, name: '项1' });
    await settingItemService.create({ categoryId: cat.id, name: '项2' });
    await settingCategoryService.delete(cat.id);
    const items = await settingItemService.getByCategoryId(cat.id);
    expect(items.length).toBe(0);
  });
});

describe('RelationService', () => {
  beforeEach(async () => {
    await db.relations.clear();
    await db.characters.clear();
  });

  it('应创建关系', async () => {
    const char1 = await characterService.create({ name: '张三' });
    const char2 = await characterService.create({ name: '李四' });
    const rel = await relationService.create({
      sourceId: char1.id,
      targetId: char2.id,
      relationType: '师徒',
      description: '张三是李四的师父',
    });
    expect(rel.sourceId).toBe(char1.id);
    expect(rel.relationType).toBe('师徒');
  });

  it('应按人物ID查找关系', async () => {
    const char1 = await characterService.create({ name: '张三' });
    const char2 = await characterService.create({ name: '李四' });
    await relationService.create({
      sourceId: char1.id,
      targetId: char2.id,
      relationType: '朋友',
    });
    const rels = await relationService.getByCharacterId(char1.id);
    expect(rels.length).toBe(1);
  });
});

describe('ReferenceService', () => {
  beforeEach(async () => {
    await db.references.clear();
  });

  it('应创建引用关系', async () => {
    const ref = await referenceService.create({
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: 'node1',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
    });
    expect(ref.id).toBeTruthy();
    expect(ref.sourceType).toBe(ReferenceEntityType.OUTLINE_NODE);
    expect(ref.matchText).toBe('张三');
  });

  it('应按目标查询引用', async () => {
    await referenceService.create({
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: 'node1',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
    });
    await referenceService.create({
      sourceType: ReferenceEntityType.PLOTLINE_NODE,
      sourceId: 'plot1',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
    });
    const refs = await referenceService.getByTarget(ReferenceEntityType.CHARACTER, 'char1');
    expect(refs.length).toBe(2);
  });

  it('应按来源查询引用', async () => {
    await referenceService.create({
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: 'node1',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
    });
    const refs = await referenceService.getBySource(ReferenceEntityType.OUTLINE_NODE, 'node1');
    expect(refs.length).toBe(1);
  });

  it('应按目标删除引用', async () => {
    await referenceService.create({
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: 'node1',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
    });
    await referenceService.deleteByTarget(ReferenceEntityType.CHARACTER, 'char1');
    const refs = await referenceService.getByTarget(ReferenceEntityType.CHARACTER, 'char1');
    expect(refs.length).toBe(0);
  });

  it('应按来源删除引用', async () => {
    await referenceService.create({
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: 'node1',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
    });
    await referenceService.deleteBySource(ReferenceEntityType.OUTLINE_NODE, 'node1');
    const refs = await referenceService.getBySource(ReferenceEntityType.OUTLINE_NODE, 'node1');
    expect(refs.length).toBe(0);
  });

  it('应更新引用匹配文本', async () => {
    const ref = await referenceService.create({
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: 'node1',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
    });
    await referenceService.updateMatchText(ref.id, '李四');
    const updated = await db.references.get(ref.id);
    expect(updated?.matchText).toBe('李四');
  });
});

describe('ImpactAlertService', () => {
  beforeEach(async () => {
    await db.impactAlerts.clear();
  });

  it('应创建影响提醒', async () => {
    const alert = await impactAlertService.create({
      sourceType: ReferenceEntityType.CHARACTER,
      sourceId: 'char1',
      sourceAction: 'DELETE' as any,
      targetType: ReferenceEntityType.OUTLINE_NODE,
      targetId: 'node1',
      targetFieldName: 'content',
      description: '人物被删除',
    });
    expect(alert.id).toBeTruthy();
    expect(alert.dismissed).toBe(false);
  });

  it('应获取未关闭的提醒', async () => {
    await impactAlertService.create({
      sourceType: ReferenceEntityType.CHARACTER,
      sourceId: 'char1',
      sourceAction: 'DELETE' as any,
      targetType: ReferenceEntityType.OUTLINE_NODE,
      targetId: 'node1',
      targetFieldName: 'content',
      description: '提醒1',
    });
    const alert2 = await impactAlertService.create({
      sourceType: ReferenceEntityType.CHARACTER,
      sourceId: 'char1',
      sourceAction: 'MODIFY' as any,
      targetType: ReferenceEntityType.OUTLINE_NODE,
      targetId: 'node2',
      targetFieldName: 'content',
      description: '提醒2',
    });
    // 关闭一个
    await impactAlertService.dismiss(alert2.id);
    const active = await impactAlertService.getActive();
    expect(active.length).toBe(1);
  });

  it('应批量关闭所有提醒', async () => {
    await impactAlertService.create({
      sourceType: ReferenceEntityType.CHARACTER,
      sourceId: 'char1',
      sourceAction: 'DELETE' as any,
      targetType: ReferenceEntityType.OUTLINE_NODE,
      targetId: 'node1',
      targetFieldName: 'content',
      description: '提醒1',
    });
    await impactAlertService.create({
      sourceType: ReferenceEntityType.CHARACTER,
      sourceId: 'char1',
      sourceAction: 'MODIFY' as any,
      targetType: ReferenceEntityType.OUTLINE_NODE,
      targetId: 'node2',
      targetFieldName: 'content',
      description: '提醒2',
    });
    await impactAlertService.dismissAll();
    const active = await impactAlertService.getActive();
    expect(active.length).toBe(0);
  });
});

describe('AIConfigService', () => {
  beforeEach(async () => {
    await db.aiConfigs.clear();
  });

  it('应保存和获取配置', async () => {
    const config = await aiConfigService.save({
      projectId: DEFAULT_PROJECT_ID,
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'test-key',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2048,
    });
    expect(config.id).toBeTruthy();

    const saved = await aiConfigService.get();
    expect(saved?.apiKey).toBe('test-key');
  });

  it('应更新已有配置而不是创建新配置', async () => {
    await aiConfigService.save({
      projectId: DEFAULT_PROJECT_ID,
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'key1',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2048,
    });
    await aiConfigService.save({
      projectId: DEFAULT_PROJECT_ID,
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'key2',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2048,
    });
    const all = await db.aiConfigs.toArray();
    expect(all.length).toBe(1);
    expect(all[0].apiKey).toBe('key2');
  });
});
