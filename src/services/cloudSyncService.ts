/**
 * 云端同步 API 客户端
 */
const BASE = '';

export interface CloudSyncStatus {
  configured: boolean;
  hasCredentials: boolean;
}

export interface CloudSyncResult {
  success: boolean;
  message: string;
  indexId?: string;
  fileCount?: number;
  error?: string;
}

export interface CloudFileList {
  success: boolean;
  index?: {
    projectId: string;
    projectName: string;
    lastSync: string;
    summary: Record<string, number>;
  };
  fileCount: number;
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: string;
  }>;
}

export const cloudSyncApi = {
  /** 检查云端配置状态 */
  async checkStatus(): Promise<CloudSyncStatus> {
    const res = await fetch(`${BASE}/api/drive/status`);
    return res.json();
  },

  /** 同步项目数据到云端 */
  async syncToCloud(projectId: string, projectName: string, data: any): Promise<CloudSyncResult> {
    const res = await fetch(`${BASE}/api/drive/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, projectName, data }),
    });
    return res.json();
  },

  /** 列出云端文件 */
  async listFiles(): Promise<CloudFileList> {
    const res = await fetch(`${BASE}/api/drive/list`);
    return res.json();
  },

  /** 从云端拉取项目数据 */
  async pullFromCloud(): Promise<{
    success: boolean;
    error?: string;
    lastModified?: string;
    projectName?: string;
    summary?: Record<string, number>;
    config?: any;
    bodyText?: string;
  }> {
    const res = await fetch(`${BASE}/api/drive/pull`);
    return res.json();
  },

  /** 本地导出（使用现有 /api/export） */
  async exportLocal(data: any): Promise<{ success: boolean; file: string }> {
    const res = await fetch(`${BASE}/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
