import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Plus,
  Calendar,
  Percent,
  Users,
  MapPin,
  Package,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Grid3X3,
  List,
  HelpCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/SortableHeader';
import {
  useDiscountCampaignList,
  useCreateDiscountCampaign,
  useUpdateDiscountCampaign,
  useDeleteDiscountCampaign,
  useDiscountCampaignStats
} from '@/hooks/useDiscount';
import { formatDate } from '@/utils/utils';
import { getStatusBadgeConfig } from '@/utils/discountUtils';
import { useTableSort } from '@/hooks/useTableSort';
import { sortArray } from '@/utils/sort';
import DiscountCampaignForm from '@/components/forms/DiscountCampaignForm';
import DiscountCampaignModal from '@/components/modals/DiscountCampaignModal';
import { useUser } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useBranch } from '@/contexts/BranchContext';
import { useDiscountsTour } from '@/hooks/useDiscountsTour';
import type { DiscountCampaign, DiscountCampaignFormData, DiscountCampaignApiData } from '@/types/api/Discount';

const DiscountManagement: React.FC = () => {
  const { t } = useTranslation();
  const { startDiscountsTour } = useDiscountsTour();
  const { campaigns, loading, error, refetch, statusFilter, setStatusFilter } = useDiscountCampaignList();
  const { createCampaign, loading: createLoading } = useCreateDiscountCampaign();
  const { updateCampaign, loading: updateLoading } = useUpdateDiscountCampaign();
  const { deleteCampaign, loading: deleteLoading } = useDeleteDiscountCampaign();

  // Get current user and staff info
  const currentUser = useUser();
  const { currentStaff } = useCurrentUserStaff();
  const { currentBranch, branches } = useBranch();

  // Get stats from API - memoize params to prevent unnecessary re-fetches
  const statsParams = React.useMemo(
    () => (currentBranch ? { branchId: currentBranch._id } : undefined),
    [currentBranch?._id]
  );
  const { stats: campaignStats, refetch: refetchStats } = useDiscountCampaignStats(statsParams);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [showEditForm, setShowEditForm] = React.useState(false);
  const [showViewModal, setShowViewModal] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [selectedCampaign, setSelectedCampaign] = React.useState<DiscountCampaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = React.useState<DiscountCampaign | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;
  const [viewMode, setViewMode] = React.useState<'card' | 'table'>('card');

  // Sort functionality
  const { sortState, handleSort, getSortIcon } = useTableSort();

  // Function to check if user can edit/delete a campaign
  const canManageCampaign = React.useCallback(
    (campaign: DiscountCampaign): boolean => {
      // Owner and Admin can manage all campaigns
      if (currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN') {
        return true;
      }

      // If user is not a staff member, they cannot manage campaigns
      if (!currentStaff) {
        return false;
      }

      // If user is a staff member but not a manager, they cannot manage campaigns
      if (currentStaff.jobTitle !== 'Manager') {
        return false;
      }

      // Check if the campaign has any branches that the current user doesn't manage
      if (!campaign.branchId || campaign.branchId.length === 0) {
        return false;
      }

      // Get the branch IDs that the current user manages (from myBranches)
      const managedBranchIds = branches.map((branch) => branch._id);

      // Check if all branches in the campaign are managed by the current user
      const allBranchesManaged = campaign.branchId.every((branch) => managedBranchIds.includes(branch._id));

      return allBranchesManaged;
    },
    [currentUser, currentStaff, branches]
  );

  // Handle search with debouncing
  const handleSearchChange = React.useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = React.useCallback(
    (value: string) => {
      setStatusFilter(value);
    },
    [setStatusFilter]
  );

  // Handle campaign actions
  const handleCreateCampaign = React.useCallback(
    async (data: DiscountCampaignFormData) => {
      const campaignData: DiscountCampaignApiData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString()
      };
      await createCampaign(campaignData);
      toast.success(t('discount.create_success'));
      setShowCreateForm(false);
      refetch();
      refetchStats();
    },
    [createCampaign, refetch, refetchStats, t]
  );

  const handleUpdateCampaign = React.useCallback(
    async (data: DiscountCampaignFormData) => {
      if (!selectedCampaign) return;
      const campaignData: DiscountCampaignApiData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString()
      };
      await updateCampaign(selectedCampaign._id, campaignData);
      toast.success(t('toast.discount_campaign_updated'));
      setShowEditForm(false);
      setSelectedCampaign(null);
      refetch();
      refetchStats();
    },
    [updateCampaign, selectedCampaign, refetch, refetchStats, t]
  );

  const handleDeleteCampaign = React.useCallback(async () => {
    if (!campaignToDelete) return;

    await deleteCampaign(campaignToDelete._id);
    toast.success(t('toast.discount_campaign_deleted'));
    setShowDeleteDialog(false);
    setCampaignToDelete(null);
    refetch();
    refetchStats();
  }, [deleteCampaign, campaignToDelete, refetch, refetchStats, t]);

  const handleViewCampaign = React.useCallback((campaign: DiscountCampaign) => {
    setSelectedCampaign(campaign);
    setShowViewModal(true);
  }, []);

  const handleEditCampaign = React.useCallback((campaign: DiscountCampaign) => {
    setSelectedCampaign(campaign);
    setShowViewModal(false);
    setShowEditForm(true);
  }, []);

  const handleDeleteClick = React.useCallback((campaign: DiscountCampaign) => {
    setCampaignToDelete(campaign); // Lưu campaign cần xóa
    setShowViewModal(false); // Đóng modal trước
    setShowDeleteDialog(true); // Mở dialog xác nhận
  }, []);

  // Use React.useMemo for better performance
  const filteredCampaigns = React.useMemo(() => {
    let filtered = campaigns.filter((campaign) => {
      const matchesStatus = !statusFilter || statusFilter === 'all' || campaign.status === statusFilter;

      const matchesSearch =
        !searchTerm ||
        campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.createBy.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.branchId.some((branch) => branch.branchName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filter by current branch if one is selected
      const matchesBranch = !currentBranch || campaign.branchId.some((branch) => branch._id === currentBranch._id);

      return matchesStatus && matchesSearch && matchesBranch;
    });

    // Apply sorting
    if (sortState.field && sortState.order) {
      filtered = sortArray(filtered, sortState, (item, field) => {
        switch (field) {
          case 'campaignName':
            return item.campaignName.toLowerCase();
          case 'discountPercentage':
            return item.discountPercentage;
          case 'startDate':
            return new Date(item.startDate).getTime();
          case 'endDate':
            return new Date(item.endDate).getTime();
          case 'status':
            return item.status.toLowerCase();
          case 'createBy':
            return item.createBy.fullName.toLowerCase();
          default:
            return '';
        }
      });
    }

    return filtered;
  }, [campaigns, statusFilter, searchTerm, sortState, currentBranch]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('discount.loading_campaigns')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            {t('discount.try_again')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div className="basic-management">
          {/* Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
                  <Percent className="h-3.5 w-3.5" />
                  {t('discount.badge')}
                </span>
                <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900">{t('discount.title')}</h2>
                <p className="mt-1 text-sm text-gray-500">{t('discount.subtitle')}</p>
                {currentBranch && (
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-orange-600 font-medium">
                      {t('discount.filtering_by_branch')}: {currentBranch.branchName}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-300 hover:bg-gray-50"
                  onClick={startDiscountsTour}
                  title={t('discount.tour.button', 'Hướng dẫn')}
                >
                  <HelpCircle className="w-4 h-4 text-gray-500 hover:text-orange-500" />
                </Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                  onClick={() => setShowCreateForm(true)}
                  data-tour="discount-add-campaign-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('discount.add_campaign')}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {campaignStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8" data-tour="discount-stats-cards">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Percent className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{t('discount.total_campaigns')}</p>
                      <p className="text-2xl font-bold text-gray-900">{campaignStats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{t('discount.active_campaigns')}</p>
                      <p className="text-2xl font-bold text-gray-900">{campaignStats.active}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{t('discount.expired_campaigns')}</p>
                      <p className="text-2xl font-bold text-gray-900">{campaignStats.expired}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{t('discount.pending_campaigns')}</p>
                      <p className="text-2xl font-bold text-gray-900">{campaignStats.pending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{t('discount.inactive_campaigns')}</p>
                      <p className="text-2xl font-bold text-gray-900">{campaignStats.inactive}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="mb-8">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder={t('discount.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 text-sm sm:text-base"
                        data-tour="discount-search-input"
                      />
                    </div>
                  </div>
                  <div className="w-full sm:w-35">
                    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                      <SelectTrigger data-tour="discount-status-filter">
                        <SelectValue placeholder={t('discount.filter_by_status')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('discount.all_status')}</SelectItem>
                        <SelectItem value="ACTIVE">{t('discount.active')}</SelectItem>
                        <SelectItem value="PENDING">{t('discount.pending')}</SelectItem>
                        <SelectItem value="EXPIRED">{t('discount.expired')}</SelectItem>
                        <SelectItem value="INACTIVE">{t('discount.inactive')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2" data-tour="discount-view-mode-toggle">
                    <Button
                      variant={viewMode === 'card' ? 'default' : 'outline'}
                      onClick={() => setViewMode('card')}
                      className="h-9 px-3"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      onClick={() => setViewMode('table')}
                      className="h-9 px-3"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign List */}
          {viewMode === 'card' ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              data-tour="discount-campaign-list"
            >
              {paginatedCampaigns.map((campaign) => (
                <Card key={campaign._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3 relative">
                    <div className="min-w-0 pr-24">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                        {campaign.campaignName}
                      </CardTitle>
                    </div>
                    <div className="absolute top-0 right-2 flex items-center gap-2 whitespace-nowrap">
                      {(() => {
                        const badgeConfig = getStatusBadgeConfig(campaign, t);
                        return <Badge variant={badgeConfig.variant}>{badgeConfig.text}</Badge>;
                      })()}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-tour="discount-actions-menu">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewCampaign(campaign)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('common.view')}
                          </DropdownMenuItem>
                          {canManageCampaign(campaign) && (
                            <>
                              <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteClick(campaign)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('common.delete')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* <p className="text-gray-600 text-sm">{campaign.description}</p> */}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{t('discount.discount')}:</span>
                      <span className="font-semibold text-orange-600">{campaign.discountPercentage}%</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{t('discount.start_date')}:</span>
                        <span className="text-sm font-medium">{formatDate(campaign.startDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{t('discount.end_date')}:</span>
                        <span className="text-sm font-medium">{formatDate(campaign.endDate)}</span>
                      </div>
                    </div>

                    {campaign.packageId && campaign.packageId.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-500">{t('discount.applicable_services')}:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {campaign.packageId.slice(0, 2).map((pkg, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Package className="w-3 h-3 mr-1" />
                              {pkg.name || pkg._id}
                            </Badge>
                          ))}
                          {campaign.packageId.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{campaign.packageId.length - 2} {t('discount.more')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div
              className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm"
              data-tour="discount-campaign-list"
            >
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[18rem]" />
                  <col className="w-[6rem]" />
                  <col className="w-[8rem]" />
                  <col className="w-[8rem]" />
                  <col className="w-[8rem]" />
                  <col className="w-[12rem]" />
                  <col className="w-[7rem]" />
                </colgroup>
                <thead className="border-b bg-gray-50">
                  <tr>
                    <SortableHeader
                      field="campaignName"
                      label={t('discount.campaign_name')}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="discountPercentage"
                      label={t('discount.discount')}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="startDate"
                      label={t('discount.start_date')}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="endDate"
                      label={t('discount.end_date')}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <SortableHeader
                      field="status"
                      label={t('discount.status')}
                      sortState={sortState}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('discount.applicable_services')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCampaigns.map((campaign) => (
                    <tr key={campaign._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campaign.campaignName}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{campaign.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-orange-600">{campaign.discountPercentage}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(campaign.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(campaign.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const badgeConfig = getStatusBadgeConfig(campaign, t);
                          return <Badge variant={badgeConfig.variant}>{badgeConfig.text}</Badge>;
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {campaign.packageId.slice(0, 2).map((pkg, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Package className="w-3 h-3 mr-1" />
                              {pkg.name || pkg._id}
                            </Badge>
                          ))}
                          {campaign.packageId.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{campaign.packageId.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-tour="discount-actions-menu">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCampaign(campaign)}>
                              <Eye className="mr-2 h-4 w-4" />
                              {t('common.view')}
                            </DropdownMenuItem>
                            {canManageCampaign(campaign) && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteClick(campaign)} className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8" data-tour="discount-pagination">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {filteredCampaigns.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Percent className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('discount.no_campaigns_found')}</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? t('discount.no_campaigns_filtered')
                    : t('discount.no_campaigns_message')}
                </p>
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('discount.add_campaign')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Campaign Form Modal */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto hide-scrollbar">
          <DialogHeader>
            <DialogTitle>{t('discount.create_campaign')}</DialogTitle>
            <DialogDescription>{t('discount.create_campaign_description')}</DialogDescription>
          </DialogHeader>
          <DiscountCampaignForm
            onSubmit={handleCreateCampaign}
            onCancel={() => setShowCreateForm(false)}
            loading={createLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Form Modal */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto hide-scrollbar">
          <DialogHeader>
            <DialogTitle>{t('discount.edit_campaign')}</DialogTitle>
            <DialogDescription>{t('discount.edit_campaign_description')}</DialogDescription>
          </DialogHeader>
          <DiscountCampaignForm
            campaign={selectedCampaign || undefined}
            onSubmit={handleUpdateCampaign}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedCampaign(null);
            }}
            loading={updateLoading}
          />
        </DialogContent>
      </Dialog>

      {/* View Campaign Modal */}
      <DiscountCampaignModal
        campaign={selectedCampaign}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedCampaign(null);
        }}
        onEdit={handleEditCampaign}
        onDelete={handleDeleteClick}
        mode="view"
        canManage={selectedCampaign ? canManageCampaign(selectedCampaign) : false}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('discount.delete_campaign')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('discount.delete_campaign_confirmation').replace(
                '{campaignName}',
                campaignToDelete?.campaignName || ''
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCampaign}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('discount.deleting')}
                </>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DiscountManagement;
