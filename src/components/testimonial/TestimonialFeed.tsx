import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  MapPin,
  User,
  Calendar,
  Image as ImageIcon,
  MoreHorizontal,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
} from '@/components/ui/pagination';
import { useTestimonialList, useUpdateTestimonialStatus, useDeleteTestimonial } from '@/hooks/useTestimonial';
import { useBranch } from '@/contexts/BranchContext';
import TestimonialModal from '@/components/modals/TestimonialModalProps';
import { AddTestimonialModal } from '@/components/modals/AddTestimonialModalProps';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import type { TestimonialDisplay, TestimonialManagementProps } from '@/types/api/Testimonial';
import { useTestimonialsTour } from '@/hooks/useTestimonialsTour';

export const TestimonialFeed: React.FC<TestimonialManagementProps> = ({ onAddTestimonial }) => {
  const { t } = useTranslation();
  const { startTestimonialsTour } = useTestimonialsTour();
  const { currentBranch } = useBranch();
  const [filters, setFilters] = useState<{
    searchTerm: string;
  }>({
    searchTerm: ''
  });

  const [selectedTestimonial, setSelectedTestimonial] = useState<TestimonialDisplay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [testimonialToUpdate, setTestimonialToUpdate] = useState<TestimonialDisplay | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<TestimonialDisplay | null>(null);

  // Use the custom hook to fetch data
  const { testimonialList, stats, loading, error, pagination, refetch, refetchStats, goToPage } = useTestimonialList({
    limit: 10
  });

  // Use the hooks for updating testimonial status and deleting
  const { updateTestimonialStatus } = useUpdateTestimonialStatus();
  const { deleteTestimonial } = useDeleteTestimonial();

  // Filter by current branch and search
  const sortedTestimonialList = useMemo(() => {
    let filteredTestimonialList = testimonialList;

    // Filter by current branch if one is selected
    if (currentBranch) {
      filteredTestimonialList = filteredTestimonialList.filter((testimonial) => {
        return testimonial.branches.includes(currentBranch._id);
      });
    }

    // Frontend search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredTestimonialList = filteredTestimonialList.filter((testimonial) => {
        return (
          testimonial.title.toLowerCase().includes(searchTerm) ||
          testimonial.content.toLowerCase().includes(searchTerm) ||
          testimonial.createdBy.toLowerCase().includes(searchTerm)
        );
      });
    }

    return filteredTestimonialList;
  }, [testimonialList, currentBranch, filters.searchTerm]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
  };

  const handlePageChange = (newPage: number) => {
    goToPage(newPage);
  };

  const handleAddTestimonial = () => {
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = () => {
    refetch();
    refetchStats();
    if (onAddTestimonial) {
      onAddTestimonial();
    }
  };

  const handleViewTestimonial = (testimonial: TestimonialDisplay) => {
    setSelectedTestimonial(testimonial);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditTestimonial = (testimonial: TestimonialDisplay) => {
    setSelectedTestimonial(testimonial);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    setSelectedTestimonial(null);
    setIsEditMode(false);
    await refetch();
  };

  const handleToggleTestimonialStatus = (testimonial: TestimonialDisplay) => {
    setTestimonialToUpdate(testimonial);
    setStatusDialogOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!testimonialToUpdate) return;

    const newStatus = testimonialToUpdate.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await updateTestimonialStatus(testimonialToUpdate.id, newStatus);
    await refetch();
    await refetchStats();
    setStatusDialogOpen(false);
    setTestimonialToUpdate(null);
  };

  const handleDeleteTestimonial = (testimonial: TestimonialDisplay) => {
    setTestimonialToDelete(testimonial);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!testimonialToDelete) return;

    await deleteTestimonial(testimonialToDelete.id);
    await refetch();
    await refetchStats();
    setDeleteDialogOpen(false);
    setTestimonialToDelete(null);
  };

  const paginationPages = React.useMemo(() => {
    if (!pagination) return [];
    const pages = new Set<number>();
    const total = pagination.totalPages;
    const current = pagination.currentPage;

    pages.add(1);
    pages.add(total);
    pages.add(current);

    const neighbors = [current - 1, current + 1, current - 2, current + 2];
    neighbors.forEach((page) => {
      if (page > 1 && page < total) {
        pages.add(page);
      }
    });

    return Array.from(pages).sort((a, b) => a - b);
  }, [pagination]);

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#f05a29]" />
            <p className="text-gray-600">{t('dashboard.loading_testimonial_list')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refetch} className="bg-[#f05a29] hover:bg-[#df4615] text-white">
              {t('dashboard.try_again')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-orange-600" />
              {t('dashboard.testimonial_management')}
            </h1>
            <p className="text-gray-600 mt-1">{t('dashboard.testimonial_overview_subtitle')}</p>
            {currentBranch && (
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600 font-medium">
                  {t('dashboard.filtering_by_branch')}: {currentBranch.branchName}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-gray-300 hover:bg-gray-50"
              onClick={startTestimonialsTour}
              title={t('testimonial.tour.button', 'Hướng dẫn')}
            >
              <HelpCircle className="w-4 h-4 text-gray-500 hover:text-orange-500" />
            </Button>
            <Button
              onClick={handleAddTestimonial}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6 py-2 flex items-center gap-2"
              data-tour="testimonials-add-button"
            >
              <Plus className="h-4 w-4" />
              {t('dashboard.add_testimonial')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-tour="testimonials-stats-cards">
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-600">{t('dashboard.total')}</div>
            <div className="text-2xl font-bold text-gray-900">
              {(stats.find((stat) => stat._id === 'ACTIVE')?.count || 0) +
                (stats.find((stat) => stat._id === 'INACTIVE')?.count || 0)}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm font-medium text-green-600">{t('testimonial.active')}</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.find((stat) => stat._id === 'ACTIVE')?.count || 0}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">{t('dashboard.inactive')}</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.find((stat) => stat._id === 'INACTIVE')?.count || 0}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-600">{t('dashboard.with_images')}</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.find((stat) => stat._id === 'WITH_IMAGES')?.count || 0}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder={t('dashboard.enter_testimonial_search')}
            className="pl-10 rounded-full border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            value={filters.searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            data-tour="testimonials-search-input"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Facebook-style Feed */}
      <div className="space-y-4" data-tour="testimonials-list">
        {sortedTestimonialList.map((testimonial) => (
          <div key={testimonial.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Post Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{testimonial.createdBy}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(testimonial.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      testimonial.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {testimonial.status === 'ACTIVE' ? t('testimonial.active') : t('dashboard.inactive')}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        data-tour="testimonials-actions-menu"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleViewTestimonial(testimonial)} className="cursor-pointer">
                        <Eye className="h-4 w-4 mr-2" />
                        {t('common.view')} {t('dashboard.details')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditTestimonial(testimonial)} className="cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleTestimonialStatus(testimonial)}
                        className="cursor-pointer"
                      >
                        {testimonial.status === 'ACTIVE' ? (
                          <ToggleLeft className="h-4 w-4 mr-2" />
                        ) : (
                          <ToggleRight className="h-4 w-4 mr-2 text-green-600" />
                        )}
                        {testimonial.status === 'ACTIVE' ? t('dashboard.inactive') : t('testimonial.active')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteTestimonial(testimonial)}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{testimonial.title}</h2>
              <div className="text-gray-700 leading-relaxed">
                <MarkdownRenderer content={testimonial.content} />
              </div>
            </div>

            {/* Post Images */}
            {testimonial.images && testimonial.images.length > 0 && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {testimonial.images.slice(0, 4).map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`${t('dashboard.testimonials')} ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          console.error('Image load error:', image.url);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', image.url);
                        }}
                      />
                      {testimonial.images.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold">
                            +{testimonial.images.length - 4} {t('common.more')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image count info */}
            {testimonial.images && testimonial.images.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500">
                  <ImageIcon className="h-4 w-4 mr-1" />
                  {testimonial.images.length} {t('dashboard.images')}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && (
        <div
          className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          data-tour="testimonials-pagination"
        >
          <div className="text-sm text-gray-500">
            {`${t('dashboard.showing')} ${(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} ${t('dashboard.of_total')} ${pagination.totalItems} ${t('dashboard.testimonials')}`}
          </div>
          <Pagination className="justify-end md:justify-center">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (pagination.hasPrevPage) {
                      handlePageChange(pagination.currentPage - 1);
                    }
                  }}
                  className={!pagination.hasPrevPage ? 'pointer-events-none opacity-40' : ''}
                />
              </PaginationItem>

              {paginationPages.map((page, index) => {
                const previousPage = paginationPages[index - 1];
                const showEllipsis = previousPage && page - previousPage > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={page === pagination.currentPage}
                        className={page === pagination.currentPage ? 'border-orange-200 text-orange-600' : ''}
                        onClick={(event) => {
                          event.preventDefault();
                          handlePageChange(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (pagination.hasNextPage) {
                      handlePageChange(pagination.currentPage + 1);
                    }
                  }}
                  className={!pagination.hasNextPage ? 'pointer-events-none opacity-40' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Testimonial Detail Modal */}
      <TestimonialModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        testimonial={selectedTestimonial}
        initialEditMode={isEditMode}
        onTestimonialUpdate={refetchStats}
      />

      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.confirm_status_change')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.status_change_description', {
                name: testimonialToUpdate?.title,
                status:
                  testimonialToUpdate?.status === 'ACTIVE'
                    ? t('testimonial_modal.status_inactive')
                    : t('testimonial_modal.status_active')
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStatusDialogOpen(false)}>{t('dashboard.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusUpdate} className="bg-orange-600 hover:bg-orange-700">
              {t('dashboard.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.confirm_delete_testimonial')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.delete_testimonial_description', { name: testimonialToDelete?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>{t('dashboard.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {t('dashboard.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Testimonial Modal */}
      <AddTestimonialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};
