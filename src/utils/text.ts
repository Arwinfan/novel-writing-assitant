/**
 * 文本处理工具
 * 提供名称替换、文本扫描等功能
 */

/**
 * 判断字符串是否包含 CJK 字符
 */
function containsCJK(str: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff]/.test(str);
}

/**
 * 词边界精确替换
 * 对中文文本使用直接替换（\b对中文无效，中文无空格分隔）；
 * 对英文文本使用 \b 词边界匹配，避免误替换
 * @param text 原始文本
 * @param oldText 要替换的旧文本
 * @param newText 替换的新文本
 * @returns 替换后的文本
 */
export function replaceWithWordBoundary(
  text: string,
  oldText: string,
  newText: string,
): string {
  if (!oldText || !text) return text;
  const escaped = escapeRegExp(oldText);
  if (containsCJK(oldText)) {
    // 中文文本无空格分隔，\b 完全无效。
    // 直接全局替换即可；中文姓名通常2-4字，足够精确。
    const regex = new RegExp(escaped, 'g');
    return text.replace(regex, newText);
  } else {
    // 英文使用 \b 词边界，避免 "hero" 匹配 "heroes"
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    return text.replace(regex, newText);
  }
}

/**
 * 转义正则表达式特殊字符
 * @param str 原始字符串
 * @returns 转义后的字符串
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 扫描文本中出现的所有已知名称
 * @param text 要扫描的文本
 * @param names 已知名称列表
 * @returns 匹配到的名称及位置列表
 */
export function scanForNames(
  text: string,
  names: string[],
): Array<{ name: string; index: number }> {
  const results: Array<{ name: string; index: number }> = [];
  for (const name of names) {
    const escaped = escapeRegExp(name);
    if (containsCJK(name)) {
      // 中文文本无空格分隔，直接匹配即可
      const regex = new RegExp(escaped, 'g');
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        results.push({ name, index: match.index });
      }
    } else {
      // 英文使用 \b 词边界
      const regex = new RegExp(`\\b${escaped}\\b`, 'g');
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        results.push({ name, index: match.index });
      }
    }
  }
  return results;
}

/**
 * 截断文本到指定长度，保留完整字符
 * @param text 原始文本
 * @param maxLength 最大长度
 * @param suffix 截断后缀
 * @returns 截断后的文本
 */
export function truncateText(
  text: string,
  maxLength: number = 100,
  suffix: string = '...',
): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + suffix;
}

/**
 * 高亮文本中的关键词
 * @param text 原始文本
 * @param keyword 关键词
 * @returns 带 HTML mark 标签的高亮文本
 */
export function highlightKeyword(text: string, keyword: string): string {
  if (!keyword || !text) return text;
  const escaped = escapeRegExp(keyword);
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * 估算文本的 Token 数量
 * 基于语言特征粗略估算，用于费用预估
 *
 * 估算规则（参考 GPT tokenizer 行为）：
 * - 中文字符：约 1.2 tokens/字（含标点）
 * - 英文字符：约 0.3 tokens/字符（单词 + 空格）
 * - 数字和符号：约 0.5 tokens/字符
 *
 * @param text 要估算的文本
 * @returns 估算的 token 数量
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;

  let tokens = 0;
  for (const char of text) {
    if (/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(char)) {
      // CJK 字符：约 1.2 tokens
      tokens += 1.2;
    } else if (/[\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(char)) {
      // 日文/韩文：约 1.2 tokens
      tokens += 1.2;
    } else if (/[a-zA-Z]/.test(char)) {
      // 英文字母：约 0.25 tokens（4 字母 ≈ 1 token）
      tokens += 0.25;
    } else if (/[0-9]/.test(char)) {
      // 数字：约 0.5 tokens
      tokens += 0.5;
    } else if (/\s/.test(char)) {
      // 空格：基本免费
      tokens += 0;
    } else {
      // 其他符号
      tokens += 0.5;
    }
  }

  return Math.ceil(tokens);
}

/**
 * 统计中文文本字数（仅统计中文字符）
 * @param text 要统计的文本
 * @returns 中文字符数量
 */
export function countChineseChars(text: string): number {
  if (!text) return 0;
  const matches = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g);
  return matches ? matches.length : 0;
}

/**
 * 格式化以 Token 为基础的字符数显示
 * "1230字 / 约1600 tokens"
 */
export function formatTokenInfo(text: string): string {
  const chars = countChineseChars(text);
  const tokens = estimateTokenCount(text);
  return `${chars}字 / 约${tokens} tokens`;
}
