import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Individual, IndividualDocument, IndividualStatus } from '@/lib/types/individual';

interface IndividualState {
  // データ
  individuals: Individual[];

  // CRUD操作
  addIndividual: (individual: Omit<Individual, 'id'>) => Individual;
  addIndividuals: (individuals: Omit<Individual, 'id'>[]) => Individual[];
  updateIndividual: (id: number, updates: Partial<Individual>) => void;
  deleteIndividual: (id: number) => void;
  getIndividualById: (id: number) => Individual | undefined;
  getIndividualByQrCode: (qrCode: string) => Individual | undefined;

  // 検索・フィルター
  getIndividualsByApplicationNo: (applicationNo: string) => Individual[];
  getIndividualsByStatus: (status: IndividualStatus) => Individual[];
  searchIndividuals: (query: string) => Individual[];

  // 廃棄処理
  disposeIndividual: (id: number, disposalApplicationNo: string, disposalDocuments?: IndividualDocument[]) => void;

  // ドキュメント操作
  addDocument: (id: number, document: IndividualDocument) => void;
  removeDocument: (id: number, filename: string) => void;

  // ID生成
  generateId: () => number;
  generateQrCode: () => string;
}

export const useIndividualStore = create<IndividualState>()(
  persist(
    (set, get) => ({
      individuals: [],

      // CRUD操作
      addIndividual: (individual) => {
        const id = get().generateId();
        const newIndividual: Individual = { ...individual, id };
        set((state) => ({
          individuals: [...state.individuals, newIndividual],
        }));
        return newIndividual;
      },

      addIndividuals: (individuals) => {
        const newIndividuals = individuals.map((individual) => {
          const id = get().generateId();
          return { ...individual, id } as Individual;
        });
        set((state) => ({
          individuals: [...state.individuals, ...newIndividuals],
        }));
        return newIndividuals;
      },

      updateIndividual: (id, updates) =>
        set((state) => ({
          individuals: state.individuals.map((ind) =>
            ind.id === id ? { ...ind, ...updates } : ind
          ),
        })),

      deleteIndividual: (id) =>
        set((state) => ({
          individuals: state.individuals.filter((ind) => ind.id !== id),
        })),

      getIndividualById: (id) => get().individuals.find((ind) => ind.id === id),

      getIndividualByQrCode: (qrCode) =>
        get().individuals.find((ind) => ind.qrCode === qrCode),

      // 検索・フィルター
      getIndividualsByApplicationNo: (applicationNo) =>
        get().individuals.filter((ind) => ind.applicationNo === applicationNo),

      getIndividualsByStatus: (status) =>
        get().individuals.filter((ind) => ind.status === status),

      searchIndividuals: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().individuals.filter(
          (ind) =>
            ind.assetName.toLowerCase().includes(lowerQuery) ||
            ind.qrCode.toLowerCase().includes(lowerQuery) ||
            ind.applicationNo.toLowerCase().includes(lowerQuery) ||
            ind.model?.toLowerCase().includes(lowerQuery) ||
            ind.serialNumber?.toLowerCase().includes(lowerQuery)
        );
      },

      // 廃棄処理
      disposeIndividual: (id, disposalApplicationNo, disposalDocuments) => {
        set((state) => ({
          individuals: state.individuals.map((ind) =>
            ind.id === id
              ? {
                  ...ind,
                  status: '廃棄済' as IndividualStatus,
                  disposalDate: new Date().toISOString().split('T')[0],
                  disposalApplicationNo,
                  disposalDocuments,
                }
              : ind
          ),
        }));
      },

      // ドキュメント操作
      addDocument: (id, document) =>
        set((state) => ({
          individuals: state.individuals.map((ind) =>
            ind.id === id
              ? { ...ind, documents: [...(ind.documents || []), document] }
              : ind
          ),
        })),

      removeDocument: (id, filename) =>
        set((state) => ({
          individuals: state.individuals.map((ind) =>
            ind.id === id
              ? {
                  ...ind,
                  documents: (ind.documents || []).filter(
                    (doc) => doc.filename !== filename
                  ),
                }
              : ind
          ),
        })),

      // ID生成
      generateId: () => {
        const individuals = get().individuals;
        const maxId = individuals.reduce((max, ind) => Math.max(max, ind.id), 0);
        return maxId + 1;
      },

      generateQrCode: () => {
        const now = new Date();
        const year = now.getFullYear();
        const individuals = get().individuals;
        const yearIndividuals = individuals.filter((ind) =>
          ind.qrCode.startsWith(`QR-${year}-`)
        );
        const maxSeq = yearIndividuals.reduce((max, ind) => {
          const seq = parseInt(ind.qrCode.split('-')[2], 10);
          return isNaN(seq) ? max : Math.max(max, seq);
        }, 0);
        return `QR-${year}-${String(maxSeq + 1).padStart(4, '0')}`;
      },
    }),
    {
      name: 'individual-storage',
    }
  )
);
