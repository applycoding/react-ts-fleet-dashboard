import { create } from 'zustand';
import type { DataMode, UnitKind, UnitStatus } from '../types';

interface UiState {
  dataMode: DataMode;
  linkNote: string;
  selectedId: string | null;
  search: string;
  kind: 'all' | UnitKind;
  status: 'all' | UnitStatus;
  acknowledged: Record<string, true>;
  setLink: (mode: DataMode, linkNote: string) => void;
  setSelectedId: (id: string | null) => void;
  setSearch: (search: string) => void;
  setKind: (kind: 'all' | UnitKind) => void;
  setStatus: (status: 'all' | UnitStatus) => void;
  acknowledge: (id: string) => void;
  clearFilters: () => void;
  reset: () => void;
}

const initial = {
  dataMode: 'detecting' as DataMode,
  linkNote: 'Checking for a local simulator.',
  selectedId: null as string | null,
  search: '',
  kind: 'all' as const,
  status: 'all' as const,
  acknowledged: {} as Record<string, true>,
};

export const useUiStore = create<UiState>((set) => ({
  ...initial,
  setLink: (dataMode, linkNote) => set({ dataMode, linkNote }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setSearch: (search) => set({ search }),
  setKind: (kind) => set({ kind }),
  setStatus: (status) => set({ status }),
  acknowledge: (id) =>
    set((state) => ({ acknowledged: { ...state.acknowledged, [id]: true } })),
  clearFilters: () => set({ search: '', kind: 'all', status: 'all' }),
  reset: () => set({ ...initial, acknowledged: {} }),
}));
