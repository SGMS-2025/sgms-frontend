import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/BaseHeader';
import { Footer } from '@/components/layout/BaseFooter';
import { GymCard } from '@/components/cards/GymCard';
import { GymCardSkeleton } from '@/components/ui/skeleton';
import { ErrorMessage } from '@/components/ui/error-message';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';
import { useBranches } from '@/hooks/useBranches';
import { useDebounce } from '@/hooks/common/useDebounce';
import { Search, Filter, MapPin, Star, Grid, List, Loader2 } from 'lucide-react';
import type { BranchListParams } from '@/types/api/Branch';

const GymListPage: React.FC = () => {
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // API params
  const [apiParams, setApiParams] = useState<BranchListParams>({
    page: 1,
    limit: 6,
    sortBy: 'rating',
    sortOrder: 'desc'
  });

  // Update API params when debounced search term changes
  useEffect(() => {
    setApiParams((prev) => ({
      ...prev,
      page: 1, // Reset to first page when searching
      search: debouncedSearchTerm || undefined
    }));
  }, [debouncedSearchTerm]);

  // Fetch gyms data
  const { gymCards, loading, error, pagination, refetch } = useBranches(apiParams);

  // Filter gyms based on search and rating
  const filteredGyms = useMemo(() => {
    let filtered = [...gymCards];

    // Search by name or address
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (gym) =>
          gym.name.toLowerCase().includes(searchLower) ||
          gym.address.toLowerCase().includes(searchLower) ||
          gym.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by rating
    if (selectedRating) {
      filtered = filtered.filter((gym) => gym.rating >= selectedRating);
    }

    return filtered;
  }, [gymCards, searchTerm, selectedRating]);

  // Handle search with loading state
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsSearching(value.trim().length > 0 && value !== debouncedSearchTerm);
  };

  // Update searching state when debounced value changes
  useEffect(() => {
    setIsSearching(false);
  }, [debouncedSearchTerm]);

  // Handle rating filter
  const handleRatingFilter = (rating: number | null) => {
    setSelectedRating(rating);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setApiParams((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRating(null);
  };

  const hasActiveFilters = searchTerm.trim() || selectedRating;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Tìm Phòng Tập Lý Tưởng</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto mb-8">
              Khám phá hệ thống phòng tập hiện đại với trang thiết bị chuyên nghiệp
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
                )}
                <Input
                  type="text"
                  placeholder="Tìm kiếm theo tên phòng tập, địa chỉ..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 text-lg rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-white/30 bg-white/95 text-gray-800 placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Controls */}
      <section className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Results count and filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="text-gray-600">
                <span className="font-semibold text-gray-800">{filteredGyms.length}</span> phòng tập được tìm thấy
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Bộ lọc
              </Button>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedRating && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {selectedRating}+ sao
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              )}
            </div>

            {/* Right: View mode toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2"
              >
                <Grid className="w-4 h-4" />
                Lưới
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                Danh sách
              </Button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá tối thiểu</label>
                  <div className="flex gap-2">
                    {[3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={selectedRating === rating ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleRatingFilter(selectedRating === rating ? null : rating)}
                        className="flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        {rating}+
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Gym Cards */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && <GymCardSkeleton count={6} />}

          {error && (
            <div className="text-center py-12">
              <ErrorMessage message={error} onRetry={refetch} />
            </div>
          )}

          {!loading && !error && (
            <>
              {filteredGyms.length === 0 ? (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy phòng tập</h3>
                    <p className="text-gray-600 mb-4">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc của bạn</p>
                    <Button onClick={clearFilters} variant="outline">
                      Xóa bộ lọc
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Gym Cards Grid */}
                  <div
                    className={`grid gap-6 lg:gap-8 ${
                      viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'
                    }`}
                  >
                    {filteredGyms.map((gym, index) => (
                      <GymCard
                        key={gym.id}
                        gym={gym}
                        index={index}
                        showAnimation={!searchTerm && !selectedRating}
                        variant="list"
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex flex-col items-center gap-4 mt-12">
                      {/* Pagination Info */}
                      <div className="text-sm text-gray-600">
                        Trang {pagination.page} / {pagination.totalPages}
                        <span className="mx-2">•</span>
                        Tổng {pagination.total} phòng tập
                      </div>

                      {/* Pagination Controls */}
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(pagination.page - 1)}
                              className={!pagination.hasPrev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>

                          {(() => {
                            const currentPage = pagination.page;
                            const totalPages = pagination.totalPages;
                            const maxVisible = 7;

                            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                            const endPage = Math.min(totalPages, startPage + maxVisible - 1);

                            if (endPage - startPage + 1 < maxVisible) {
                              startPage = Math.max(1, endPage - maxVisible + 1);
                            }

                            const pages = [];

                            // First page + ellipsis
                            if (startPage > 1) {
                              pages.push(
                                <PaginationItem key={1}>
                                  <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">
                                    1
                                  </PaginationLink>
                                </PaginationItem>
                              );
                              if (startPage > 2) {
                                pages.push(
                                  <PaginationItem key="ellipsis1">
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                );
                              }
                            }

                            // Page numbers
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <PaginationItem key={i}>
                                  <PaginationLink
                                    isActive={currentPage === i}
                                    onClick={() => handlePageChange(i)}
                                    className="cursor-pointer"
                                  >
                                    {i}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }

                            // Last page + ellipsis
                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) {
                                pages.push(
                                  <PaginationItem key="ellipsis2">
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                );
                              }
                              pages.push(
                                <PaginationItem key={totalPages}>
                                  <PaginationLink
                                    onClick={() => handlePageChange(totalPages)}
                                    className="cursor-pointer"
                                  >
                                    {totalPages}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }

                            return pages;
                          })()}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(pagination.page + 1)}
                              className={!pagination.hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default GymListPage;
