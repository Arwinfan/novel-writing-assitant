/** 角色 */
export interface Character {
  id: string;
  projectId: string;
  name: string;
  alias: string;
  appearance: string;
  personality: string;
  background: string;
  faction: string;
  factionId: string;     // 所属组织ID
  tags: string[];
  avatar: string;        // 角色图片（base64 data URL）
  createdAt: number;
  updatedAt: number;
}

/** 创建角色参数 */
export interface CreateCharacterParams {
  name: string;
  alias?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  faction?: string;
  factionId?: string;
  tags?: string[];
  avatar?: string;
}

/** 更新角色参数 */
export interface UpdateCharacterParams {
  name?: string;
  alias?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  faction?: string;
  factionId?: string;
  tags?: string[];
  avatar?: string;
}
