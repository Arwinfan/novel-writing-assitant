/**
 * 联动提醒状态管理
 */
import { create } from 'zustand';
import type { ImpactAlert } from '../types/linkage';
import { impactAlertService } from '../services/dbService';
import { useAppStore } from './appStore';

function currentProjectId(): string {
  return useAppStore.getState().project?.id ?? 'default-project';
}

interface LinkageState {
  alerts: ImpactAlert[];
  panelOpen: boolean;
  loading: boolean;

  loadAlerts: () => Promise<void>;
  addAlert: (alert: ImpactAlert) => void;
  dismissAlert: (id: string) => Promise<void>;
  dismissAll: () => Promise<void>;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  getUndismissedCount: () => number;
}

export const useLinkageStore = create<LinkageState>((set, get) => ({
  alerts: [],
  panelOpen: false,
  loading: false,

  loadAlerts: async () => {
    set({ loading: true });
    try {
      const alerts = await impactAlertService.getActive(currentProjectId());
      set({ alerts, loading: false });
    } catch (error) {
      console.error('Failed to load alerts:', error);
      set({ loading: false });
    }
  },

  addAlert: (alert) => {
    set((state) => ({ alerts: [...state.alerts, alert] }));
  },

  dismissAlert: async (id) => {
    await impactAlertService.dismiss(id);
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a)),
    }));
  },

  dismissAll: async () => {
    await impactAlertService.dismissAll(currentProjectId());
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, dismissed: true })),
    }));
  },

  togglePanel: () => {
    set((state) => ({ panelOpen: !state.panelOpen }));
  },

  setPanelOpen: (open) => {
    set({ panelOpen: open });
  },

  getUndismissedCount: () => {
    return get().alerts.filter((a) => !a.dismissed).length;
  },
}));
