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

  const baseClasses = 'px-4 py-3 text-left text-sm font-medium';
  const sortableClasses = sortable ? 'cursor-pointer hover:bg-[#df4615] transition-colors select-none' : '';
  const combinedClasses = `${baseClasses} ${sortableClasses} ${className}`.trim();

  return (
    <th className={combinedClasses} onClick={handleClick}>
      <div className="flex items-center space-x-2">
        <span>{label}</span>
        {sortable && getSortIcon(field)}
      </div>
    </th>
  );
}
