/**
 * ID 生成工具测试
 */
import { describe, it, expect } from 'vitest';
import { generateId } from '../../utils/id';

describe('generateId', () => {
  it('应生成21位字符串', () => {
    const id = generateId();
    expect(id.length).toBe(21);
  });

  it('应生成唯一ID', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('不应为空字符串', () => {
    const id = generateId();
    expect(id).toBeTruthy();
  });
});
