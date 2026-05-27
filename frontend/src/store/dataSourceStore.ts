import { create } from 'zustand';

export interface DataSourceOption {
  id: number;
  name: string;
  db_type: string;
  is_default: boolean;
  status: string;
}

interface DataSourceState {
  sources: DataSourceOption[];
  selectedId: number | null;
  setSources: (sources: DataSourceOption[]) => void;
  selectSource: (id: number) => void;
  reset: () => void;
}

export const useDataSourceStore = create<DataSourceState>((set) => ({
  sources: [],
  selectedId: null,
  setSources: (sources) => {
    const def = sources.find((s) => s.is_default) ?? sources[0] ?? null;
    set({ sources, selectedId: def?.id ?? null });
  },
  selectSource: (id) => set({ selectedId: id }),
  reset: () => set({ sources: [], selectedId: null }),
}));
