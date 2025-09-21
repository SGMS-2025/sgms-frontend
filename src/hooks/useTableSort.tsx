import { useState, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { SortState, UseTableSortReturn } from '@/types/utils/sort';
import { getNextSortState } from '@/utils/sort';

/**
 * Custom hook for table sorting functionality
 * @param initialSort - Initial sort state
 * @returns Sort state and handlers
 */
export function useTableSort<T extends string = string>(initialSort?: SortState<T>): UseTableSortReturn<T> {
  const [sortState, setSortState] = useState<SortState<T>>(initialSort || { field: null, order: null });

  const handleSort = useCallback((field: T) => {
    setSortState((prev) => getNextSortState(prev.field, prev.order, field));
  }, []);

  const getSortIcon = useCallback(
    (field: T) => {
      const isActive = sortState.field === field && !!sortState.order;
      const activeColor = isActive ? 'text-orange-500' : 'text-orange-300';

      if (sortState.field !== field || !sortState.order) {
        return <ArrowUpDown className={`h-4 w-4 ${activeColor}`} />;
      }
      if (sortState.order === 'asc') {
        return <ArrowUp className={`h-4 w-4 ${activeColor}`} />;
      }
      if (sortState.order === 'desc') {
        return <ArrowDown className={`h-4 w-4 ${activeColor}`} />;
      }
      return <ArrowUpDown className={`h-4 w-4 ${activeColor}`} />;
    },
    [sortState]
  );

  const resetSort = useCallback(() => {
    setSortState({ field: null, order: null });
  }, []);

  return {
    sortState,
    handleSort,
    getSortIcon,
    resetSort
  };
}
