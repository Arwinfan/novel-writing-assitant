import { nanoid } from 'nanoid';

/** 生成唯一 ID（21位字符串） */
export function generateId(): string {
  return nanoid(21);
}
