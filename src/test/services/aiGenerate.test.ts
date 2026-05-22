/**
 * AI 生成结果解析器测试
 */
import { describe, it, expect } from 'vitest';
import { aiGenerateService } from '../../services/aiGenerateService';

describe('parsePlotlineResult', () => {
  it('应解析标准序号+冒号格式', () => {
    const content = '1. 起程离乡：主角告别家乡，踏上修仙之路\n2. 初入宗门：主角加入天剑宗\n3. 第一战：主角与师兄比试';
    const result = aiGenerateService.parsePlotlineResult(content);
    expect(result.length).toBe(3);
    expect(result[0].title).toBe('起程离乡');
    expect(result[0].content).toContain('主角告别家乡');
    expect(result[1].title).toBe('初入宗门');
    expect(result[2].title).toBe('第一战');
  });

  it('应解析Markdown粗体标题', () => {
    const content = '**起程离乡**：主角告别家乡\n**初入宗门**：主角加入天剑宗';
    const result = aiGenerateService.parsePlotlineResult(content);
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('起程离乡');
    expect(result[1].title).toBe('初入宗门');
  });

  it('应解析无序号有冒号格式', () => {
    const content = '起程离乡：主角告别家乡\n\n初入宗门：主角加入宗门';
    const result = aiGenerateService.parsePlotlineResult(content);
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('起程离乡');
    expect(result[1].title).toBe('初入宗门');
  });

  it('应解析多行内容（跨行描述）', () => {
    const content = '1. 起程离乡：主角告别家乡\n途中遭遇劫匪，初次展示天赋\n\n2. 初入宗门：主角加入宗门\n被分配到外门，结识师兄';
    const result = aiGenerateService.parsePlotlineResult(content);
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('起程离乡');
    expect(result[0].content).toContain('途中遭遇劫匪');
    expect(result[1].content).toContain('被分配到外门');
  });

  it('应解析中文顿号序号', () => {
    const content = '一、起程离乡：主角告别家乡\n二、初入宗门：主角加入宗门';
    const result = aiGenerateService.parsePlotlineResult(content);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('空内容应返回空数组', () => {
    expect(aiGenerateService.parsePlotlineResult('')).toEqual([]);
    expect(aiGenerateService.parsePlotlineResult('   \n  \n')).toEqual([]);
  });
});

describe('parseCharacterResult', () => {
  it('应解析标准---分隔格式', () => {
    const content = '---\n姓名：李云飞\n别名：飞剑客\n外貌：身材修长，黑发束冠\n性格：外冷内热，重情重义\n背景故事：自幼被遗弃，被山中隐士收养\n所属势力：天剑宗\n角色定位：主角\n---\n姓名：陈风\n别名：无\n外貌：面容俊朗\n性格：豪爽大方\n背景故事：天剑宗内门弟子\n所属势力：天剑宗\n角色定位：配角';
    const result = aiGenerateService.parseCharacterResult(content);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('李云飞');
    expect(result[0].alias).toBe('飞剑客');
    expect(result[0].faction).toBe('天剑宗');
    expect(result[1].name).toBe('陈风');
  });

  it('应解析多行字段值', () => {
    const content = '---\n姓名：李云飞\n别名：飞剑客\n外貌：身材修长，黑发束冠，眼神锐利\n性格：外冷内热，重情重义，但有时过于固执\n背景故事：自幼被遗弃，被山中隐士收养，\n后隐士被害，踏上复仇之路\n所属势力：天剑宗\n角色定位：主角\n---';
    const result = aiGenerateService.parseCharacterResult(content);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('李云飞');
    expect(result[0].background).toContain('踏上复仇之路');
  });

  it('应解析无---分隔（用姓名分块）', () => {
    const content = '姓名：李云飞\n别名：飞剑客\n外貌：身材修长\n性格：外冷内热\n姓名：陈风\n别名：无\n外貌：面容俊朗\n性格：豪爽大方';
    const result = aiGenerateService.parseCharacterResult(content);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('李云飞');
    expect(result[1].name).toBe('陈风');
  });

  it('应兼容英文冒号', () => {
    const content = '---\n姓名:李云飞\n别名:飞剑客\n外貌:身材修长\n性格:外冷内热\n背景故事:被隐士收养\n所属势力:天剑宗\n角色定位:主角\n---';
    const result = aiGenerateService.parseCharacterResult(content);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('李云飞');
  });

  it('空内容应返回空数组', () => {
    expect(aiGenerateService.parseCharacterResult('')).toEqual([]);
    expect(aiGenerateService.parseCharacterResult('---\n---')).toEqual([]);
  });
});

describe('parseSettingResult', () => {
  it('应解析标准格式', () => {
    const content = '---\n设定名称：灵气体系\n分类：力量体系\n内容：灵气分为金木水火土五行，修士需觉醒本命灵根\n---\n设定名称：天剑宗\n分类：势力\n内容：五大宗门之首，以剑道著称\n---';
    const result = aiGenerateService.parseSettingResult(content);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('灵气体系');
    expect(result[0].category).toBe('力量体系');
    expect(result[1].name).toBe('天剑宗');
  });

  it('应解析多行内容', () => {
    const content = '---\n设定名称：灵气体系\n分类：力量体系\n内容：灵气分为金木水火土五行，\n修士需觉醒本命灵根才能修炼，\n灵根品质决定修炼上限\n---';
    const result = aiGenerateService.parseSettingResult(content);
    expect(result.length).toBe(1);
    expect(result[0].content).toContain('灵根品质决定修炼上限');
  });
});
