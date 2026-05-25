import React, { createContext, useContext, useState } from 'react';

export interface ProcurementFilters {
  time_period: string;
  category:    string;
  department:  string;
  view_by:     string;
  supplier:    string;
  tier:        string;
  status:      string;
  abc_class:   string;
}

export const DEFAULT_FILTERS: ProcurementFilters = {
  time_period: 'All Time',
  category:    'All Categories',
  department:  'All Departments',
  view_by:     'Monthly',
  supplier:    'All Suppliers',
  tier:        'All Tiers',
  status:      'All Statuses',
  abc_class:   'All Classes',
};

interface ProcurementFiltersCtx {
  filters:      ProcurementFilters;
  setFilter:    (key: keyof ProcurementFilters, value: string) => void;
  resetFilters: () => void;
}

const ProcurementFiltersContext = createContext<ProcurementFiltersCtx>({
  filters:      DEFAULT_FILTERS,
  setFilter:    () => {},
  resetFilters: () => {},
});

export const ProcurementFiltersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<ProcurementFilters>(DEFAULT_FILTERS);

  const setFilter    = (key: keyof ProcurementFilters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }));
  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <ProcurementFiltersContext.Provider value={{ filters, setFilter, resetFilters }}>
      {children}
    </ProcurementFiltersContext.Provider>
  );
};

export const useProcurementFilters = () => useContext(ProcurementFiltersContext);
