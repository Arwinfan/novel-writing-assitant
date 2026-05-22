/**
 * 剧情线状态管理
 */
import { create } from 'zustand';
import type { Plotline, PlotlineNode, CreatePlotlineParams, UpdatePlotlineParams, CreatePlotlineNodeParams, UpdatePlotlineNodeParams } from '../types/plotline';
import { plotlineService, plotlineNodeService } from '../services/dbService';
import { referenceTracker } from '../services/referenceTracker';
import { linkageEngine } from '../services/linkageEngine';
import { ReferenceEntityType } from '../types/linkage';
import { useAppStore } from './appStore';

function currentProjectId(): string {
  return useAppStore.getState().project?.id ?? 'default-project';
}

interface PlotlineState {
  plotlines: Plotline[];
  plotlineNodes: PlotlineNode[];
  selectedPlotlineId: string | null;
  selectedNodeId: string | null;
  loading: boolean;

  loadPlotlines: () => Promise<void>;
  createPlotline: (params: CreatePlotlineParams) => Promise<Plotline>;
  updatePlotline: (id: string, params: UpdatePlotlineParams) => Promise<void>;
  deletePlotline: (id: string) => Promise<void>;
  selectPlotline: (id: string | null) => void;

  loadPlotlineNodes: (plotlineId: string) => Promise<void>;
  createPlotlineNode: (params: CreatePlotlineNodeParams) => Promise<PlotlineNode>;
  updatePlotlineNode: (id: string, params: UpdatePlotlineNodeParams) => Promise<void>;
  deletePlotlineNode: (id: string) => Promise<void>;
  selectNode: (id: string | null) => void;
}

export const usePlotlineStore = create<PlotlineState>((set, get) => ({
  plotlines: [],
  plotlineNodes: [],
  selectedPlotlineId: null,
  selectedNodeId: null,
  loading: false,

  loadPlotlines: async () => {
    set({ loading: true });
    try {
      const pid = currentProjectId();
      const plotlines = await plotlineService.getAll(pid);
      const allNodes = await plotlineNodeService.getAll(pid);
      set({ plotlines, plotlineNodes: allNodes, loading: false });
    } catch (error) {
      console.error('Failed to load plotlines:', error);
      set({ loading: false });
    }
  },

  createPlotline: async (params) => {
    const plotline = await plotlineService.create(params, currentProjectId());
    set((state) => ({ plotlines: [...state.plotlines, plotline] }));
    return plotline;
  },

  updatePlotline: async (id, params) => {
    await plotlineService.update(id, params);
    set((state) => ({
      plotlines: state.plotlines.map((p) => (p.id === id ? { ...p, ...params, updatedAt: Date.now() } : p)),
    }));
  },

  deletePlotline: async (id) => {
    await plotlineService.delete(id);
    set((state) => ({
      plotlines: state.plotlines.filter((p) => p.id !== id),
      plotlineNodes: state.plotlineNodes.filter((n) => n.plotlineId !== id),
      selectedPlotlineId: state.selectedPlotlineId === id ? null : state.selectedPlotlineId,
    }));
  },

  selectPlotline: (id) => {
    set({ selectedPlotlineId: id });
  },

  loadPlotlineNodes: async (plotlineId) => {
    const nodes = await plotlineNodeService.getByPlotlineId(plotlineId);
    set((state) => ({
      plotlineNodes: [...state.plotlineNodes.filter((n) => n.plotlineId !== plotlineId), ...nodes],
    }));
  },

  createPlotlineNode: async (params) => {
    const node = await plotlineNodeService.create(params, currentProjectId());
    await referenceTracker.scanAndIndexPlotlineNode(node.id);
    set((state) => ({ plotlineNodes: [...state.plotlineNodes, node] }));
    return node;
  },

  updatePlotlineNode: async (id, params) => {
    await plotlineNodeService.update(id, params);
    set((state) => ({
      plotlineNodes: state.plotlineNodes.map((n) => (n.id === id ? { ...n, ...params, updatedAt: Date.now() } : n)),
    }));
    await referenceTracker.scanAndIndexPlotlineNode(id);
  },

  deletePlotlineNode: async (id) => {
    const node = get().plotlineNodes.find((n) => n.id === id);
    if (node) {
      await linkageEngine.onEntityDelete(ReferenceEntityType.PLOTLINE_NODE, id, node.title);
      await plotlineNodeService.delete(id);
      set((state) => ({
        plotlineNodes: state.plotlineNodes.filter((n) => n.id !== id),
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      }));
    }
  },

  selectNode: (id) => {
    set({ selectedNodeId: id });
  },
}));
