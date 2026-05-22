/**
 * 文本工具函数单元测试
 * 测试 replaceWithWordBoundary, scanForNames, escapeRegExp, truncateText, highlightKeyword
 */
import { describe, it, expect } from 'vitest';
import {
  replaceWithWordBoundary,
  scanForNames,
  escapeRegExp,
  truncateText,
  highlightKeyword,
} from '../../utils/text';

describe('escapeRegExp', () => {
  it('应转义正则特殊字符', () => {
    expect(escapeRegExp('hello.world')).toBe('hello\\.world');
    expect(escapeRegExp('a+b*c?')).toBe('a\\+b\\*c\\?');
    expect(escapeRegExp('a(b)c[d]')).toBe('a\\(b\\)c\\[d\\]');
    expect(escapeRegExp('$100')).toBe('\\$100');
  });

  it('普通文本应保持不变', () => {
    expect(escapeRegExp('张三')).toBe('张三');
    expect(escapeRegExp('abc123')).toBe('abc123');
  });
});

describe('replaceWithWordBoundary', () => {
  it('应替换中文完整匹配', () => {
    expect(replaceWithWordBoundary('张三去了北京', '张三', '李四')).toBe('李四去了北京');
  });

  it('中文多次出现应全部替换', () => {
    expect(replaceWithWordBoundary('张三去了北京，张三很开心', '张三', '李四')).toBe('李四去了北京，李四很开心');
  });

  it('应替换所有英文单词出现', () => {
    expect(replaceWithWordBoundary('Alice met Alice', 'Alice', 'Bob')).toBe('Bob met Bob');
  });

  it('空文本应返回原值', () => {
    expect(replaceWithWordBoundary('hello', '', 'world')).toBe('hello');
    expect(replaceWithWordBoundary('', 'old', 'new')).toBe('');
  });

  it('英文名称替换应正确处理词边界', () => {
    expect(replaceWithWordBoundary('The hero fights', 'hero', 'villain')).toBe('The villain fights');
    // "heroes" contains "hero" but should NOT be replaced
    expect(replaceWithWordBoundary('The heroes fight', 'hero', 'villain')).toBe('The heroes fight');
  });

  it('中文替换已知局限：张三在张三丰中也会被替换', () => {
    // 这是中文无空格分隔的已知局限
    expect(replaceWithWordBoundary('张三丰来了', '张三', '李四')).toBe('李四丰来了');
  });

  it('中文与英文混合应正确替换', () => {
    expect(replaceWithWordBoundary('张三 said hello', '张三', '李四')).toBe('李四 said hello');
  });
});

describe('scanForNames', () => {
  it('应扫描文本中出现的中文和英文名称', () => {
    const text = '张三和李四一起出发了，张三拿着剑';
    const names = ['张三', '李四'];
    const results = scanForNames(text, names);
    expect(results.length).toBeGreaterThanOrEqual(3);
    const zhangSanResults = results.filter((r) => r.name === '张三');
    expect(zhangSanResults.length).toBe(2);
    const liSiResults = results.filter((r) => r.name === '李四');
    expect(liSiResults.length).toBe(1);
  });

  it('应扫描英文名称（词边界）', () => {
    const text = 'Alice and Bob went to the heroes hall';
    const names = ['Alice', 'Bob', 'hero'];
    const results = scanForNames(text, names);
    const aliceResults = results.filter((r) => r.name === 'Alice');
    const bobResults = results.filter((r) => r.name === 'Bob');
    const heroResults = results.filter((r) => r.name === 'hero');
    expect(aliceResults.length).toBe(1);
    expect(bobResults.length).toBe(1);
    expect(heroResults.length).toBe(0); // "hero" in "heroes" should NOT match
  });

  it('空名称列表应返回空结果', () => {
    const results = scanForNames('some text', []);
    expect(results).toEqual([]);
  });

  it('空文本应返回空结果', () => {
    const results = scanForNames('', ['张三']);
    expect(results).toEqual([]);
  });

  it('应返回正确的匹配位置', () => {
    const text = 'Alice went home';
    const results = scanForNames(text, ['Alice']);
    expect(results.length).toBe(1);
    expect(results[0].index).toBe(0);
    expect(results[0].name).toBe('Alice');
  });

  it('中文扫描已知局限：部分匹配也会被检测', () => {
    const text = '张三丰来了';
    const names = ['张三'];
    const results = scanForNames(text, names);
    expect(results.length).toBe(1); // 会匹配，因为中文无空格分隔
  });
});

describe('truncateText', () => {
  it('短文本不应截断', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('长文本应截断到指定长度', () => {
    const long = 'a'.repeat(200);
    const result = truncateText(long, 100);
    expect(result.length).toBe(103); // 100 + '...' = 103
    expect(result.endsWith('...')).toBe(true);
  });

  it('空文本应返回原值', () => {
    expect(truncateText('', 10)).toBe('');
  });

  it('自定义后缀', () => {
    const long = 'a'.repeat(200);
    const result = truncateText(long, 100, '…');
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('highlightKeyword', () => {
  it('应高亮关键词', () => {
    const result = highlightKeyword('张三是主角', '张三');
    expect(result).toContain('<mark>张三</mark>');
  });

  it('空关键词应返回原值', () => {
    expect(highlightKeyword('hello', '')).toBe('hello');
  });

  it('空文本应返回原值', () => {
    expect(highlightKeyword('', 'test')).toBe('');
  });
});
