/**
 * 项目管理服务
 * 支持多本小说的创建、切换、删除
 */
import { db } from '../db';
import { generateId } from '../utils/id';
import type { ProjectConfig } from '../types/ai';

export const projectService = {
  /** 获取所有项目 */
  async getAll(): Promise<ProjectConfig[]> {
    return db.projectConfigs.toArray();
  },

  /** 获取单个项目 */
  async get(id: string): Promise<ProjectConfig | undefined> {
    return db.projectConfigs.get(id);
  },

  /** 创建新项目 */
  async create(name: string, description: string = '', genre: string = ''): Promise<ProjectConfig> {
    const now = Date.now();
    const project: ProjectConfig & { genre?: string } = {
      id: generateId(),
      name,
      description,
      genre,
      createdAt: now,
      updatedAt: now,
    };
    await db.projectConfigs.add(project);
    return project;
  },

  /** 更新项目 */
  async update(id: string, data: Partial<ProjectConfig>): Promise<void> {
    await db.projectConfigs.update(id, { ...data, updatedAt: Date.now() });
  },

  /** 删除项目（含所有关联数据） */
  async deleteProject(id: string): Promise<void> {
    // 删除所有关联数据
    await db.outlineNodes.where('projectId').equals(id).delete();
    await db.plotlines.where('projectId').equals(id).delete();
    await db.plotlineNodes.where('projectId').equals(id).delete();
    await db.characters.where('projectId').equals(id).delete();
    await db.relations.where('projectId').equals(id).delete();
    await db.settingCategories.where('projectId').equals(id).delete();
    await db.settingItems.where('projectId').equals(id).delete();
    await db.impactAlerts.where('projectId').equals(id).delete();
    await db.aiConfigs.where('projectId').equals(id).delete();
    // 最后删除项目本身
    await db.projectConfigs.delete(id);
  },
};
