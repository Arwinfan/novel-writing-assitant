/**
 * 导入导出服务测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import { OutlineNodeType } from '../../types/outline';
import { PlotlineType } from '../../types/plotline';
import {
  outlineNodeService,
  plotlineService,
  plotlineNodeService,
  characterService,
  settingCategoryService,
  settingItemService,
  relationService,
} from '../../services/dbService';
import { exportImportService } from '../../services/exportImportService';

const TEST_PROJECT_ID = 'test-project';

describe('ExportImportService', () => {
  beforeEach(async () => {
    await db.outlineNodes.clear();
    await db.plotlines.clear();
    await db.plotlineNodes.clear();
    await db.characters.clear();
    await db.relations.clear();
    await db.settingCategories.clear();
    await db.settingItems.clear();
    await db.chapters.clear();
    await db.references.clear();
    await db.impactAlerts.clear();
  });

  it('应导出项目数据为JSON', async () => {
    // 创建一些测试数据
    await characterService.create({ name: '张三' }, TEST_PROJECT_ID);
    await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.VOLUME,
      title: '第一卷',
    }, TEST_PROJECT_ID);

    const json = await exportImportService.exportProject(TEST_PROJECT_ID, '测试小说', '描述');
    const data = JSON.parse(json);

    expect(data.version).toBe('2.0.0');
    expect(data.project.name).toBe('测试小说');
    expect(data.data.characters.length).toBe(1);
    expect(data.data.outlineNodes.length).toBe(1);
  });

  it('应导入覆盖模式项目数据', async () => {
    // 创建导出数据
    await characterService.create({ name: '李四' }, TEST_PROJECT_ID);
    await outlineNodeService.create({
      parentId: '',
      nodeType: OutlineNodeType.CHAPTER,
      title: '第一章',
      content: '李四出发了',
    }, TEST_PROJECT_ID);

    const json = await exportImportService.exportProject(TEST_PROJECT_ID);
    
    // 清空数据
    await db.characters.clear();
    await db.outlineNodes.clear();
    
    // 导入覆盖
    await exportImportService.importProject(json, TEST_PROJECT_ID, false);

    const chars = await characterService.getAll(TEST_PROJECT_ID);
    expect(chars.length).toBe(1);
    expect(chars[0].name).toBe('李四');

    const nodes = await outlineNodeService.getAll(TEST_PROJECT_ID);
    expect(nodes.length).toBe(1);
  });

  it('应导入合并模式项目数据（生成新ID）', async () => {
    // 先创建一些现有数据
    await characterService.create({ name: '王五' }, TEST_PROJECT_ID);

    // 创建导出数据
    const exportJson = JSON.stringify({
      version: '2.0.0',
      exportedAt: Date.now(),
      project: { id: TEST_PROJECT_ID, name: '测试', description: '' },
      data: {
        characters: [{ id: 'imp-char-1', projectId: TEST_PROJECT_ID, name: '赵六', alias: '', appearance: '', personality: '', background: '', faction: '', tags: [], createdAt: Date.now(), updatedAt: Date.now() }],
        outlineNodes: [],
        plotlines: [],
        plotlineNodes: [],
        relations: [],
        settingCategories: [],
        settingItems: [],
        chapters: [],
        references: [],
        impactAlerts: [],
      },
    });

    await exportImportService.importProject(exportJson, TEST_PROJECT_ID, true);

    const chars = await characterService.getAll(TEST_PROJECT_ID);
    // 应有原有1个 + 导入1个 = 2
    expect(chars.length).toBe(2);
    const names = chars.map((c) => c.name);
    expect(names).toContain('王五');
    expect(names).toContain('赵六');
  });

  it('无效JSON应抛出错误', async () => {
    await expect(exportImportService.importProject('invalid json', TEST_PROJECT_ID)).rejects.toThrow();
  });

  it('缺少版本字段应抛出错误', async () => {
    const invalidData = JSON.stringify({ data: { characters: [], plotlines: [], plotlineNodes: [], outlineNodes: [], relations: [], settingCategories: [], settingItems: [], chapters: [], references: [], impactAlerts: [] } });
    await expect(exportImportService.importProject(invalidData, TEST_PROJECT_ID)).rejects.toThrow('无效的导入文件格式');
  });

  it('缺少data字段应抛出错误', async () => {
    const invalidData = JSON.stringify({ version: '2.0.0' });
    await expect(exportImportService.importProject(invalidData, TEST_PROJECT_ID)).rejects.toThrow('无效的导入文件格式');
  });

  it('导出数据应包含所有实体类型', async () => {
    const cat = await settingCategoryService.create({ name: '分类1' }, TEST_PROJECT_ID);
    await settingItemService.create({ categoryId: cat.id, name: '设定1' }, TEST_PROJECT_ID);
    const plotline = await plotlineService.create({ lineType: PlotlineType.MAIN, name: '主线' }, TEST_PROJECT_ID);
    await plotlineNodeService.create({ plotlineId: plotline.id, title: '节点1' }, TEST_PROJECT_ID);

    const json = await exportImportService.exportProject(TEST_PROJECT_ID);
    const data = JSON.parse(json);

    expect(data.data.settingCategories.length).toBe(1);
    expect(data.data.settingItems.length).toBe(1);
    expect(data.data.plotlines.length).toBe(1);
    expect(data.data.plotlineNodes.length).toBe(1);
  });
});
