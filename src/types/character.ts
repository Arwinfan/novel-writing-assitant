/** 人物 */
export interface Character {
  id: string;
  projectId: string;
  name: string;
  alias: string;
  appearance: string;
  personality: string;
  background: string;
  faction: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/** 创建人物参数 */
export interface CreateCharacterParams {
  name: string;
  alias?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  faction?: string;
  tags?: string[];
}

/** 更新人物参数 */
export interface UpdateCharacterParams {
  name?: string;
  alias?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  faction?: string;
  tags?: string[];
}
