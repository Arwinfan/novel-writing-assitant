/**
 * AI 上下文组装器
 * 根据当前编辑内容自动检索关联要素并组装 prompt
 * 智能管理上下文长度，防止超过模型 token 限制
 */
import type { ContextAssemblyParams } from '../types/ai';
import { outlineNodeService, plotlineNodeService, characterService, settingItemService, relationService } from './dbService';
import { ReferenceEntityType } from '../types/linkage';
import { referenceService } from './dbService';
import { DEFAULT_PROJECT_ID } from '../utils/constants';

/** 上下文最大字符数（约合 4000 tokens，为 8000 token 模型预留一半空间） */
const MAX_CONTEXT_LENGTH = 4000;

/** 各部分优先级权重（数字越大越优先保留） */
const SECTION_PRIORITY: Record<string, number> = {
  'related_chars': 10,
  'related_settings': 9,
  'relations': 7,
  'plotlines': 5,
  'char_list': 3,
};

/** 上下文片段 */
interface ContextSection {
  key: string;
  priority: number;
  text: string;
}

/** 上下文组装器 */
export const contextAssembler = {
  /**
   * 组装 AI 生成所需的上下文
   * @param params 上下文组装参数
   * @returns 组装好的系统提示和用户提示
   */
  async assembleContext(params: ContextAssemblyParams): Promise<{
    systemPrompt: string;
    contextText: string;
  }> {
    const projectId = DEFAULT_PROJECT_ID;
    const sections: ContextSection[] = [];

    // ===== 收集所有上下文数据 =====

    // 如果指定了当前实体，获取关联信息（最高优先级）
    if (params.currentEntityType && params.currentEntityId) {
      const [relatedChars, relatedSettings] = await Promise.all([
        getRelatedCharacters(params.currentEntityType, params.currentEntityId),
        getRelatedSettings(params.currentEntityType, params.currentEntityId),
      ]);

      if (relatedChars.length > 0) {
        const parts: string[] = ['## 相关角色'];
        for (const char of relatedChars) {
          parts.push(`### ${char.name}${char.alias ? `（${char.alias}）` : ''}`);
          if (char.appearance) parts.push(`外貌：${truncateField(char.appearance, 100)}`);
          if (char.personality) parts.push(`性格：${truncateField(char.personality, 150)}`);
          if (char.background) parts.push(`背景：${truncateField(char.background, 200)}`);
          if (char.faction) parts.push(`阵营：${char.faction}`);
        }
        sections.push({ key: 'related_chars', priority: SECTION_PRIORITY.related_chars, text: parts.join('\n') });
      }

      if (relatedSettings.length > 0) {
        const parts: string[] = ['## 相关设定'];
        for (const setting of relatedSettings) {
          parts.push(`### ${setting.name}`);
          parts.push(truncateField(setting.content, 300));
        }
        sections.push({ key: 'related_settings', priority: SECTION_PRIORITY.related_settings, text: parts.join('\n') });
      }
    }

    // 角色关系概要
    const [allRelations, allCharacters] = await Promise.all([
      relationService.getAll(projectId),
      characterService.getAll(projectId),
    ]);
    if (allRelations.length > 0 && allCharacters.length > 0) {
      const parts: string[] = ['## 角色关系'];
      const charMap = new Map(allCharacters.map((c) => [c.id, c.name]));
      for (const rel of allRelations) {
        const sourceName = charMap.get(rel.sourceId);
        const targetName = charMap.get(rel.targetId);
        if (sourceName && targetName) {
          parts.push(`- ${sourceName} → ${targetName}：${rel.relationType}${rel.description ? `（${rel.description}）` : ''}`);
        }
      }
      sections.push({ key: 'relations', priority: SECTION_PRIORITY.relations, text: parts.join('\n') });
    }

    // 前文大纲摘要
    const allPlotlines = await outlineNodeService.getAll(projectId);
    if (allPlotlines.length > 0) {
      const parts: string[] = ['## 大纲概要'];
      // 根据预算动态截取大纲节点
      const maxOutlineNodes = Math.min(allPlotlines.length, 20);
      for (const node of allPlotlines.slice(0, maxOutlineNodes)) {
        parts.push(`- [${node.nodeType}] ${node.title}`);
      }
      sections.push({ key: 'plotlines', priority: SECTION_PRIORITY.plotlines, text: parts.join('\n') });
    }

    // 全局角色列表（低优先级，用于名称提示）
    if (allCharacters.length > 0) {
      const text = `## 角色列表\n${allCharacters.map((c) => c.name).join('、')}`;
      sections.push({ key: 'char_list', priority: SECTION_PRIORITY.char_list, text });
    }

    // ===== 智能截断：按优先级和长度预算组装 =====
    const contextText = assembleWithBudget(sections, MAX_CONTEXT_LENGTH);

    const systemPrompt = `你是一位专业的小说创作助手。你需要根据提供的世界观设定、角色信息和剧情大纲，帮助作者进行创作。

创作要求：
1. 保持角色性格一致性
2. 遵循已设定的世界观规则
3. 情节发展需符合逻辑
4. 文风与已有内容保持一致

${params.additionalInstructions ?? ''}`;

    return { systemPrompt, contextText };
  },
};

/** 获取与指定实体关联的角色 */
async function getRelatedCharacters(
  entityType: string,
  entityId: string,
): Promise<import('../types/character').Character[]> {
  const refs = await referenceService.getBySource(entityType as ReferenceEntityType, entityId);
  const charRefs = refs.filter((r) => r.targetType === ReferenceEntityType.CHARACTER);
  const characters: import('../types/character').Character[] = [];
  for (const ref of charRefs) {
    const char = await characterService.getById(ref.targetId);
    if (char) characters.push(char);
  }
  return characters;
}

/** 获取与指定实体关联的设定 */
async function getRelatedSettings(
  entityType: string,
  entityId: string,
): Promise<import('../types/setting').SettingItem[]> {
  const refs = await referenceService.getBySource(entityType as ReferenceEntityType, entityId);
  const settingRefs = refs.filter((r) => r.targetType === ReferenceEntityType.SETTING_ITEM);
  const items: import('../types/setting').SettingItem[] = [];
  for (const ref of settingRefs) {
    const item = await settingItemService.getById(ref.targetId);
    if (item) items.push(item);
  }
  return items;
}

/** 截断单个字段到指定长度 */
function truncateField(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

/**
 * 按优先级和长度预算组装上下文文本
 * 高优先级 section 完整保留，低优先级按比例截断
 */
function assembleWithBudget(sections: ContextSection[], maxLen: number): string {
  // 按优先级降序排列
  const sorted = [...sections].sort((a, b) => b.priority - a.priority);

  let totalBudget = maxLen;
  const allocation: Array<{ section: ContextSection; allocated: number }> = [];
  const totalPriority = sorted.reduce((sum, s) => sum + s.priority, 0);

  for (const section of sorted) {
    // 按优先级比例分配预算
    const share = Math.floor((section.priority / totalPriority) * totalBudget);
    allocation.push({ section, allocated: share });
  }

  // 收集结果
  const resultParts: string[] = [];
  for (const { section, allocated } of allocation) {
    if (allocated <= 0) continue;
    const truncated = section.text.length > allocated
      ? section.text.slice(0, allocated) + '\n…（内容已截断）'
      : section.text;
    resultParts.push(truncated);
  }

  return resultParts.join('\n\n');
}
