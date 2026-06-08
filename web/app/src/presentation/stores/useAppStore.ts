import { create } from 'zustand';

export type Category = 'hero' | 'climate' | 'politics' | 'co2';

export interface AppState {
  category: Category;
  selectedStateId: string | null;

  climateDate: { month: number; year: number };
  politicsDate: { month: number; year: number };
  co2Date: { year: number };

  climateFilter: string;
  politicsFilter: string;
  co2Filter: string;

  setCategory: (category: Category) => void;
  setSelectedStateId: (stateId: string | null) => void;

  setClimateDate: (date: Partial<{ month: number; year: number }>) => void;
  setPoliticsDate: (date: Partial<{ month: number; year: number }>) => void;
  setCo2Date: (date: { year: number }) => void;

  setClimateFilter: (filter: string) => void;
  setPoliticsFilter: (filter: string) => void;
  setCo2Filter: (filter: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  category: 'hero',
  selectedStateId: null,

  climateDate: { month: 12, year: 2024 },
  politicsDate: { month: 12, year: 2024 },
  co2Date: { year: 2024 },

  climateFilter: 'temperatura',
  politicsFilter: 'prop_beneficas',
  co2Filter: 'media_emissao',

  setCategory: (category) => set({ category }),
  setSelectedStateId: (selectedStateId) => set({ selectedStateId }),

  setClimateDate: (date) => set((state) => ({ climateDate: { ...state.climateDate, ...date } })),
  setPoliticsDate: (date) => set((state) => ({ politicsDate: { ...state.politicsDate, ...date } })),
  setCo2Date: (date) => set({ co2Date: date }),

  setClimateFilter: (filter) => set({ climateFilter: filter }),
  setPoliticsFilter: (filter) => set({ politicsFilter: filter }),
  setCo2Filter: (filter) => set({ co2Filter: filter }),
}));
