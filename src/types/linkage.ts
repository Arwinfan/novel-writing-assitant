/** 引用来源/目标类型 */
export enum ReferenceEntityType {
  OUTLINE_NODE = 'OUTLINE_NODE',
  PLOTLINE_NODE = 'PLOTLINE_NODE',
  CHARACTER = 'CHARACTER',
  SETTING_ITEM = 'SETTING_ITEM',
}

/** 影响动作类型 */
export enum ImpactAction {
  RENAME = 'RENAME',
  MODIFY = 'MODIFY',
  DELETE = 'DELETE',
}

/** 影响级别 */
export enum ImpactLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

/** 引用关系 */
export interface Reference {
  id: string;
  sourceType: ReferenceEntityType;
  sourceId: string;
  targetType: ReferenceEntityType;
  targetId: string;
  fieldName: string;
  matchText: string;
  createdAt: number;
}

/** 影响提醒 */
export interface ImpactAlert {
  id: string;
  projectId: string;
  sourceType: ReferenceEntityType;
  sourceId: string;
  sourceAction: ImpactAction;
  targetType: ReferenceEntityType;
  targetId: string;
  targetFieldName: string;
  description: string;
  level: ImpactLevel;
  dismissed: boolean;
  createdAt: number;
}

/** 创建引用参数 */
export interface CreateReferenceParams {
  sourceType: ReferenceEntityType;
  sourceId: string;
  targetType: ReferenceEntityType;
  targetId: string;
  fieldName: string;
  matchText: string;
}

/** 创建影响提醒参数 */
export interface CreateImpactAlertParams {
  sourceType: ReferenceEntityType;
  sourceId: string;
  sourceAction: ImpactAction;
  targetType: ReferenceEntityType;
  targetId: string;
  targetFieldName: string;
  description: string;
  level?: ImpactLevel;
}
