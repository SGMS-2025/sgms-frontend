import React from 'react';
import type { SortState } from '@/types/utils/sort';

interface SortableHeaderProps<T extends string = string> {
  field: T;
  label: string;
  sortState: SortState<T>;
  onSort: (field: T) => void;
  getSortIcon: (field: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export function SortableHeader<T extends string = string>({
  field,
  label,
  sortState,
  onSort,
  getSortIcon,
  className = '',
  sortable = true
}: SortableHeaderProps<T>) {
  const handleClick = () => {
    if (sortable) {
      onSort(field);
    }
  };

  const isActive = sortState.field === field && !!sortState.order;
  const baseClasses = 'px-4 py-3 text-sm font-semibold first:rounded-l-2xl last:rounded-r-2xl';
  const textClasses = className && className.includes('justify-') ? '' : 'text-left';
  const colorClasses = isActive ? 'bg-orange-100 text-orange-600' : 'text-orange-500';
  const sortableClasses = sortable
    ? 'cursor-pointer transition-colors hover:bg-orange-50 active:bg-orange-100 select-none'
    : '';
  const combinedClasses = `${baseClasses} ${textClasses} ${colorClasses} ${sortableClasses} ${className}`.trim();

  return (
    <th
      className={combinedClasses}
      onClick={handleClick}
      aria-sort={isActive ? (sortState.order === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <div
        className={`flex items-center ${className && className.includes('justify-center') ? 'justify-center' : ''} space-x-2`}
      >
        <span>{label}</span>
        {sortable && getSortIcon(field)}
      </div>
    </th>
  );
}
