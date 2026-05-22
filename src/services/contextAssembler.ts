/**
 * AI 上下文组装器
 * 根据当前编辑内容自动检索关联要素并组装 prompt
 */
import type { ContextAssemblyParams } from '../types/ai';
import { outlineNodeService, plotlineNodeService, characterService, settingItemService, relationService } from './dbService';
import { ReferenceEntityType } from '../types/linkage';
import { referenceService } from './dbService';
import { DEFAULT_PROJECT_ID } from '../utils/constants';

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
    const parts: string[] = [];

    // 获取项目基本信息
    const allCharacters = await characterService.getAll(projectId);
    const allPlotlines = await outlineNodeService.getAll(projectId);

    // 如果指定了当前实体，获取关联信息
    if (params.currentEntityType && params.currentEntityId) {
      const relatedChars = await getRelatedCharacters(params.currentEntityType, params.currentEntityId);
      const relatedSettings = await getRelatedSettings(params.currentEntityType, params.currentEntityId);

      if (relatedChars.length > 0) {
        parts.push('## 相关人物');
        for (const char of relatedChars) {
          parts.push(`### ${char.name}${char.alias ? `（${char.alias}）` : ''}`);
          if (char.appearance) parts.push(`外貌：${char.appearance}`);
          if (char.personality) parts.push(`性格：${char.personality}`);
          if (char.background) parts.push(`背景：${char.background}`);
          if (char.faction) parts.push(`阵营：${char.faction}`);
        }
      }

      if (relatedSettings.length > 0) {
        parts.push('## 相关设定');
        for (const setting of relatedSettings) {
          parts.push(`### ${setting.name}`);
          parts.push(setting.content);
        }
      }
    }

    // 添加人物关系概要
    const allRelations = await relationService.getAll(projectId);
    if (allRelations.length > 0 && allCharacters.length > 0) {
      parts.push('## 人物关系');
      for (const rel of allRelations) {
        const source = allCharacters.find((c) => c.id === rel.sourceId);
        const target = allCharacters.find((c) => c.id === rel.targetId);
        if (source && target) {
          parts.push(`- ${source.name} → ${target.name}：${rel.relationType}${rel.description ? `（${rel.description}）` : ''}`);
        }
      }
    }

    // 添加前文大纲摘要
    if (allPlotlines.length > 0) {
      parts.push('## 大纲概要');
      for (const node of allPlotlines.slice(0, 20)) {
        parts.push(`- [${node.nodeType}] ${node.title}`);
      }
    }

    // 添加全局人物列表
    if (allCharacters.length > 0) {
      parts.push('## 人物列表');
      parts.push(allCharacters.map((c) => c.name).join('、'));
    }

    const systemPrompt = `你是一位专业的小说创作助手。你需要根据提供的世界观设定、人物信息和剧情大纲，帮助作者进行创作。

创作要求：
1. 保持人物性格一致性
2. 遵循已设定的世界观规则
3. 情节发展需符合逻辑
4. 文风与已有内容保持一致

${params.additionalInstructions ?? ''}`;

    const contextText = parts.join('\n\n');

    return { systemPrompt, contextText };
  },
};

/** 获取与指定实体关联的人物 */
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
