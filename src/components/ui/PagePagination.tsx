import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PagePaginationProps {
  pagination: {
    page: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
  goToPage: (page: number) => void;
  loading?: boolean;
  className?: string;
}

export function PagePagination({ pagination, goToPage, loading = false, className = '' }: PagePaginationProps) {
  const { t } = useTranslation();
  const { page: currentPage, totalPages, hasPrev, hasNext } = pagination;

  if (totalPages <= 1) {
    return null;
  }

  const maxVisible = 5; // Show max 5 page numbers at once

  // Calculate page range
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);

  // Adjust start if we're near the end
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pages = [];

  // First page + ellipsis
  if (startPage > 1) {
    pages.push(
      <Button
        key={1}
        variant="outline"
        size="sm"
        onClick={() => goToPage(1)}
        className="h-10 w-10 rounded-[20px] border-gray-200 bg-white hover:bg-gray-50"
      >
        1
      </Button>
    );
    if (startPage > 2) {
      pages.push(
        <span key="ellipsis1" className="px-2 text-muted-foreground">
          ...
        </span>
      );
    }
  }

  // Page numbers in range
  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <Button
        key={i}
        variant={i === currentPage ? 'default' : 'outline'}
        size="sm"
        onClick={() => goToPage(i)}
        className={`h-10 w-10 rounded-[20px] ${
          i === currentPage ? 'bg-[#F05A29] text-white hover:bg-[#df4615]' : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
      >
        {i}
      </Button>
    );
  }

  // Last page + ellipsis
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(
        <span key="ellipsis2" className="px-2 text-muted-foreground">
          ...
        </span>
      );
    }
    pages.push(
      <Button
        key={totalPages}
        variant="outline"
        size="sm"
        onClick={() => goToPage(totalPages)}
        className="h-10 w-10 rounded-[20px] border-gray-200 bg-white hover:bg-gray-50"
      >
        {totalPages}
      </Button>
    );
  }

  return (
    <div className={`flex items-center justify-center mt-8 space-x-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={!hasPrev || loading}
        className="h-10 px-3 rounded-[20px] border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        {t('common.previous')}
      </Button>

      {/* Page Numbers - Hidden on mobile */}
      <div className="hidden md:flex items-center space-x-1">{pages}</div>

      {/* Mobile Page Info */}
      <div className="md:hidden flex items-center px-3">
        <span className="text-sm text-muted-foreground">
          {currentPage}/{totalPages}
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={!hasNext || loading}
        className="h-10 px-3 rounded-[20px] border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('common.next')}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
