import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * リモデルプロジェクトの型定義
 */
export interface RemodelProject {
  id: string;
  hospitalId: string;
  hospitalName: string;
  projectName: string;
  status: RemodelProjectStatus;
  // 原本リスト（リモデル対象の資産）
  originalAssets: RemodelOriginalAsset[];
  // 執行済み資産（完了した資産のスナップショット）
  executedAssets: ExecutedAsset[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export type RemodelProjectStatus =
  | 'preparing'    // 準備中（原本リスト作成中）
  | 'in_progress'  // 進行中（申請受付・執行中）
  | 'closed';      // クローズ（全申請執行完了）

/**
 * リモデル原本リストの資産
 */
export interface RemodelOriginalAsset {
  id: string;
  assetName: string;
  model: string;
  vendor: string;
  serialNumber?: string;
  // 現在の設置場所
  currentFloor: string;
  currentDepartment: string;
  currentRoom: string;
  // 申請状況
  applicationId?: number;
  applicationNo?: string;
  applicationType?: string;
  applicationStatus: 'pending' | 'applied' | 'executed';
}

/**
 * 執行済み資産（履歴用）
 */
export interface ExecutedAsset {
  id: string;
  originalAssetId: string;
  assetName: string;
  model: string;
  vendor: string;
  serialNumber?: string;
  qrCode?: string;
  applicationType: string;
  applicationNo: string;
  // 執行後の設置場所
  newFloor: string;
  newDepartment: string;
  newRoom: string;
  executedAt: string;
  executedBy?: string;
}

interface RemodelProjectState {
  projects: RemodelProject[];

  // プロジェクト操作
  addProject: (project: Omit<RemodelProject, 'id' | 'createdAt' | 'updatedAt'>) => RemodelProject;
  updateProject: (id: string, updates: Partial<RemodelProject>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => RemodelProject | undefined;
  getProjectByHospitalId: (hospitalId: string) => RemodelProject | undefined;

  // 原本リスト操作
  addOriginalAsset: (projectId: string, asset: Omit<RemodelOriginalAsset, 'id' | 'applicationStatus'>) => void;
  addOriginalAssets: (projectId: string, assets: Omit<RemodelOriginalAsset, 'id' | 'applicationStatus'>[]) => void;
  updateOriginalAsset: (projectId: string, assetId: string, updates: Partial<RemodelOriginalAsset>) => void;
  removeOriginalAsset: (projectId: string, assetId: string) => void;

  // 申請紐付け
  linkApplicationToAsset: (projectId: string, assetId: string, applicationId: number, applicationNo: string, applicationType: string) => void;

  // 執行処理
  executeAsset: (projectId: string, assetId: string, executedAsset: Omit<ExecutedAsset, 'id' | 'executedAt'>) => void;

  // 執行状況確認
  getExecutionProgress: (projectId: string) => { total: number; executed: number; pending: number; applied: number };
  canCloseProject: (projectId: string) => boolean;

  // クローズ処理
  closeProject: (projectId: string) => void;

  // ID生成
  generateProjectId: () => string;
  generateAssetId: () => string;
}

export const useRemodelProjectStore = create<RemodelProjectState>()(
  persist(
    (set, get) => ({
      projects: [],

      // プロジェクト操作
      addProject: (project) => {
        const id = get().generateProjectId();
        const now = new Date().toISOString();
        const newProject: RemodelProject = {
          ...project,
          id,
          originalAssets: project.originalAssets || [],
          executedAssets: project.executedAssets || [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          projects: [...state.projects, newProject],
        }));
        return newProject;
      },

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),

      getProjectById: (id) => get().projects.find((p) => p.id === id),

      getProjectByHospitalId: (hospitalId) =>
        get().projects.find((p) => p.hospitalId === hospitalId && p.status !== 'closed'),

      // 原本リスト操作
      addOriginalAsset: (projectId, asset) => {
        const assetId = get().generateAssetId();
        const newAsset: RemodelOriginalAsset = {
          ...asset,
          id: assetId,
          applicationStatus: 'pending',
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, originalAssets: [...p.originalAssets, newAsset], updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      addOriginalAssets: (projectId, assets) => {
        const newAssets: RemodelOriginalAsset[] = assets.map((asset) => ({
          ...asset,
          id: get().generateAssetId(),
          applicationStatus: 'pending' as const,
        }));
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, originalAssets: [...p.originalAssets, ...newAssets], updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      updateOriginalAsset: (projectId, assetId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  originalAssets: p.originalAssets.map((a) =>
                    a.id === assetId ? { ...a, ...updates } : a
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      removeOriginalAsset: (projectId, assetId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  originalAssets: p.originalAssets.filter((a) => a.id !== assetId),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      // 申請紐付け
      linkApplicationToAsset: (projectId, assetId, applicationId, applicationNo, applicationType) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  originalAssets: p.originalAssets.map((a) =>
                    a.id === assetId
                      ? { ...a, applicationId, applicationNo, applicationType, applicationStatus: 'applied' as const }
                      : a
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      // 執行処理
      executeAsset: (projectId, assetId, executedAsset) => {
        const executedId = get().generateAssetId();
        const now = new Date().toISOString();
        const newExecuted: ExecutedAsset = {
          ...executedAsset,
          id: executedId,
          originalAssetId: assetId,
          executedAt: now,
        };

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  originalAssets: p.originalAssets.map((a) =>
                    a.id === assetId ? { ...a, applicationStatus: 'executed' as const } : a
                  ),
                  executedAssets: [...p.executedAssets, newExecuted],
                  updatedAt: now,
                }
              : p
          ),
        }));
      },

      // 執行状況確認
      getExecutionProgress: (projectId) => {
        const project = get().getProjectById(projectId);
        if (!project) return { total: 0, executed: 0, pending: 0, applied: 0 };

        const total = project.originalAssets.length;
        const executed = project.originalAssets.filter((a) => a.applicationStatus === 'executed').length;
        const applied = project.originalAssets.filter((a) => a.applicationStatus === 'applied').length;
        const pending = project.originalAssets.filter((a) => a.applicationStatus === 'pending').length;

        return { total, executed, pending, applied };
      },

      canCloseProject: (projectId) => {
        const progress = get().getExecutionProgress(projectId);
        return progress.total > 0 && progress.total === progress.executed;
      },

      // クローズ処理
      closeProject: (projectId) => {
        const now = new Date().toISOString();
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, status: 'closed' as const, closedAt: now, updatedAt: now }
              : p
          ),
        }));
      },

      // ID生成
      generateProjectId: () => {
        const projects = get().projects;
        const maxId = projects.reduce((max, p) => {
          const num = parseInt(p.id.replace('RP', ''), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return `RP${String(maxId + 1).padStart(5, '0')}`;
      },

      generateAssetId: () => {
        return `RA${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      },
    }),
    {
      name: 'remodel-project-storage',
    }
  )
);
