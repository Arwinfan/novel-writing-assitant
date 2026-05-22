/**
 * 全局应用状态管理
 * 支持多本小说项目管理
 */
import { create } from 'zustand';
import type { ProjectConfig } from '../types/ai';
import { projectService } from '../services/projectService';
import { DEFAULT_PROJECT_ID } from '../utils/constants';

interface AppState {
  projects: ProjectConfig[];
  project: ProjectConfig | null;
  currentPage: string;
  searchQuery: string;
  searchOpen: boolean;
  initialized: boolean;
  importDialogOpen: boolean;
  projectDialogOpen: boolean;

  initialize: () => Promise<void>;
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string, genre?: string) => Promise<ProjectConfig>;
  switchProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateProjectName: (name: string) => Promise<void>;
  setCurrentPage: (page: string) => void;
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;
  setImportDialogOpen: (open: boolean) => void;
  setProjectDialogOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  project: null,
  currentPage: 'outline',
  searchQuery: '',
  searchOpen: false,
  initialized: false,
  importDialogOpen: false,
  projectDialogOpen: false,

  initialize: async () => {
    const projects = await projectService.getAll();
    let current = projects[0];

    if (!current) {
      // 没有项目时创建默认项目
      current = await projectService.create('我的小说', '', '');
      set({ projects: [current], project: current, initialized: true });
    } else {
      // 读取上次选中的项目（从 localStorage）
      const lastProjectId = localStorage.getItem('lastProjectId');
      if (lastProjectId) {
        const found = projects.find((p) => p.id === lastProjectId);
        if (found) current = found;
      }
      set({ projects, project: current, initialized: true });
    }
  },

  loadProjects: async () => {
    const projects = await projectService.getAll();
    set({ projects });
  },

  createProject: async (name, description = '', genre = '') => {
    const project = await projectService.create(name, description, genre);
    set((state) => ({
      projects: [...state.projects, project],
      project,
    }));
    localStorage.setItem('lastProjectId', project.id);
    return project;
  },

  switchProject: async (id) => {
    const project = await projectService.get(id);
    if (project) {
      set({ project });
      localStorage.setItem('lastProjectId', id);
    }
  },

  deleteProject: async (id) => {
    await projectService.deleteProject(id);
    const projects = await projectService.getAll();
    const current = get().project;
    if (current?.id === id) {
      // 切换到第一个剩余项目
      const next = projects[0] ?? await projectService.create('我的小说', '', '');
      set({ projects, project: next });
      localStorage.setItem('lastProjectId', next.id);
    } else {
      set({ projects });
    }
  },

  updateProjectName: async (name) => {
    const project = get().project;
    if (project) {
      await projectService.update(project.id, { name });
      set((state) => ({
        project: { ...state.project!, name, updatedAt: Date.now() },
        projects: state.projects.map((p) =>
          p.id === project.id ? { ...p, name, updatedAt: Date.now() } : p,
        ),
      }));
    }
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSearchOpen: (open) => {
    set({ searchOpen: open });
  },

  setImportDialogOpen: (open) => {
    set({ importDialogOpen: open });
  },

  setProjectDialogOpen: (open) => {
    set({ projectDialogOpen: open });
  },
}));
