/**
 * 导出/导入服务
 * 支持完整项目的 JSON 导出与导入，以及 TXT/Markdown 格式导出
 */
import { db } from '../db';
import { generateId } from '../utils/id';
import type { OutlineNode } from '../types/outline';
import type { Plotline, PlotlineNode } from '../types/plotline';
import type { Character } from '../types/character';
import type { Relation } from '../types/relation';
import type { SettingCategory, SettingItem } from '../types/setting';
import type { Chapter } from '../types/chapter';
import type { Faction } from '../types/faction';
import type { Reference, ImpactAlert } from '../types/linkage';

/** 导出数据结构 */
export interface ExportData {
  version: string;
  exportedAt: number;
  project: {
    id: string;
    name: string;
    description: string;
  };
  data: {
    outlineNodes: OutlineNode[];
    plotlines: Plotline[];
    plotlineNodes: PlotlineNode[];
    characters: Character[];
    relations: Relation[];
    settingCategories: SettingCategory[];
    settingItems: SettingItem[];
    chapters: Chapter[];
    factions: Faction[];
    references: Reference[];
    impactAlerts: ImpactAlert[];
  };
}

/** 当前导出格式版本 */
const EXPORT_VERSION = '2.0.0';

/** 版本迁移函数映射 */
const MIGRATIONS: Record<string, (data: ExportData) => ExportData> = {
  // 未来版本迁移示例：
  // '1.0.0': (data) => { /* 迁移逻辑 */ return data; },
};

/** 导出选项 */
export interface ExportOptions {
  /** 导出格式 */
  format: ExportFormat;
  /** 包含的模块 */
  includeModules: {
    outline: boolean;
    chapter: boolean;
    plotline: boolean;
    character: boolean;
    relation: boolean;
    setting: boolean;
    faction: boolean;
  };
  /** Markdown/TXT 是否只导出完稿章节 */
  onlyCompletedChapters?: boolean;
}

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'json',
  includeModules: {
    outline: true,
    chapter: true,
    plotline: true,
    character: true,
    relation: true,
    setting: true,
    faction: true,
  },
  onlyCompletedChapters: false,
};

/** 导出导入服务 */
export const exportImportService = {
  /**
   * 导出项目数据为 JSON
   */
  async exportProject(
    projectId: string,
    projectName: string = '我的小说',
    projectDescription: string = '',
    options: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  ): Promise<string> {
    const [
      outlineNodes,
      plotlines,
      plotlineNodes,
      characters,
      relations,
      settingCategories,
      settingItems,
      chapters,
      factions,
      references,
      impactAlerts,
    ] = await Promise.all([
      db.outlineNodes.where('projectId').equals(projectId).toArray(),
      db.plotlines.where('projectId').equals(projectId).toArray(),
      db.plotlineNodes.where('projectId').equals(projectId).toArray(),
      db.characters.where('projectId').equals(projectId).toArray(),
      db.relations.where('projectId').equals(projectId).toArray(),
      db.settingCategories.where('projectId').equals(projectId).toArray(),
      db.settingItems.where('projectId').equals(projectId).toArray(),
      db.chapters.where('projectId').equals(projectId).toArray(),
      db.factions.where('projectId').equals(projectId).toArray(),
      db.references.toArray(),
      db.impactAlerts.where('projectId').equals(projectId).toArray(),
    ]);

    const exportData: ExportData = {
      version: EXPORT_VERSION,
      exportedAt: Date.now(),
      project: {
        id: projectId,
        name: projectName,
        description: projectDescription,
      },
      data: {
        outlineNodes: options.includeModules.outline ? outlineNodes : [],
        plotlines: options.includeModules.plotline ? plotlines : [],
        plotlineNodes: options.includeModules.plotline ? plotlineNodes : [],
        characters: options.includeModules.character ? characters : [],
        relations: options.includeModules.relation ? relations : [],
        settingCategories: options.includeModules.setting ? settingCategories : [],
        settingItems: options.includeModules.setting ? settingItems : [],
        chapters: options.includeModules.chapter ? chapters : [],
        factions: options.includeModules.faction ? factions : [],
        references,
        impactAlerts,
      },
    };

    return JSON.stringify(exportData, null, 2);
  },

  /**
   * 导出为 TXT 纯文本格式
   */
  async exportAsTxt(
    projectId: string,
    projectName: string = '我的小说',
    options: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  ): Promise<string> {
    const lines: string[] = [];
    const separator = '═'.repeat(40);
    const thinSep = '─'.repeat(40);

    lines.push(separator);
    lines.push(projectName);
    lines.push(separator);
    lines.push('');

    // 大纲
    if (options.includeModules.outline) {
      const nodes = await db.outlineNodes.where('projectId').equals(projectId).sortBy('sortOrder');
      if (nodes.length > 0) {
        lines.push('【大纲】');
        lines.push(thinSep);
        const typeLabels: Record<string, string> = { VOLUME: '卷', CHAPTER: '章', SECTION: '节' };
        for (const node of nodes) {
          const indent = '  '.repeat(getOutlineDepth(nodes, node.id));
          lines.push(`${indent}${typeLabels[node.nodeType] ?? '节'} ${node.title}`);
          if (node.content) lines.push(`${indent}  ${node.content}`);
        }
        lines.push('');
      }
    }

    // 正文
    if (options.includeModules.chapter) {
      const chapters = await db.chapters.where('projectId').equals(projectId).sortBy('sortOrder');
      const filteredChapters = options.onlyCompletedChapters
        ? chapters.filter((c) => c.status === 'COMPLETE')
        : chapters;
      if (filteredChapters.length > 0) {
        lines.push('【正文】');
        lines.push(thinSep);
        for (const ch of filteredChapters) {
          lines.push('');
          lines.push(`${ch.title}`);
          lines.push(thinSep);
          lines.push(ch.content || '（空）');
          lines.push('');
        }
        lines.push('');
      }
    }

    // 剧情线
    if (options.includeModules.plotline) {
      const plotlines = await db.plotlines.where('projectId').equals(projectId).toArray();
      const nodes = await db.plotlineNodes.where('projectId').equals(projectId).sortBy('sortOrder');
      if (plotlines.length > 0) {
        lines.push('【剧情线】');
        lines.push(thinSep);
        for (const pl of plotlines) {
          const typeLabel = pl.lineType === 'MAIN' ? '主线' : '支线';
          lines.push(`${pl.name}（${typeLabel}）`);
          if (pl.description) lines.push(`  描述：${pl.description}`);
          const plNodes = nodes.filter((n) => n.plotlineId === pl.id);
          for (const node of plNodes) {
            lines.push(`  → ${node.title}`);
            if (node.content) lines.push(`    ${node.content}`);
          }
          lines.push('');
        }
        lines.push('');
      }
    }

    // 角色
    if (options.includeModules.character) {
      const characters = await db.characters.where('projectId').equals(projectId).toArray();
      if (characters.length > 0) {
        lines.push('【角色】');
        lines.push(thinSep);
        for (const c of characters) {
          lines.push(`${c.name}${c.alias ? `（${c.alias}）` : ''}`);
          if (c.appearance) lines.push(`  外貌：${c.appearance}`);
          if (c.personality) lines.push(`  性格：${c.personality}`);
          if (c.background) lines.push(`  背景：${c.background}`);
          if (c.faction) lines.push(`  势力：${c.faction}`);
          lines.push('');
        }
        lines.push('');
      }
    }

    // 角色关系
    if (options.includeModules.relation) {
      const relations = await db.relations.where('projectId').equals(projectId).toArray();
      const characters = await db.characters.where('projectId').equals(projectId).toArray();
      if (relations.length > 0) {
        lines.push('【角色关系】');
        lines.push(thinSep);
        const charNameMap = new Map(characters.map((c) => [c.id, c.name]));
        for (const rel of relations) {
          const src = charNameMap.get(rel.sourceId) ?? '未知';
          const tgt = charNameMap.get(rel.targetId) ?? '未知';
          lines.push(`${src} → ${tgt}：${rel.relationType}${rel.description ? `（${rel.description}）` : ''}`);
        }
        lines.push('');
      }
    }

    // 设定
    if (options.includeModules.setting) {
      const categories = await db.settingCategories.where('projectId').equals(projectId).sortBy('sortOrder');
      const items = await db.settingItems.where('projectId').equals(projectId).toArray();
      if (categories.length > 0 || items.length > 0) {
        lines.push('【世界设定】');
        lines.push(thinSep);
        for (const cat of categories) {
          lines.push(`${cat.icon ?? '📁'} ${cat.name}`);
          const catItems = items.filter((i) => i.categoryId === cat.id);
          for (const item of catItems) {
            lines.push(`  ◆ ${item.name}`);
            if (item.content) lines.push(`    ${item.content}`);
          }
          lines.push('');
        }
        lines.push('');
      }
    }

    // 组织
    if (options.includeModules.faction) {
      const factions = await db.factions.where('projectId').equals(projectId).toArray();
      if (factions.length > 0) {
        const typeLabels: Record<string, string> = { clan: '家族', sect: '门派', org: '组织', nation: '国家', tribe: '部落', guild: '公会' };
        lines.push('【组织】');
        lines.push(thinSep);
        for (const f of factions) {
          lines.push(`${f.name}（${typeLabels[f.factionType] ?? f.factionType}）}`);
          if (f.description) lines.push(`  描述：${f.description}`);
          lines.push('');
        }
        lines.push('');
      }
    }

    // 统计信息
    const chapters = await db.chapters.where('projectId').equals(projectId).toArray();
    const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
    lines.push(separator);
    lines.push(`总字数：${totalWords.toLocaleString()}`);
    lines.push(`导出时间：${new Date().toLocaleString('zh-CN')}`);
    lines.push(separator);

    return lines.join('\n');
  },

  /**
   * 导出为 Markdown 格式
   */
  async exportAsMarkdown(
    projectId: string,
    projectName: string = '我的小说',
    options: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  ): Promise<string> {
    const lines: string[] = [];

    lines.push(`# ${projectName}`);
    lines.push('');

    // 大纲
    if (options.includeModules.outline) {
      const nodes = await db.outlineNodes.where('projectId').equals(projectId).sortBy('sortOrder');
      if (nodes.length > 0) {
        lines.push('## 📋 大纲');
        lines.push('');
        const typeLabels: Record<string, string> = { VOLUME: '卷', CHAPTER: '章', SECTION: '节' };
        for (const node of nodes) {
          const depth = getOutlineDepth(nodes, node.id);
          const prefix = '#'.repeat(Math.min(depth + 3, 6));
          lines.push(`${prefix} ${typeLabels[node.nodeType] ?? '节'} ${node.title}`);
          if (node.content) lines.push('');
          if (node.content) lines.push(node.content);
          lines.push('');
        }
      }
    }

    // 正文
    if (options.includeModules.chapter) {
      const chapters = await db.chapters.where('projectId').equals(projectId).sortBy('sortOrder');
      const filteredChapters = options.onlyCompletedChapters
        ? chapters.filter((c) => c.status === 'COMPLETE')
        : chapters;
      if (filteredChapters.length > 0) {
        lines.push('## 📖 正文');
        lines.push('');
        for (const ch of filteredChapters) {
          lines.push(`### ${ch.title}`);
          lines.push('');
          lines.push(ch.content || '*（空）*');
          lines.push('');
          lines.push('---');
          lines.push('');
        }
      }
    }

    // 剧情线
    if (options.includeModules.plotline) {
      const plotlines = await db.plotlines.where('projectId').equals(projectId).toArray();
      const nodes = await db.plotlineNodes.where('projectId').equals(projectId).sortBy('sortOrder');
      if (plotlines.length > 0) {
        lines.push('## 📈 剧情线');
        lines.push('');
        for (const pl of plotlines) {
          const typeLabel = pl.lineType === 'MAIN' ? '🔵 主线' : '🟢 支线';
          lines.push(`### ${typeLabel} ${pl.name}`);
          if (pl.description) lines.push(`\n> ${pl.description}`);
          lines.push('');
          const plNodes = nodes.filter((n) => n.plotlineId === pl.id);
          for (const node of plNodes) {
            lines.push(`- **${node.title}**`);
            if (node.content) lines.push(`  ${node.content}`);
          }
          lines.push('');
        }
      }
    }

    // 角色
    if (options.includeModules.character) {
      const characters = await db.characters.where('projectId').equals(projectId).toArray();
      if (characters.length > 0) {
        lines.push('## 👤 角色');
        lines.push('');
        for (const c of characters) {
          lines.push(`### ${c.name}${c.alias ? `（${c.alias}）` : ''}`);
          lines.push('');
          if (c.appearance) lines.push(`**外貌**：${c.appearance}  `);
          if (c.personality) lines.push(`**性格**：${c.personality}  `);
          if (c.background) lines.push(`**背景**：${c.background}  `);
          if (c.faction) lines.push(`**势力**：${c.faction}  `);
          lines.push('');
        }
      }
    }

    // 角色关系
    if (options.includeModules.relation) {
      const relations = await db.relations.where('projectId').equals(projectId).toArray();
      const characters = await db.characters.where('projectId').equals(projectId).toArray();
      if (relations.length > 0) {
        lines.push('## 🔗 角色关系');
        lines.push('');
        const charNameMap = new Map(characters.map((c) => [c.id, c.name]));
        for (const rel of relations) {
          const src = charNameMap.get(rel.sourceId) ?? '未知';
          const tgt = charNameMap.get(rel.targetId) ?? '未知';
          lines.push(`- **${src}** → **${tgt}**：${rel.relationType}${rel.description ? `（${rel.description}）` : ''}`);
        }
        lines.push('');
      }
    }

    // 设定
    if (options.includeModules.setting) {
      const categories = await db.settingCategories.where('projectId').equals(projectId).sortBy('sortOrder');
      const items = await db.settingItems.where('projectId').equals(projectId).toArray();
      if (categories.length > 0 || items.length > 0) {
        lines.push('## 🌍 世界设定');
        lines.push('');
        for (const cat of categories) {
          lines.push(`### ${cat.icon ?? '📁'} ${cat.name}`);
          lines.push('');
          const catItems = items.filter((i) => i.categoryId === cat.id);
          for (const item of catItems) {
            lines.push(`#### ${item.name}`);
            if (item.content) lines.push(`\n${item.content}`);
            lines.push('');
          }
        }
      }
    }

    // 组织
    if (options.includeModules.faction) {
      const factions = await db.factions.where('projectId').equals(projectId).toArray();
      if (factions.length > 0) {
        const typeLabels: Record<string, string> = { clan: '家族', sect: '门派', org: '组织', nation: '国家', tribe: '部落', guild: '公会' };
        lines.push('## 🏛️ 组织');
        lines.push('');
        for (const f of factions) {
          lines.push(`### ${f.name}（${typeLabels[f.factionType] ?? f.factionType}）`);
          if (f.description) lines.push(`\n${f.description}`);
          lines.push('');
        }
      }
    }

    // 统计信息
    const chapters = await db.chapters.where('projectId').equals(projectId).toArray();
    const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
    lines.push('---');
    lines.push('');
    lines.push(`> 总字数：${totalWords.toLocaleString()} | 导出时间：${new Date().toLocaleString('zh-CN')}`);

    return lines.join('\n');
  },

  /**
   * 下载导出文件
   */
  async downloadExport(
    projectId: string,
    projectName: string = '我的小说',
    projectDescription: string = '',
    options: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  ): Promise<void> {
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (options.format) {
      case 'txt':
        content = await this.exportAsTxt(projectId, projectName, options);
        mimeType = 'text/plain;charset=utf-8';
        extension = 'txt';
        break;
      case 'markdown':
        content = await this.exportAsMarkdown(projectId, projectName, options);
        mimeType = 'text/markdown;charset=utf-8';
        extension = 'md';
        break;
      case 'json':
      default:
        content = await this.exportProject(projectId, projectName, projectDescription, options);
        mimeType = 'application/json';
        extension = 'json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_${new Date().toISOString().slice(0, 10)}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * 从 JSON 导入项目数据
   */
  async importProject(jsonString: string, targetProjectId: string, mergeMode: boolean = false): Promise<void> {
    let data: ExportData = JSON.parse(jsonString);

    if (!data.version || !data.data) {
      throw new Error('无效的导入文件格式（缺少版本号或数据）');
    }

    // 版本迁移
    if (data.version !== EXPORT_VERSION) {
      let migrated = false;
      for (const [version, migrateFn] of Object.entries(MIGRATIONS)) {
        if (compareVersions(data.version, version) < 0) {
          data = migrateFn(data);
          migrated = true;
        }
      }
      if (migrated) {
        data.version = EXPORT_VERSION;
        console.log(`[ExportImport] 数据已从旧版本迁移到 ${EXPORT_VERSION}`);
      }
    }

    if (!mergeMode) {
      await clearProjectData(targetProjectId);
    }

    const idMap = new Map<string, string>();

    // 导入设定分类（先导入，设定项依赖分类ID）
    for (const cat of data.data.settingCategories) {
      const oldId = cat.id;
      if (!mergeMode) {
        await db.settingCategories.add({ ...cat, projectId: targetProjectId });
      } else {
        const newId = generateId();
        idMap.set(oldId, newId);
        await db.settingCategories.add({ ...cat, id: newId, projectId: targetProjectId });
      }
    }

    // 导入设定项
    for (const item of data.data.settingItems) {
      const oldId = item.id;
      const categoryId = idMap.get(item.categoryId) ?? item.categoryId;
      if (!mergeMode) {
        await db.settingItems.add({ ...item, categoryId, projectId: targetProjectId });
      } else {
        const newId = generateId();
        idMap.set(oldId, newId);
        await db.settingItems.add({ ...item, id: newId, categoryId, projectId: targetProjectId });
      }
    }

    // 导入组织
    for (const faction of (data.data.factions || [])) {
      const oldId = faction.id;
      if (!mergeMode) {
        await db.factions.add({ ...faction, projectId: targetProjectId });
      } else {
        const newId = generateId();
        idMap.set(oldId, newId);
        await db.factions.add({ ...faction, id: newId, projectId: targetProjectId });
      }
    }

    // 导入角色（先导入，关系依赖角色ID）
    for (const char of data.data.characters) {
      const oldId = char.id;
      if (!mergeMode) {
        await db.characters.add({ ...char, projectId: targetProjectId });
      } else {
        const newId = generateId();
        idMap.set(oldId, newId);
        await db.characters.add({ ...char, id: newId, projectId: targetProjectId });
      }
    }

    // 导入大纲节点
    for (const node of data.data.outlineNodes) {
      const oldId = node.id;
      const parentId = idMap.get(node.parentId) ?? node.parentId;
      if (!mergeMode) {
        await db.outlineNodes.add({ ...node, projectId: targetProjectId });
      } else {
        const newId = generateId();
        idMap.set(oldId, newId);
        await db.outlineNodes.add({
          ...node, id: newId, parentId, projectId: targetProjectId,
          characterRefs: node.characterRefs.map((id) => idMap.get(id) ?? id),
          settingRefs: node.settingRefs.map((id) => idMap.get(id) ?? id),
          plotlineRefs: node.plotlineRefs.map((id) => idMap.get(id) ?? id),
        });
      }
    }

    // 导入剧情线
    for (const pl of data.data.plotlines) {
      const oldId = pl.id;
      if (!mergeMode) {
        await db.plotlines.add({ ...pl, projectId: targetProjectId });
      } else {
        const newId = generateId();
        idMap.set(oldId, newId);
        await db.plotlines.add({ ...pl, id: newId, projectId: targetProjectId });
      }
    }

    // 导入剧情节点
    for (const node of data.data.plotlineNodes) {
      const oldId = node.id;
      const plotlineId = idMap.get(node.plotlineId) ?? node.plotlineId;
      if (!mergeMode) {
        await db.plotlineNodes.add({ ...node, projectId: targetProjectId });
      } else {
        const newId = generateId();
        idMap.set(oldId, newId);
        await db.plotlineNodes.add({
          ...node, id: newId, plotlineId, projectId: targetProjectId,
          outlineNodeRefs: node.outlineNodeRefs.map((id) => idMap.get(id) ?? id),
          characterRefs: node.characterRefs.map((id) => idMap.get(id) ?? id),
          settingRefs: node.settingRefs.map((id) => idMap.get(id) ?? id),
        });
      }
    }

    // 导入关系
    for (const rel of data.data.relations) {
      if (!mergeMode) {
        await db.relations.add({ ...rel, projectId: targetProjectId });
      } else {
        const newId = generateId();
        await db.relations.add({
          ...rel, id: newId, projectId: targetProjectId,
          sourceId: idMap.get(rel.sourceId) ?? rel.sourceId,
          targetId: idMap.get(rel.targetId) ?? rel.targetId,
        });
      }
    }

    // 导入章节
    for (const ch of (data.data.chapters || [])) {
      const oldId = ch.id;
      const parentId = idMap.get(ch.parentId) ?? ch.parentId;
      if (!mergeMode) {
        await db.chapters.add({ ...ch, projectId: targetProjectId });
      } else {
        const newId = generateId();
        idMap.set(oldId, newId);
        await db.chapters.add({
          ...ch, id: newId, parentId, projectId: targetProjectId,
          characterRefs: (ch.characterRefs || []).map((id: string) => idMap.get(id) ?? id),
          settingRefs: (ch.settingRefs || []).map((id: string) => idMap.get(id) ?? id),
        });
      }
    }

    // 导入引用（Reference没有projectId，合并模式下需要重新映射ID）
    for (const ref of data.data.references) {
      if (!mergeMode) {
        await db.references.add(ref);
      } else {
        const newId = generateId();
        await db.references.add({
          ...ref, id: newId,
          sourceId: idMap.get(ref.sourceId) ?? ref.sourceId,
          targetId: idMap.get(ref.targetId) ?? ref.targetId,
        });
      }
    }

    // 导入影响提醒
    for (const alert of data.data.impactAlerts) {
      if (!mergeMode) {
        await db.impactAlerts.add({ ...alert, projectId: targetProjectId });
      } else {
        const newId = generateId();
        await db.impactAlerts.add({
          ...alert, id: newId, projectId: targetProjectId,
          sourceId: idMap.get(alert.sourceId) ?? alert.sourceId,
          targetId: idMap.get(alert.targetId) ?? alert.targetId,
        });
      }
    }
  },

  /**
   * 同步数据到本地服务器（供 WorkBuddy 读取后上传腾讯文档）
   */
  async syncToServer(projectId: string, projectName: string, projectDescription: string = ''): Promise<void> {
    const exportData = await this.exportProject(projectId, projectName, projectDescription, {
      format: 'json',
      includeModules: {
        outline: true,
        chapter: true,
        plotline: true,
        character: true,
        relation: true,
        setting: true,
        faction: true,
      },
    });

    const response = await fetch('http://localhost:5173/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: exportData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || '同步失败');
    }
  },

  /**
   * 读取导入文件
   */
  readImportFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  },
};

/** 获取大纲节点的层级深度 */
function getOutlineDepth(nodes: OutlineNode[], nodeId: string): number {
  let depth = 0;
  let current = nodes.find((n) => n.id === nodeId);
  while (current?.parentId) {
    depth++;
    current = nodes.find((n) => n.id === current!.parentId);
    if (depth > 20) break; // 防止死循环
  }
  return depth;
}

/** 清空指定项目的数据 */
async function clearProjectData(projectId: string): Promise<void> {
  await db.outlineNodes.where('projectId').equals(projectId).delete();
  await db.plotlines.where('projectId').equals(projectId).delete();
  await db.plotlineNodes.where('projectId').equals(projectId).delete();
  await db.characters.where('projectId').equals(projectId).delete();
  await db.relations.where('projectId').equals(projectId).delete();
  await db.settingCategories.where('projectId').equals(projectId).delete();
  await db.settingItems.where('projectId').equals(projectId).delete();
  await db.chapters.where('projectId').equals(projectId).delete();
  await db.factions.where('projectId').equals(projectId).delete();
  // Reference没有projectId，导入时直接清空
  await db.references.clear();
  await db.impactAlerts.where('projectId').equals(projectId).delete();
}

/** 简单语义版本比较：返回负数表示 v1 < v2，0 表示相等，正数表示 v1 > v2 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const a = parts1[i] || 0;
    const b = parts2[i] || 0;
    if (a !== b) return a - b;
  }
  return 0;
}
