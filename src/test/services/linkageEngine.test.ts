/**
 * 联动引擎核心测试
 * 测试 nameSyncService, impactAnalyzer, referenceTracker, linkageEngine
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import { OutlineNodeType } from '../../types/outline';
import { PlotlineType } from '../../types/plotline';
import { ReferenceEntityType, ImpactAction, ImpactLevel } from '../../types/linkage';
import type { Reference } from '../../types/linkage';

import {
  outlineNodeService,
  plotlineService,
  plotlineNodeService,
  characterService,
  settingCategoryService,
  settingItemService,
  referenceService,
  impactAlertService,
} from '../../services/dbService';

import { nameSyncService } from '../../services/nameSyncService';
import { impactAnalyzer } from '../../services/impactAnalyzer';
import { referenceTracker } from '../../services/referenceTracker';
import { linkageEngine } from '../../services/linkageEngine';

const DEFAULT_PROJECT_ID = 'default-project';

describe('ImpactAnalyzer', () => {
  const mockReferences: Reference[] = [
    {
      id: 'ref1',
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: 'node1',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
      createdAt: Date.now(),
    },
    {
      id: 'ref2',
      sourceType: ReferenceEntityType.PLOTLINE_NODE,
      sourceId: 'plot1',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
      createdAt: Date.now(),
    },
  ];

  it('DELETE动作应生成CRITICAL级别提醒', () => {
    const alerts = impactAnalyzer.analyzeImpact(
      mockReferences,
      ImpactAction.DELETE,
      ReferenceEntityType.CHARACTER,
      'char1',
      '张三',
    );
    expect(alerts.length).toBe(2);
    expect(alerts[0].level).toBe(ImpactLevel.CRITICAL);
    expect(alerts[1].level).toBe(ImpactLevel.CRITICAL);
  });

  it('RENAME动作应生成WARNING级别提醒', () => {
    const alerts = impactAnalyzer.analyzeImpact(
      mockReferences,
      ImpactAction.RENAME,
      ReferenceEntityType.CHARACTER,
      'char1',
      '张三',
    );
    expect(alerts.length).toBe(2);
    expect(alerts[0].level).toBe(ImpactLevel.WARNING);
  });

  it('MODIFY动作应生成INFO级别提醒', () => {
    const alerts = impactAnalyzer.analyzeImpact(
      mockReferences,
      ImpactAction.MODIFY,
      ReferenceEntityType.CHARACTER,
      'char1',
      '张三',
    );
    expect(alerts.length).toBe(2);
    expect(alerts[0].level).toBe(ImpactLevel.INFO);
  });

  it('提醒应包含正确的描述', () => {
    const alerts = impactAnalyzer.analyzeImpact(
      [mockReferences[0]],
      ImpactAction.DELETE,
      ReferenceEntityType.CHARACTER,
      'char1',
      '张三',
    );
    expect(alerts[0].description).toContain('张三');
    expect(alerts[0].description).toContain('删除');
  });

  it('空引用列表应返回空提醒', () => {
    const alerts = impactAnalyzer.analyzeImpact(
      [],
      ImpactAction.DELETE,
      ReferenceEntityType.CHARACTER,
      'char1',
    );
    expect(alerts).toEqual([]);
  });
});

describe('NameSyncService', () => {
  beforeEach(async () => {
    await db.outlineNodes.clear();
    await db.plotlineNodes.clear();
    await db.plotlines.clear();
    await db.characters.clear();
    await db.references.clear();
  });

  it('应在大纲节点content中替换名称', async () => {
    const node = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.CHAPTER,
      title: '第一章',
      content: '张三走进了房间',
    });

    const ref: Reference = {
      id: 'test-ref',
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: node.id,
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
      createdAt: Date.now(),
    };

    const result = await nameSyncService.replaceInField(ref, '张三', '李四');
    expect(result).toBe(true);

    const updated = await outlineNodeService.getById(node.id);
    expect(updated?.content).toBe('李四走进了房间');
  });

  it('应在大纲节点title中替换名称', async () => {
    const node = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.CHAPTER,
      title: '张三的冒险',
      content: '',
    });

    const ref: Reference = {
      id: 'test-ref',
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: node.id,
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'title',
      matchText: '张三',
      createdAt: Date.now(),
    };

    const result = await nameSyncService.replaceInField(ref, '张三', '李四');
    expect(result).toBe(true);

    const updated = await outlineNodeService.getById(node.id);
    expect(updated?.title).toBe('李四的冒险');
  });

  it('应在剧情节点中替换名称', async () => {
    const plotline = await plotlineService.create({
      lineType: PlotlineType.MAIN,
      name: '主线',
    });
    const node = await plotlineNodeService.create({
      plotlineId: plotline.id,
      title: '张三登场',
      content: '张三从远方赶来',
    });

    const ref: Reference = {
      id: 'test-ref',
      sourceType: ReferenceEntityType.PLOTLINE_NODE,
      sourceId: node.id,
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
      createdAt: Date.now(),
    };

    const result = await nameSyncService.replaceInField(ref, '张三', '李四');
    expect(result).toBe(true);

    const updated = await plotlineNodeService.getById(node.id);
    expect(updated?.content).toBe('李四从远方赶来');
  });

  it('旧名称为空时应返回false', async () => {
    const ref: Reference = {
      id: 'test-ref',
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: 'node1',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '',
      createdAt: Date.now(),
    };
    const result = await nameSyncService.replaceInField(ref, '', '李四');
    expect(result).toBe(false);
  });

  it('新旧名称相同时应返回false', async () => {
    const ref: Reference = {
      id: 'test-ref',
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: 'node1',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
      createdAt: Date.now(),
    };
    const result = await nameSyncService.replaceInField(ref, '张三', '张三');
    expect(result).toBe(false);
  });

  it('节点不存在时应返回false', async () => {
    const ref: Reference = {
      id: 'test-ref',
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: 'nonexistent',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
      createdAt: Date.now(),
    };
    const result = await nameSyncService.replaceInField(ref, '张三', '李四');
    expect(result).toBe(false);
  });

  it('不支持的来源类型应返回false', async () => {
    const ref: Reference = {
      id: 'test-ref',
      sourceType: ReferenceEntityType.CHARACTER, // CHARACTER不是来源类型
      sourceId: 'char1',
      targetType: ReferenceEntityType.SETTING_ITEM,
      targetId: 'item1',
      fieldName: 'content',
      matchText: '张三',
      createdAt: Date.now(),
    };
    const result = await nameSyncService.replaceInField(ref, '张三', '李四');
    expect(result).toBe(false);
  });
});

describe('ReferenceTracker', () => {
  beforeEach(async () => {
    await db.outlineNodes.clear();
    await db.plotlineNodes.clear();
    await db.plotlines.clear();
    await db.characters.clear();
    await db.settingCategories.clear();
    await db.settingItems.clear();
    await db.references.clear();
  });

  it('应扫描大纲节点并自动建立对人物的引用', async () => {
    const char = await characterService.create({ name: '张三' });
    const node = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.CHAPTER,
      title: '第一章',
      content: '张三走进了房间',
    });

    const refs = await referenceTracker.scanAndIndexOutlineNode(node.id);
    expect(refs.length).toBeGreaterThanOrEqual(1);
    const charRef = refs.find((r) => r.targetId === char.id);
    expect(charRef).toBeTruthy();
    expect(charRef?.targetType).toBe(ReferenceEntityType.CHARACTER);
    expect(charRef?.fieldName).toBe('content');
  });

  it('应扫描大纲节点并自动建立对设定的引用', async () => {
    const cat = await settingCategoryService.create({ name: '世界观' });
    const item = await settingItemService.create({
      categoryId: cat.id,
      name: '灵力体系',
      content: '灵力分为九品',
    });
    const node = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.CHAPTER,
      title: '第一章',
      content: '灵力体系是修炼的基础',
    });

    const refs = await referenceTracker.scanAndIndexOutlineNode(node.id);
    const settingRef = refs.find((r) => r.targetId === item.id);
    expect(settingRef).toBeTruthy();
    expect(settingRef?.targetType).toBe(ReferenceEntityType.SETTING_ITEM);
  });

  it('应扫描剧情节点并建立引用', async () => {
    const char = await characterService.create({ name: '李四' });
    const plotline = await plotlineService.create({
      lineType: PlotlineType.MAIN,
      name: '主线',
    });
    const node = await plotlineNodeService.create({
      plotlineId: plotline.id,
      title: '起始',
      content: '李四开始了旅程',
    });

    const refs = await referenceTracker.scanAndIndexPlotlineNode(node.id);
    const charRef = refs.find((r) => r.targetId === char.id);
    expect(charRef).toBeTruthy();
  });

  it('不应创建重复引用', async () => {
    const char = await characterService.create({ name: '张三' });
    const node = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.CHAPTER,
      title: '第一章',
      content: '张三走进了房间',
    });

    const refs1 = await referenceTracker.scanAndIndexOutlineNode(node.id);
    const refs2 = await referenceTracker.scanAndIndexOutlineNode(node.id);
    // 第二次扫描不应产生新引用
    expect(refs2.length).toBe(0);

    // 验证引用不重复
    const allRefs = await referenceService.getByTarget(ReferenceEntityType.CHARACTER, char.id);
    const outlineContentRefs = allRefs.filter(
      (r) => r.sourceId === node.id && r.fieldName === 'content',
    );
    expect(outlineContentRefs.length).toBe(1);
  });

  it('节点不存在时应返回空数组', async () => {
    const refs = await referenceTracker.scanAndIndexOutlineNode('nonexistent');
    expect(refs).toEqual([]);
  });

  it('应查找已存在的引用', async () => {
    const char = await characterService.create({ name: '张三' });
    const node = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.CHAPTER,
      title: '第一章',
      content: '张三走进了房间',
    });
    await referenceTracker.scanAndIndexOutlineNode(node.id);

    const existing = await referenceTracker.findExistingReference(
      ReferenceEntityType.OUTLINE_NODE,
      node.id,
      ReferenceEntityType.CHARACTER,
      char.id,
      'content',
    );
    expect(existing).toBeTruthy();
  });
});

describe('LinkageEngine - Integration', () => {
  beforeEach(async () => {
    await db.outlineNodes.clear();
    await db.plotlineNodes.clear();
    await db.plotlines.clear();
    await db.characters.clear();
    await db.settingCategories.clear();
    await db.settingItems.clear();
    await db.references.clear();
    await db.impactAlerts.clear();
  });

  it('名称变更应同步到所有引用位置', async () => {
    // 1. 创建人物
    const char = await characterService.create({ name: '张三' });

    // 2. 创建大纲节点并引用人物
    const node = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.CHAPTER,
      title: '张三的旅程',
      content: '张三踏上了冒险之路',
    });

    // 3. 扫描建立引用
    await referenceTracker.scanAndIndexOutlineNode(node.id);

    // 4. 触发名称变更
    const affected = await linkageEngine.onNameChange(
      ReferenceEntityType.CHARACTER,
      char.id,
      '张三',
      '李四',
    );

    // 5. 验证同步结果
    expect(affected.length).toBeGreaterThan(0);
    const updatedNode = await outlineNodeService.getById(node.id);
    expect(updatedNode?.content).toBe('李四踏上了冒险之路');
  });

  it('实体删除应生成影响提醒并清理引用', async () => {
    // 1. 创建人物
    const char = await characterService.create({ name: '张三' });

    // 2. 创建大纲节点引用人物
    const node = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.CHAPTER,
      title: '第一章',
      content: '张三出发了',
    });
    await referenceTracker.scanAndIndexOutlineNode(node.id);

    // 3. 删除人物
    const alerts = await linkageEngine.onEntityDelete(
      ReferenceEntityType.CHARACTER,
      char.id,
      '张三',
    );

    // 4. 验证影响提醒
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].sourceAction).toBe(ImpactAction.DELETE);
    expect(alerts[0].level).toBe(ImpactLevel.CRITICAL);

    // 5. 验证引用被清理
    const refs = await referenceService.getByTarget(ReferenceEntityType.CHARACTER, char.id);
    expect(refs.length).toBe(0);
  });

  it('设定内容修改应生成影响提醒', async () => {
    // 1. 创建设定
    const cat = await settingCategoryService.create({ name: '世界观' });
    const item = await settingItemService.create({
      categoryId: cat.id,
      name: '灵力体系',
      content: '灵力分为九品',
    });

    // 2. 创建大纲节点引用设定
    const node = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.CHAPTER,
      title: '第一章',
      content: '灵力体系是修炼的基础',
    });
    await referenceTracker.scanAndIndexOutlineNode(node.id);

    // 3. 修改设定内容
    const alerts = await linkageEngine.onEntityChange(
      ReferenceEntityType.SETTING_ITEM,
      item.id,
      ImpactAction.MODIFY,
      '灵力体系',
    );

    // 4. 验证影响提醒
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].level).toBe(ImpactLevel.INFO);
    expect(alerts[0].description).toContain('灵力体系');
  });

  it('设定名称变更应同步到引用位置', async () => {
    // 1. 创建设定
    const cat = await settingCategoryService.create({ name: '世界观' });
    const item = await settingItemService.create({
      categoryId: cat.id,
      name: '灵力体系',
      content: '灵力分为九品',
    });

    // 2. 创建大纲节点引用设定名
    const node = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.CHAPTER,
      title: '第一章',
      content: '灵力体系是修炼的基础',
    });
    await referenceTracker.scanAndIndexOutlineNode(node.id);

    // 3. 修改设定名称
    const affected = await linkageEngine.onNameChange(
      ReferenceEntityType.SETTING_ITEM,
      item.id,
      '灵力体系',
      '法力体系',
    );

    // 4. 验证同步结果
    expect(affected.length).toBeGreaterThan(0);
    const updatedNode = await outlineNodeService.getById(node.id);
    expect(updatedNode?.content).toBe('法力体系是修炼的基础');
  });

  it('创建引用应正确保存', async () => {
    const ref = await linkageEngine.createReference({
      sourceType: ReferenceEntityType.OUTLINE_NODE,
      sourceId: 'node1',
      targetType: ReferenceEntityType.CHARACTER,
      targetId: 'char1',
      fieldName: 'content',
      matchText: '张三',
    });
    expect(ref.id).toBeTruthy();
    expect(ref.matchText).toBe('张三');
  });

  it('删除实体后引用应完全清理', async () => {
    const char = await characterService.create({ name: '王五' });
    const plotline = await plotlineService.create({
      lineType: PlotlineType.MAIN,
      name: '主线',
    });

    // 在多个地方引用王五
    const node1 = await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.CHAPTER,
      title: '第一章',
      content: '王五出现了',
    });
    const node2 = await plotlineNodeService.create({
      plotlineId: plotline.id,
      title: '起始剧情',
      content: '王五开始行动',
    });

    await referenceTracker.scanAndIndexOutlineNode(node1.id);
    await referenceTracker.scanAndIndexPlotlineNode(node2.id);

    // 删除人物
    await linkageEngine.onEntityDelete(ReferenceEntityType.CHARACTER, char.id, '王五');

    // 验证所有引用被清理
    const refs = await referenceService.getByTarget(ReferenceEntityType.CHARACTER, char.id);
    expect(refs.length).toBe(0);
  });
});
