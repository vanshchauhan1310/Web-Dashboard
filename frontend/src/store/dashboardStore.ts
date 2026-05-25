import { create } from 'zustand';

interface DashboardState {
  selectedCategory: string;
  selectedRegion: string;
  selectedTimePeriod: string;
  selectedSubCategory: string;
  selectedSegment: string;
  setSelectedCategory: (category: string) => void;
  setSelectedRegion: (region: string) => void;
  setSelectedTimePeriod: (period: string) => void;
  setSelectedSubCategory: (subCategory: string) => void;
  setSelectedSegment: (segment: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedCategory: 'All Categories',
  selectedRegion: 'All Regions',
  selectedTimePeriod: 'All Time',
  selectedSubCategory: 'All Sub-Categories',
  selectedSegment: 'All Segments',
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  setSelectedTimePeriod: (period) => set({ selectedTimePeriod: period }),
  setSelectedSubCategory: (subCategory) => set({ selectedSubCategory: subCategory }),
  setSelectedSegment: (segment) => set({ selectedSegment: segment }),
}));
