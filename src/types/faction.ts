/** 家族/组织 */
export interface Faction {
  id: string;
  projectId: string;
  name: string;
  description: string;
  factionType: FactionType;
  parentId: string;       // 上级组织ID（支持层级）
  leaderId: string;       // 首领角色ID
  color: string;          // 标识颜色
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/** 组织类型 */
export enum FactionType {
  FAMILY = 'FAMILY',       // 家族
  SECT = 'SECT',           // 门派/宗门
  ORGANIZATION = 'ORG',    // 组织/势力
  KINGDOM = 'KINGDOM',     // 国家/王国
  TRIBE = 'TRIBE',         // 部落
  GUILD = 'GUILD',         // 公会/商会
}

export const FACTION_TYPE_LABELS: Record<FactionType, string> = {
  [FactionType.FAMILY]: '家族',
  [FactionType.SECT]: '门派',
  [FactionType.ORGANIZATION]: '组织',
  [FactionType.KINGDOM]: '国家',
  [FactionType.TRIBE]: '部落',
  [FactionType.GUILD]: '公会',
};

export const FACTION_TYPE_ICONS: Record<FactionType, string> = {
  [FactionType.FAMILY]: '👨‍👩‍👧‍👦',
  [FactionType.SECT]: '⛩️',
  [FactionType.ORGANIZATION]: '🏢',
  [FactionType.KINGDOM]: '🏰',
  [FactionType.TRIBE]: '🏕️',
  [FactionType.GUILD]: '⚒️',
};

/** 创建组织参数 */
export interface CreateFactionParams {
  name: string;
  description?: string;
  factionType?: FactionType;
  parentId?: string;
  leaderId?: string;
  color?: string;
  tags?: string[];
}

/** 更新组织参数 */
export interface UpdateFactionParams {
  name?: string;
  description?: string;
  factionType?: FactionType;
  parentId?: string;
  leaderId?: string;
  color?: string;
  tags?: string[];
}
