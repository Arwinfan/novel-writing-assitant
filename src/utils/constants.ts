/** 默认项目 ID */
export const DEFAULT_PROJECT_ID = 'default-project';

/** 侧边栏导航项 */
export const NAV_ITEMS = [
  { key: 'outline', label: '大纲', icon: 'AccountTree' },
  { key: 'chapter', label: '正文', icon: 'Description' },
  { key: 'plotline', label: '剧情线', icon: 'Timeline' },
  { key: 'character', label: '角色', icon: 'Person' },
  { key: 'relation', label: '关系', icon: 'DeviceHub' },
  { key: 'setting', label: '设定', icon: 'Settings' },
] as const;

/** 大纲节点类型标签 */
export const OUTLINE_NODE_TYPE_LABELS: Record<string, string> = {
  VOLUME: '卷',
  CHAPTER: '章',
  SECTION: '节',
};

/** 剧情线类型标签 */
export const PLOTLINE_TYPE_LABELS: Record<string, string> = {
  MAIN: '主线',
  SUB: '支线',
};

/** 默认剧情线颜色 */
export const DEFAULT_PLOTLINE_COLORS = [
  '#1976d2',
  '#2e7d32',
  '#ed6c02',
  '#9c27b0',
  '#d32f2f',
  '#00838f',
  '#f57c00',
  '#5d4037',
];

/** AI 默认配置 */
export const AI_DEFAULT_CONFIG = {
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2048,
};

/** 自动保存间隔（毫秒） */
export const AUTO_SAVE_INTERVAL = 3000;

/** AI 请求超时（毫秒） */
export const AI_REQUEST_TIMEOUT = 60000;

/** 侧边栏宽度 */
export const SIDEBAR_WIDTH = 240;

/** 顶部栏高度 */
export const TOPBAR_HEIGHT = 56;
