/**
 * 数据类型和常量测试
 * 验证枚举值、类型结构正确性
 */
import { describe, it, expect } from 'vitest';
import { ReferenceEntityType, ImpactAction, ImpactLevel } from '../../types/linkage';
import { OutlineNodeType } from '../../types/outline';
import { PlotlineType } from '../../types/plotline';
import { DEFAULT_PROJECT_ID, AI_DEFAULT_CONFIG, NAV_ITEMS } from '../../utils/constants';

describe('Linkage Types', () => {
  it('ReferenceEntityType 枚举值应正确', () => {
    expect(ReferenceEntityType.OUTLINE_NODE).toBe('OUTLINE_NODE');
    expect(ReferenceEntityType.PLOTLINE_NODE).toBe('PLOTLINE_NODE');
    expect(ReferenceEntityType.CHARACTER).toBe('CHARACTER');
    expect(ReferenceEntityType.SETTING_ITEM).toBe('SETTING_ITEM');
  });

  it('ImpactAction 枚举值应正确', () => {
    expect(ImpactAction.RENAME).toBe('RENAME');
    expect(ImpactAction.MODIFY).toBe('MODIFY');
    expect(ImpactAction.DELETE).toBe('DELETE');
  });

  it('ImpactLevel 枚举值应正确', () => {
    expect(ImpactLevel.INFO).toBe('INFO');
    expect(ImpactLevel.WARNING).toBe('WARNING');
    expect(ImpactLevel.CRITICAL).toBe('CRITICAL');
  });
});

describe('Outline Types', () => {
  it('OutlineNodeType 枚举值应正确', () => {
    expect(OutlineNodeType.VOLUME).toBe('VOLUME');
    expect(OutlineNodeType.CHAPTER).toBe('CHAPTER');
    expect(OutlineNodeType.SECTION).toBe('SECTION');
  });
});

describe('Plotline Types', () => {
  it('PlotlineType 枚举值应正确', () => {
    expect(PlotlineType.MAIN).toBe('MAIN');
    expect(PlotlineType.SUB).toBe('SUB');
  });
});

describe('Constants', () => {
  it('DEFAULT_PROJECT_ID 应为字符串', () => {
    expect(DEFAULT_PROJECT_ID).toBe('default-project');
  });

  it('AI_DEFAULT_CONFIG 应包含必要字段', () => {
    expect(AI_DEFAULT_CONFIG.apiEndpoint).toBeTruthy();
    expect(AI_DEFAULT_CONFIG.apiKey).toBe('');
    expect(AI_DEFAULT_CONFIG.model).toBeTruthy();
    expect(typeof AI_DEFAULT_CONFIG.temperature).toBe('number');
    expect(typeof AI_DEFAULT_CONFIG.maxTokens).toBe('number');
  });

  it('NAV_ITEMS 应包含6个导航项', () => {
    expect(NAV_ITEMS.length).toBe(6);
    const keys = NAV_ITEMS.map((item) => item.key);
    expect(keys).toContain('outline');
    expect(keys).toContain('chapter');
    expect(keys).toContain('plotline');
    expect(keys).toContain('character');
    expect(keys).toContain('relation');
    expect(keys).toContain('setting');
  });
});
