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
