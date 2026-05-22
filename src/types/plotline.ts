/** 剧情线类型 */
export enum PlotlineType {
  MAIN = 'MAIN',
  SUB = 'SUB',
}

/** 剧情线 */
export interface Plotline {
  id: string;
  projectId: string;
  lineType: PlotlineType;
  name: string;
  description: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

/** 剧情节点 */
export interface PlotlineNode {
  id: string;
  plotlineId: string;
  projectId: string;
  sortOrder: number;
  title: string;
  content: string;
  outlineNodeRefs: string[];
  characterRefs: string[];
  settingRefs: string[];
  createdAt: number;
  updatedAt: number;
}

/** 创建剧情线参数 */
export interface CreatePlotlineParams {
  lineType: PlotlineType;
  name: string;
  description?: string;
  color?: string;
}

/** 更新剧情线参数 */
export interface UpdatePlotlineParams {
  lineType?: PlotlineType;
  name?: string;
  description?: string;
  color?: string;
}

/** 创建剧情节点参数 */
export interface CreatePlotlineNodeParams {
  plotlineId: string;
  title: string;
  content?: string;
  sortOrder?: number;
  outlineNodeRefs?: string[];
  characterRefs?: string[];
  settingRefs?: string[];
}

/** 更新剧情节点参数 */
export interface UpdatePlotlineNodeParams {
  title?: string;
  content?: string;
  sortOrder?: number;
  outlineNodeRefs?: string[];
  characterRefs?: string[];
  settingRefs?: string[];
}
