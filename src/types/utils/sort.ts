import React from 'react';

export type SortOrder = 'asc' | 'desc' | null;

export interface SortState<T extends string = string> {
  field: T | null;
  order: SortOrder;
}

export interface SortableField<T extends string = string> {
  key: T;
  label: string;
  sortable?: boolean;
}

export interface SortConfig<T extends string = string> {
  fields: SortableField<T>[];
  defaultSort?: {
    field: T;
    order: 'asc' | 'desc';
  };
}

export interface UseTableSortReturn<T extends string = string> {
  sortState: SortState<T>;
  handleSort: (field: T) => void;
  getSortIcon: (field: T) => React.ReactNode;
  resetSort: () => void;
}
