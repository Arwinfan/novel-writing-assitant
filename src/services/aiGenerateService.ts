/**
 * AI 一键生成服务
 * 为各模块提供结构化的 prompt 模板、条件选项和结果解析
 */
import { aiService, AIError, AIErrorType } from './aiService';
import { contextAssembler } from './contextAssembler';
import type { AIConfig } from '../types/ai';

/** 生成模块类型 */
export type GenerateModule = 'outline' | 'chapter' | 'plotline' | 'character' | 'relation' | 'setting';

/** 条件选项 */
export interface GenerateOption {
  key: string;
  label: string;
  type: 'select' | 'text' | 'number';
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  defaultValue?: string;
}

/** 生成请求参数 */
export interface GenerateRequest {
  module: GenerateModule;
  /** 额外用户指令 */
  userHint?: string;
  /** 条件选项值 */
  optionValues?: Record<string, string>;
  /** 当前模块的上下文 */
  existingContext?: string;
  /** 现有实体列表 */
  existingNames?: string[];
  /** AI 配置 */
  config: AIConfig;
  /** 流式回调 */
  onChunk?: (chunk: string) => void;
  /** 中断信号 */
  signal?: AbortSignal;
}

/** 各模块的条件选项定义 */
export const MODULE_OPTIONS: Record<GenerateModule, GenerateOption[]> = {
  outline: [
    {
      key: 'genre',
      label: '小说类型',
      type: 'select',
      options: [
        { label: '玄幻', value: '玄幻' },
        { label: '仙侠', value: '仙侠' },
        { label: '都市', value: '都市' },
        { label: '科幻', value: '科幻' },
        { label: '悬疑推理', value: '悬疑推理' },
        { label: '历史', value: '历史' },
        { label: '言情', value: '言情' },
        { label: '武侠', value: '武侠' },
        { label: '恐怖', value: '恐怖' },
        { label: '奇幻', value: '奇幻' },
        { label: '游戏', value: '游戏' },
        { label: '同人', value: '同人' },
      ],
    },
    {
      key: 'volumeCount',
      label: '卷数',
      type: 'select',
      options: [
        { label: '3卷（短篇）', value: '3' },
        { label: '5卷（中篇）', value: '5' },
        { label: '8卷（长篇）', value: '8' },
        { label: '10卷+（超长篇）', value: '10' },
      ],
      defaultValue: '5',
    },
    {
      key: 'pacing',
      label: '节奏风格',
      type: 'select',
      options: [
        { label: '快节奏', value: '快节奏' },
        { label: '中等', value: '中等' },
        { label: '慢热铺垫', value: '慢热铺垫' },
      ],
      defaultValue: '中等',
    },
    {
      key: 'theme',
      label: '核心主题',
      type: 'text',
      placeholder: '如：成长、复仇、探索、守护...',
    },
  ],
  chapter: [
    {
      key: 'style',
      label: '写作风格',
      type: 'select',
      options: [
        { label: '白描写实', value: '白描写实' },
        { label: '诗意抒情', value: '诗意抒情' },
        { label: '紧凑悬疑', value: '紧凑悬疑' },
        { label: '轻松幽默', value: '轻松幽默' },
        { label: '史诗恢弘', value: '史诗恢弘' },
      ],
      defaultValue: '白描写实',
    },
    {
      key: 'pov',
      label: '叙事视角',
      type: 'select',
      options: [
        { label: '第一人称', value: '第一人称' },
        { label: '第三人称限制', value: '第三人称限制' },
        { label: '第三人称全知', value: '第三人称全知' },
        { label: '多视角切换', value: '多视角切换' },
      ],
      defaultValue: '第三人称限制',
    },
    {
      key: 'length',
      label: '篇幅',
      type: 'select',
      options: [
        { label: '短篇（1000-2000字）', value: '短篇' },
        { label: '中篇（2000-5000字）', value: '中篇' },
        { label: '长篇（5000-10000字）', value: '长篇' },
      ],
      defaultValue: '中篇',
    },
    {
      key: 'focus',
      label: '写作重点',
      type: 'text',
      placeholder: '如：战斗场景、情感对话、环境铺垫...',
    },
  ],
  plotline: [
    {
      key: 'lineType',
      label: '剧情线类型',
      type: 'select',
      options: [
        { label: '主线', value: '主线' },
        { label: '支线', value: '支线' },
        { label: '暗线', value: '暗线' },
      ],
      defaultValue: '主线',
    },
    {
      key: 'tension',
      label: '张力程度',
      type: 'select',
      options: [
        { label: '高张力（密集冲突）', value: '高张力' },
        { label: '中张力', value: '中张力' },
        { label: '低张力（日常向）', value: '低张力' },
      ],
      defaultValue: '中张力',
    },
    {
      key: 'nodeCount',
      label: '节点数量',
      type: 'select',
      options: [
        { label: '5个', value: '5' },
        { label: '8个', value: '8' },
        { label: '12个', value: '12' },
      ],
      defaultValue: '8',
    },
    {
      key: 'focus',
      label: '剧情焦点',
      type: 'text',
      placeholder: '如：人物成长、势力争霸、解谜...',
    },
  ],
  character: [
    {
      key: 'roleType',
      label: '角色类型',
      type: 'select',
      options: [
        { label: '主角团', value: '主角团' },
        { label: '反派阵营', value: '反派阵营' },
        { label: '中立势力', value: '中立势力' },
        { label: '配角群', value: '配角群' },
        { label: '混合', value: '混合' },
      ],
      defaultValue: '混合',
    },
    {
      key: 'count',
      label: '生成数量',
      type: 'select',
      options: [
        { label: '2个', value: '2' },
        { label: '3个', value: '3' },
        { label: '5个', value: '5' },
        { label: '8个', value: '8' },
      ],
      defaultValue: '3',
    },
    {
      key: 'gender',
      label: '性别倾向',
      type: 'select',
      options: [
        { label: '不限', value: '不限' },
        { label: '男性为主', value: '男性为主' },
        { label: '女性为主', value: '女性为主' },
        { label: '各半', value: '各半' },
      ],
      defaultValue: '不限',
    },
    {
      key: 'archetype',
      label: '角色原型',
      type: 'text',
      placeholder: '如：导师、背叛者、守护者、小丑...',
    },
  ],
  relation: [
    {
      key: 'relType',
      label: '关系类型侧重',
      type: 'select',
      options: [
        { label: '全面混合', value: '全面混合' },
        { label: '亲密关系为主', value: '亲密关系为主' },
        { label: '利益关系为主', value: '利益关系为主' },
        { label: '对立关系为主', value: '对立关系为主' },
        { label: '师承关系为主', value: '师承关系为主' },
      ],
      defaultValue: '全面混合',
    },
    {
      key: 'complexity',
      label: '复杂度',
      type: 'select',
      options: [
        { label: '简单（直接关系）', value: '简单' },
        { label: '中等（双面关系）', value: '中等' },
        { label: '复杂（三角/多面）', value: '复杂' },
      ],
      defaultValue: '中等',
    },
    {
      key: 'count',
      label: '关系数量',
      type: 'select',
      options: [
        { label: '3-5条', value: '5' },
        { label: '5-8条', value: '8' },
        { label: '8-12条', value: '12' },
      ],
      defaultValue: '8',
    },
  ],
  setting: [
    {
      key: 'category',
      label: '设定类别',
      type: 'select',
      options: [
        { label: '全部类别', value: '全部' },
        { label: '地理/世界', value: '地理' },
        { label: '势力/组织', value: '势力' },
        { label: '力量体系', value: '力量体系' },
        { label: '种族/物种', value: '种族' },
        { label: '历史/纪元', value: '历史' },
        { label: '文化/习俗', value: '文化' },
        { label: '科技/装备', value: '科技' },
        { label: '经济/贸易', value: '经济' },
      ],
      defaultValue: '全部',
    },
    {
      key: 'detail',
      label: '详细程度',
      type: 'select',
      options: [
        { label: '概要（100-200字）', value: '概要' },
        { label: '标准（200-400字）', value: '标准' },
        { label: '详细（400-800字）', value: '详细' },
      ],
      defaultValue: '标准',
    },
    {
      key: 'count',
      label: '生成数量',
      type: 'select',
      options: [
        { label: '2个', value: '2' },
        { label: '3个', value: '3' },
        { label: '5个', value: '5' },
        { label: '8个', value: '8' },
      ],
      defaultValue: '3',
    },
    {
      key: 'worldStyle',
      label: '世界观风格',
      type: 'text',
      placeholder: '如：东方修仙、西方魔幻、赛博朋克...',
    },
  ],
};

/** 根据条件值构建 prompt 片段 */
function buildOptionsText(module: GenerateModule, optionValues: Record<string, string>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(optionValues)) {
    if (value && value !== '不限' && value !== '全部') {
      const optionDef = MODULE_OPTIONS[module].find((o) => o.key === key);
      if (optionDef) {
        parts.push(`${optionDef.label}：${value}`);
      }
    }
  }
  return parts.join('；');
}

/** 各模块的 prompt 模板 */
const MODULE_PROMPTS: Record<GenerateModule, {
  system: string;
  userTemplate: (hint: string, options: string, existing: string, names: string) => string;
}> = {
  outline: {
    system: `你是一位资深小说大纲规划师。你需要根据已有设定和人物信息，为小说生成结构化的大纲。
输出格式要求（严格遵守）：
- 每个大纲节点一行，格式为：[类型] 标题：摘要
- 类型只能是：卷、章、节
- 使用缩进表示层级关系（卷→章→节），每级缩进2个空格
- 情节需有起承转合，主线清晰
- 必须基于已有的人物和设定来设计情节
- 摘要需具体描述该节的核心事件或冲突`,
    userTemplate: (hint, options, existing, names) =>
      `请为我的小说生成完整大纲结构。
${options ? `生成要求：${options}` : ''}
${hint ? `额外说明：${hint}` : ''}
${existing ? `已有设定和上下文：\n${existing}` : ''}
${names ? `已有大纲节点（请勿重复）：${names}` : ''}

请生成小说大纲，注意情节要有张力和递进感。`,
  },

  chapter: {
    system: `你是一位资深小说作家。你需要根据已有的大纲、人物和设定，撰写小说章节正文。
输出格式要求（严格遵守）：
- 每个章节一行标题，格式为：[章] 标题
- 紧跟正文内容，写在该标题下方
- 正文需要生动的描写、对话和内心活动
- 必须基于已有的人物和设定来创作
- 保持人物性格一致，情节符合大纲设定
- 文学性强，有画面感，避免平铺直叙`,
    userTemplate: (hint, options, existing, names) =>
      `请为我的小说撰写章节正文。
${options ? `写作要求：${options}` : ''}
${hint ? `额外说明：${hint}` : ''}
${existing ? `已有设定和上下文：\n${existing}` : ''}
${names ? `已有章节（请勿重复）：${names}` : ''}

请撰写小说章节正文，注意文学性和画面感。`,
  },

  plotline: {
    system: `你是一位小说剧情线设计师。你需要根据已有大纲和人物，生成主线条或支线的剧情节点。
输出格式要求（严格遵守）：
- 每个剧情节点必须独占一块，节点之间用空行分隔
- 格式为：标题：内容摘要
- 标题简洁（10字以内），冒号后紧跟内容摘要
- 节点按时间顺序排列
- 每个节点需明确涉及哪些人物和关键事件
- 支线需说明与主线的交汇点
- 内容摘要要具体，不能太泛泛
- 不要使用Markdown粗体、斜体等格式，只用纯文本

正确示例：
起程离乡：主角告别家乡，踏上修仙之路，途中遭遇劫匪

初入宗门：主角通过考核加入天剑宗，被分配到外门，结识师兄陈风

错误示例（不要这样写）：
**起程离乡**：主角告别家乡...（不要用粗体）
1. 起程离乡
主角告别家乡...（标题和内容不要分两行）`,
    userTemplate: (hint, options, existing, names) =>
      `请为我的小说生成剧情线节点。
${options ? `生成要求：${options}` : ''}
${hint ? `额外说明：${hint}` : ''}
${existing ? `已有设定和上下文：\n${existing}` : ''}
${names ? `已有剧情节点（请勿重复）：${names}` : ''}

请生成剧情线节点列表，每个节点格式为"标题：内容摘要"，节点间用空行分隔。`,
  },

  character: {
    system: `你是一位小说人物设计师。你需要根据已有世界观设定，生成丰富的角色设定。
输出格式要求（严格遵守，每个角色用---分隔）：
---
姓名：角色名
别名：如无则写"无"
外貌：80-150字详细描写
性格：100-200字，含优缺点
背景故事：150-300字
所属势力：势力名
角色定位：主角/配角/反派/导师/守护者/背叛者等
---
注意：
- 每个字段必须独占一行，字段名后紧跟冒号和值
- 字段值不要换行，写在一行内
- 角色间用---分隔
- 角色间应有关系和冲突潜力
- 性格要立体，避免脸谱化
- 背景故事需与世界观设定呼应
- 外貌描写要有辨识度`,
    userTemplate: (hint, options, existing, names) =>
      `请为我的小说生成角色设定。
${options ? `生成要求：${options}` : ''}
${hint ? `额外说明：${hint}` : ''}
${existing ? `已有设定和上下文：\n${existing}` : ''}
${names ? `已有角色（请勿重复）：${names}` : ''}

请生成新角色，确保角色间有互动和冲突潜力。每个角色用---分隔，每个字段写在一行。`,
  },

  relation: {
    system: `你是一位小说人物关系设计师。你需要根据已有角色信息，生成角色间的关系网络。
输出格式要求（严格遵守）：
- 每条关系一行，格式为：人物A → 人物B：关系类型（描述）
- 关系类型示例：师徒、恋人、敌对、盟友、主仆、亲缘、暗恋、利用、竞争等
- 关系要有层次：亲密关系、利益关系、对立关系
- 注意关系的对称性和合理性
- 描述要具体，说明关系的起因和特点`,
    userTemplate: (hint, options, existing, names) =>
      `请为我的小说角色设计关系网络。
${options ? `生成要求：${options}` : ''}
${hint ? `额外说明：${hint}` : ''}
${existing ? `已有设定和上下文：\n${existing}` : ''}
${names ? `现有角色（请只使用这些角色名称）：${names}` : ''}

请设计角色间的关系网络，注意要有张力和冲突。`,
  },

  setting: {
    system: `你是一位小说世界观架构师。你需要为小说生成丰富的世界观设定。
输出格式要求（严格遵守，每个设定项用---分隔）：
---
设定名称：
分类：（地理/势力/力量体系/种族/历史/文化/科技/经济/其他）
内容：（详细描述，含规则、限制、特征等）
---
- 设定需有内在逻辑和一致性
- 内容要具体，有规则和限制，避免空泛
- 不同设定间应有联系和影响
- 要有可冲突的设计空间`,
    userTemplate: (hint, options, existing, names) =>
      `请为我的小说生成世界观设定。
${options ? `生成要求：${options}` : ''}
${hint ? `额外说明：${hint}` : ''}
${existing ? `已有设定和上下文：\n${existing}` : ''}
${names ? `已有设定项（请勿重复）：${names}` : ''}

请生成世界观设定，确保有创意且逻辑自洽。`,
  },
};

/** AI 一键生成服务 */
export { AIError, AIErrorType } from './aiService';

export const aiGenerateService = {
  /**
   * 为指定模块生成内容
   */
  async generate(request: GenerateRequest): Promise<string> {
    const template = MODULE_PROMPTS[request.module];
    const names = request.existingNames?.join('、') ?? '';
    const optionsText = buildOptionsText(request.module, request.optionValues ?? {});

    let contextText = request.existingContext ?? '';
    if (!contextText) {
      try {
        const assembled = await contextAssembler.assembleContext({
          additionalInstructions: template.system,
        });
        contextText = assembled.contextText;
      } catch {
        // 上下文获取失败不影响生成
      }
    }

    const userPrompt = template.userTemplate(
      request.userHint ?? '',
      optionsText,
      contextText,
      names,
    );

    const result = await aiService.generate(
      {
        prompt: userPrompt,
        systemPrompt: template.system,
        temperature: 0.8,
        maxTokens: 4000,
        onChunk: request.onChunk,
        signal: request.signal,
      },
      request.config,
    );

    return result.content;
  },

  /**
   * 解析大纲生成结果为结构化数据
   */
  parseOutlineResult(content: string): Array<{ nodeType: string; title: string; content: string; indent: number }> {
    const lines = content.split('\n').filter((l) => l.trim());
    const result: Array<{ nodeType: string; title: string; content: string; indent: number }> = [];

    for (const line of lines) {
      const indent = line.search(/\S/);
      const trimmed = line.trim();

      const match = trimmed.match(/^\[?(卷|章|节)\]?\s*(.+?)(?:[：:]\s*(.+))?$/);
      if (match) {
        result.push({
          nodeType: match[1] === '卷' ? 'VOLUME' : match[1] === '章' ? 'CHAPTER' : 'SECTION',
          title: match[2].trim(),
          content: match[3]?.trim() ?? '',
          indent: Math.floor(indent / 2),
        });
      }
    }

    return result;
  },

  /**
   * 解析剧情线生成结果
   * 支持格式：
   *   1. 标题：内容摘要  （单行格式）
   *   2. **标题**：内容摘要 （Markdown粗体）
   *   3. 标题\n内容摘要    （标题和内容分两行）
   *   4. 多行内容（内容跨行直到下一个标题或空行）
   */
  parsePlotlineResult(content: string): Array<{ title: string; content: string }> {
    const result: Array<{ title: string; content: string }> = [];
    const lines = content.split('\n');

    // 策略1：按空行分块解析，支持多行内容
    const blocks: Array<{ titleLine: string; contentLines: string[] }> = [];
    let currentBlock: { titleLine: string; contentLines: string[] } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        continue;
      }

      // 检测标题行：以序号开头 + 冒号分隔，或粗体标题
      const isTitleLine =
        /^\s*[-•*\d.、)]+\s*/.test(trimmed) && /[：:]/.test(trimmed) ||
        /^\s*\*{1,2}[^*]+\*{1,2}\s*[：:]/.test(trimmed) ||
        (/^\s*[-•*\d.、)]+\s*/.test(trimmed) && !currentBlock);

      if (isTitleLine && !currentBlock) {
        currentBlock = { titleLine: trimmed, contentLines: [] };
      } else if (isTitleLine && currentBlock && currentBlock.contentLines.length === 0) {
        // 当前块只有标题没有内容，保存并开始新块
        blocks.push(currentBlock);
        currentBlock = { titleLine: trimmed, contentLines: [] };
      } else if (currentBlock) {
        currentBlock.contentLines.push(trimmed);
      } else {
        // 没有在块中，可能是独立的一行
        currentBlock = { titleLine: trimmed, contentLines: [] };
      }
    }
    if (currentBlock) blocks.push(currentBlock);

    for (const block of blocks) {
      // 尝试从标题行提取 title:content
      let title = '';
      let content = '';

      // 格式A: 序号 + 标题：内容
      const matchA = block.titleLine.match(/^[-•*\d.、)]+\s*(.+?)[：:]\s*(.+)$/);
      if (matchA) {
        title = matchA[1].replace(/\*+/g, '').trim();
        content = [matchA[2].trim(), ...block.contentLines].join('\n').trim();
      } else {
        // 格式B: 粗体标题：内容
        const matchB = block.titleLine.match(/^\*{1,2}([^*]+)\*{1,2}\s*[：:]\s*(.+)$/);
        if (matchB) {
          title = matchB[1].trim();
          content = [matchB[2].trim(), ...block.contentLines].join('\n').trim();
        } else {
          // 格式C: 序号 + 标题（无冒号），内容在后续行
          const matchC = block.titleLine.match(/^[-•*\d.、)]+\s*(.+)$/);
          if (matchC && block.contentLines.length > 0) {
            title = matchC[1].replace(/\*+/g, '').trim();
            content = block.contentLines.join('\n').trim();
          } else {
            // 格式D: 纯文本 标题：内容（无序号）
            const matchD = block.titleLine.match(/^(.+?)[：:]\s*(.+)$/);
            if (matchD && matchD[1].length < 50) {
              title = matchD[1].replace(/\*+/g, '').trim();
              content = [matchD[2].trim(), ...block.contentLines].join('\n').trim();
            }
          }
        }
      }

      if (title) {
        result.push({ title, content });
      }
    }

    // 如果块解析失败，回退到逐行解析
    if (result.length === 0) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const match = trimmed.match(/^[-•*\d.、)]+\s*(.+?)[：:]\s*(.+)$/);
        if (match) {
          result.push({
            title: match[1].replace(/\*+/g, '').trim(),
            content: match[2].trim(),
          });
        }
      }
    }

    return result;
  },

  /**
   * 解析人物生成结果
   * 支持格式：---分隔 + 字段标签:值（值可跨多行直到下一个标签）
   * 也支持无---分隔的格式（用"姓名"标签作为角色分界）
   */
  parseCharacterResult(content: string): Array<{
    name: string; alias: string; appearance: string; personality: string;
    background: string; faction: string; role: string;
  }> {
    const characters: Array<{
      name: string; alias: string; appearance: string; personality: string;
      background: string; faction: string; role: string;
    }> = [];

    // 先按 --- 分块
    let blocks = content.split(/---+/).filter((b) => b.trim());

    // 如果---分割后只有一个块，尝试用"姓名"标签分块
    if (blocks.length <= 1) {
      const nameRegex = /姓名[：:]/g;
      const splits: number[] = [];
      let m;
      while ((m = nameRegex.exec(content)) !== null) {
        splits.push(m.index);
      }
      if (splits.length > 1) {
        blocks = [];
        for (let i = 0; i < splits.length; i++) {
          const start = splits[i];
          const end = i + 1 < splits.length ? splits[i + 1] : content.length;
          blocks.push(content.slice(start, end));
        }
      }
    }

    // 已知字段标签列表（按优先级排序，匹配时用最长的）
    const FIELD_LABELS = [
      '背景故事', '所属势力', '角色定位',
      '姓名', '别名', '外貌', '性格', '背景', '势力', '阵营', '定位',
    ];

    for (const block of blocks) {
      // 多行字段解析：匹配到下一个字段标签为止
      const getField = (labels: string[]): string => {
        for (const label of labels) {
          const regex = new RegExp(`${label}[：:]\\s*([\\s\\S]*?)(?=\\n\\s*(?:${FIELD_LABELS.join('|')})[：:]|$)`, 'i');
          const match = block.match(regex);
          if (match?.[1]?.trim()) {
            return match[1].trim();
          }
        }
        return '';
      };

      const name = getField(['姓名']);
      if (!name) continue;

      characters.push({
        name,
        alias: getField(['别名']),
        appearance: getField(['外貌']),
        personality: getField(['性格']),
        background: getField(['背景故事', '背景']),
        faction: getField(['所属势力', '势力', '阵营']),
        role: getField(['角色定位', '定位']),
      });
    }

    return characters;
  },

  /**
   * 解析人物关系生成结果
   */
  parseRelationResult(content: string): Array<{
    sourceName: string; targetName: string; relationType: string; description: string;
  }> {
    const lines = content.split('\n').filter((l) => l.trim());
    const result: Array<{
      sourceName: string; targetName: string; relationType: string; description: string;
    }> = [];

    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^[-•*\d.、)]+\s*(.+?)\s*[→➡>—]+\s*(.+?)\s*[：:]\s*(.+?)(?:[（(](.+?)[）)])?\s*$/);
      if (match) {
        result.push({
          sourceName: match[1].trim(),
          targetName: match[2].trim(),
          relationType: match[3].trim(),
          description: match[4]?.trim() ?? '',
        });
      }
    }

    return result;
  },

  /**
   * 解析章节生成结果
   * 支持格式：[章] 标题\n正文内容（多行）
   * 如果没有 [章] 标记，整段作为一个章节（标题取首行）
   */
  parseChapterResult(content: string): Array<{ title: string; content: string }> {
    const result: Array<{ title: string; content: string }> = [];
    const lines = content.split('\n');

    let currentTitle = '';
    let currentLines: string[] = [];

    const flushChapter = () => {
      if (currentTitle || currentLines.length > 0) {
        // 如果没有标题但有内容，用首行作为标题
        if (!currentTitle && currentLines.length > 0) {
          const firstLine = currentLines[0].trim();
          // 首行太长时截取前20字
          currentTitle = firstLine.length > 20 ? firstLine.slice(0, 20) + '...' : firstLine;
          currentLines = currentLines.slice(1);
        }
        const chapterContent = currentLines.join('\n').trim();
        if (currentTitle || chapterContent) {
          result.push({
            title: currentTitle || '无标题',
            content: chapterContent,
          });
        }
        currentTitle = '';
        currentLines = [];
      }
    };

    for (const line of lines) {
      // 匹配 [章] 标题 或 【章】标题 格式
      const chapterMatch = line.match(/^\s*\[章\]\s*(.+)$/) || line.match(/^\s*【章】\s*(.+)$/);
      if (chapterMatch) {
        // 遇到新章节标记，先保存之前的
        flushChapter();
        currentTitle = chapterMatch[1].trim();
      } else {
        currentLines.push(line);
      }
    }
    // 保存最后一个章节
    flushChapter();

    // 如果完全没解析出章节（无 [章] 标记），把整个内容作为一个章节
    if (result.length === 0 && content.trim()) {
      const contentLines = content.split('\n');
      // 尝试用首行做标题
      const firstLine = contentLines[0].trim();
      let title = '新章节';
      let chapterContent = content.trim();

      // 如果首行较短且不像正文，当标题用
      if (firstLine.length <= 30 && firstLine.length > 0) {
        title = firstLine;
        chapterContent = contentLines.slice(1).join('\n').trim();
      }

      result.push({ title, content: chapterContent });
    }

    return result;
  },

  /**
   * 解析设定生成结果
   * 支持多行字段值（值跨行直到下一个标签）
   */
  parseSettingResult(content: string): Array<{
    name: string; category: string; content: string;
  }> {
    const blocks = content.split(/---+/).filter((b) => b.trim());
    const result: Array<{ name: string; category: string; content: string }> = [];

    // 已知字段标签
    const FIELD_LABELS = ['设定名称', '名称', '分类', '内容'];

    for (const block of blocks) {
      const getField = (labels: string[]): string => {
        for (const label of labels) {
          const regex = new RegExp(`${label}[：:]\\s*([\\s\\S]*?)(?=\\n\\s*(?:${FIELD_LABELS.join('|')})[：:]|$)`, 'i');
          const match = block.match(regex);
          if (match?.[1]?.trim()) {
            return match[1].trim();
          }
        }
        return '';
      };

      const name = getField(['设定名称', '名称']);
      if (!name) continue;

      const category = getField(['分类']);
      const detailContent = getField(['内容']);

      result.push({ name, category, content: detailContent });
    }

    return result;
  },
};
