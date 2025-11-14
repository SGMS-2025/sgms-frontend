import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Search, Building2, User as UserIcon, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { customerApi } from '@/services/api/customerApi';
import { branchApi } from '@/services/api/branchApi';
import { userApi } from '@/services/api/userApi';
import type { CustomerDisplay, CustomerListResponse } from '@/types/api/Customer';
import type { Branch } from '@/types/api/Branch';
import { format } from 'date-fns';
import { toast } from 'sonner';

const AdminBranchCustomersPage = () => {
  const { t } = useTranslation();
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [customers, setCustomers] = useState<CustomerDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const [filters, setFilters] = useState({
    search: '',
    status: undefined as string | undefined,
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDisplay | null>(null);
  const [actionType, setActionType] = useState<'lock' | 'unlock' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const statusLabels: Record<string, string> = {
    ACTIVE: t('common.status.active'),
    INACTIVE: t('common.status.inactive'),
    SUSPENDED: t('common.status.suspended'),
    BLACKLISTED: t('common.status.blacklisted'),
    DELETED: t('common.status.deleted')
  };

  const statusFilterLabels: Record<string, string> = {
    ACTIVE: t('admin.branch_customers.filters.status.active'),
    INACTIVE: t('admin.branch_customers.filters.status.inactive'),
    SUSPENDED: t('admin.branch_customers.filters.status.suspended'),
    BLACKLISTED: t('admin.branch_customers.filters.status.blacklisted')
  };

  const sortOptionLabels: Record<string, string> = {
    'createdAt-desc': t('admin.branch_customers.filters.sort.created_desc'),
    'createdAt-asc': t('admin.branch_customers.filters.sort.created_asc'),
    'fullName-asc': t('admin.branch_customers.filters.sort.name_asc'),
    'fullName-desc': t('admin.branch_customers.filters.sort.name_desc')
  };

  useEffect(() => {
    if (branchId) {
      fetchBranchDetail();
      fetchCustomers();
    }
  }, [branchId]);

  useEffect(() => {
    if (branchId) {
      fetchCustomers();
    }
  }, [filters, branchId]);

  const fetchBranchDetail = async () => {
    if (!branchId) return;

    const result = await branchApi.getBranchDetailProtected(branchId);
    if (result.success && result.data) {
      setBranch(result.data);
    } else {
      toast.error(t('admin.branch_customers.toast.fetchBranchError'));
      navigate('/admin/accounts');
    }
  };

  const fetchCustomers = useCallback(async () => {
    if (!branchId) return;

    setLoading(true);
    const result = await customerApi.getCustomerList({
      branchId,
      search: filters.search || undefined,
      status: filters.status || undefined,
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    });

    if (result.success && result.data) {
      const customerData = result.data as CustomerListResponse;
      setCustomers(customerData.customers || []);
      const paginationData = customerData.pagination;
      setPagination({
        page: paginationData?.currentPage || 1,
        limit: paginationData?.itemsPerPage || 10,
        total: paginationData?.totalItems || 0,
        totalPages: paginationData?.totalPages || 0,
        hasNext: paginationData?.hasNextPage || false,
        hasPrev: paginationData?.hasPrevPage || false
      });
    } else {
      toast.error(result.message || t('admin.branch_customers.toast.fetchCustomersError'));
      setCustomers([]);
    }

    setLoading(false);
  }, [branchId, filters]);

  const handleFilterChange = (key: string, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLockUnlock = (customer: CustomerDisplay, type: 'lock' | 'unlock') => {
    // Get userId from customer - need to fetch customer detail first to get userId
    setSelectedCustomer(customer);
    setActionType(type);
    setIsDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedCustomer || !actionType) return;

    setIsProcessing(true);

    // First, get customer detail to get userId
    const customerDetail = await customerApi.getCustomerById(selectedCustomer.id, branchId);

    if (!customerDetail.success || !customerDetail.data) {
      toast.error(t('admin.branch_customers.toast.fetchDetailError'));
      setIsProcessing(false);
      return;
    }

    // Get userId from customer detail - userId is now included in response
    const userId = customerDetail.data.userId;

    if (!userId) {
      toast.error(t('admin.branch_customers.toast.missingUserId'));
      setIsProcessing(false);
      return;
    }

    const result = actionType === 'lock' ? await userApi.lockAccount(userId) : await userApi.unlockAccount(userId);

    if (result.success) {
      toast.success(
        actionType === 'lock'
          ? t('admin.branch_customers.toast.lockSuccess', { email: selectedCustomer.email })
          : t('admin.branch_customers.toast.unlockSuccess', { email: selectedCustomer.email })
      );
      setIsDialogOpen(false);
      setSelectedCustomer(null);
      setActionType(null);
      fetchCustomers();
    } else {
      toast.error(
        result.message ||
          (actionType === 'lock'
            ? t('admin.branch_customers.toast.lockError')
            : t('admin.branch_customers.toast.unlockError'))
      );
    }

    setIsProcessing(false);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 hover:bg-green-200',
      INACTIVE: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      SUSPENDED: 'bg-red-100 text-red-800 hover:bg-red-200',
      BLACKLISTED: 'bg-red-100 text-red-800 hover:bg-red-200',
      DELETED: 'bg-gray-200 text-gray-600 hover:bg-gray-300'
    };

    return (
      <Badge className={colors[status] || colors.INACTIVE} variant="outline">
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const formatJoinedDate = (customer: CustomerDisplay): string => {
    // Prefer createdAt (ISO date string) for formatting
    if (customer.createdAt) {
      const date = new Date(customer.createdAt);
      if (!isNaN(date.getTime())) {
        return format(date, 'MMM dd, yyyy');
      }
    }

    // Fallback to joinDate (already formatted as "dd/mm/yyyy" from backend)
    if (customer.joinDate && customer.joinDate !== '-') {
      // If joinDate is already formatted string, try to parse it
      // Format: "dd/mm/yyyy"
      const parts = customer.joinDate.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        if (!isNaN(date.getTime())) {
          return format(date, 'MMM dd, yyyy');
        }
      }
      // If parsing fails, return the original string
      return customer.joinDate;
    }

    return t('admin.branch_customers.table.noDate');
  };

  if (loading && !branch) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.branch_customers.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.actions.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('admin.branch_customers.title', {
                branch: branch?.branchName || t('admin.branch_customers.defaultBranch')
              })}
            </h1>
            <p className="text-gray-500 mt-1">{t('admin.branch_customers.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Branch Info */}
      {branch && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Building2 className="w-8 h-8 text-orange-600" />
              <div>
                <h3 className="font-semibold">{branch.branchName}</h3>
                {branch.location && <p className="text-sm text-gray-500">{branch.location}</p>}
              </div>
              <Badge
                className={branch.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                variant="outline"
              >
                {branch.isActive ? t('common.status.active') : t('common.status.inactive')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.branch_customers.filters.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('admin.branch_customers.filters.searchPlaceholder')}
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue>
                  {filters.status ? statusFilterLabels[filters.status] : t('admin.branch_customers.filters.statusAll')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.branch_customers.filters.statusAll')}</SelectItem>
                <SelectItem value="ACTIVE">{statusFilterLabels.ACTIVE}</SelectItem>
                <SelectItem value="INACTIVE">{statusFilterLabels.INACTIVE}</SelectItem>
                <SelectItem value="SUSPENDED">{statusFilterLabels.SUSPENDED}</SelectItem>
                <SelectItem value="BLACKLISTED">{statusFilterLabels.BLACKLISTED}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder as 'asc' | 'desc');
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {sortOptionLabels[`${filters.sortBy}-${filters.sortOrder}`] ?? sortOptionLabels['createdAt-desc']}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">{sortOptionLabels['createdAt-desc']}</SelectItem>
                <SelectItem value="createdAt-asc">{sortOptionLabels['createdAt-asc']}</SelectItem>
                <SelectItem value="fullName-asc">{sortOptionLabels['fullName-asc']}</SelectItem>
                <SelectItem value="fullName-desc">{sortOptionLabels['fullName-desc']}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('admin.branch_customers.table.title', { count: pagination.total })}
          </CardTitle>
          <CardDescription>{t('admin.branch_customers.table.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('admin.branch_customers.loadingCustomers')}</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>{t('admin.branch_customers.empty')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.branch_customers.table.columns.customer')}</TableHead>
                      <TableHead>{t('admin.branch_customers.table.columns.email')}</TableHead>
                      <TableHead>{t('admin.branch_customers.table.columns.phone')}</TableHead>
                      <TableHead>{t('admin.branch_customers.table.columns.status')}</TableHead>
                      <TableHead>{t('admin.branch_customers.table.columns.joined')}</TableHead>
                      <TableHead className="text-right">{t('admin.branch_customers.table.columns.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {customer.avatar?.url ? (
                              <img
                                src={customer.avatar.url}
                                alt={customer.name || customer.email}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{customer.name || customer.email}</div>
                              {customer.name && <div className="text-sm text-gray-500">{customer.email}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>{getStatusBadge(customer.status)}</TableCell>
                        <TableCell>{formatJoinedDate(customer)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {customer.status === 'SUSPENDED' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLockUnlock(customer, 'unlock')}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Unlock className="w-4 h-4 mr-1" />
                                {t('common.actions.unlock')}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLockUnlock(customer, 'lock')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={customer.status === 'INACTIVE'}
                              >
                                <Lock className="w-4 h-4 mr-1" />
                                {t('common.actions.lock')}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    {t('admin.branch_customers.pagination.showing', {
                      from: (pagination.page - 1) * pagination.limit + 1,
                      to: Math.min(pagination.page * pagination.limit, pagination.total),
                      total: pagination.total
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      {t('common.actions.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                    >
                      {t('common.actions.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'lock'
                ? t('admin.branch_customers.dialog.lockTitle')
                : t('admin.branch_customers.dialog.unlockTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'lock'
                ? t('admin.branch_customers.dialog.lockDescription', { email: selectedCustomer?.email })
                : t('admin.branch_customers.dialog.unlockDescription', { email: selectedCustomer?.email })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isProcessing}
              className={actionType === 'lock' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {isProcessing
                ? t('common.actions.processing')
                : actionType === 'lock'
                  ? t('admin.branch_customers.dialog.lockConfirm')
                  : t('admin.branch_customers.dialog.unlockConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBranchCustomersPage;
