import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Lock, Unlock, ChevronLeft, ChevronRight, User as UserIcon, Building2, Eye, Plus } from 'lucide-react';
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
import { toast } from 'sonner';
import { userApi } from '@/services/api/userApi';
import type { User, AccountsListQuery } from '@/types/api/User';
import { format } from 'date-fns';
import { CreateOwnerDialog } from '@/components/admin/CreateOwnerDialog';

const AdminAccountsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const [filters, setFilters] = useState<AccountsListQuery>({
    role: 'OWNER', // Only show OWNER accounts
    status: undefined,
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [selectedAccount, setSelectedAccount] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'lock' | 'unlock' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreateOwnerDialogOpen, setIsCreateOwnerDialogOpen] = useState(false);

  const statusLabels: Record<string, string> = {
    ACTIVE: t('common.status.active'),
    INACTIVE: t('common.status.inactive'),
    SUSPENDED: t('common.status.suspended'),
    DELETED: t('common.status.deleted')
  };

  const statusFilterLabels: Record<string, string> = {
    ACTIVE: t('admin.accounts.filters.status.active'),
    INACTIVE: t('admin.accounts.filters.status.inactive'),
    SUSPENDED: t('admin.accounts.filters.status.suspended'),
    DELETED: t('admin.accounts.filters.status.deleted')
  };

  const roleLabels: Record<string, string> = {
    OWNER: t('admin.accounts.roles.owner'),
    CUSTOMER: t('admin.accounts.roles.customer'),
    STAFF: t('admin.accounts.roles.staff'),
    ADMIN: t('admin.accounts.roles.admin')
  };

  const sortOptionLabels: Record<string, string> = {
    'createdAt-desc': t('admin.accounts.filters.sort.created_desc'),
    'createdAt-asc': t('admin.accounts.filters.sort.created_asc'),
    'fullName-asc': t('admin.accounts.filters.sort.name_asc'),
    'fullName-desc': t('admin.accounts.filters.sort.name_desc'),
    'email-asc': t('admin.accounts.filters.sort.email_asc'),
    'email-desc': t('admin.accounts.filters.sort.email_desc')
  };

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const result = await userApi.getAccountsList(filters);

    if (result.success && result.data) {
      setAccounts(result.data.accounts || []);
      setPagination(
        result.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      );
    } else {
      toast.error(result.message || t('admin.accounts.toast.fetchError'));
      setAccounts([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });
    }

    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleFilterChange = (key: keyof AccountsListQuery, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
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

  const handleLockUnlock = (account: User, type: 'lock' | 'unlock') => {
    setSelectedAccount(account);
    setActionType(type);
    setIsDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedAccount || !actionType) return;

    setIsProcessing(true);
    const result =
      actionType === 'lock'
        ? await userApi.lockAccount(selectedAccount._id)
        : await userApi.unlockAccount(selectedAccount._id);

    if (result.success) {
      toast.success(
        actionType === 'lock'
          ? t('admin.accounts.toast.lockSuccess', { email: selectedAccount.email })
          : t('admin.accounts.toast.unlockSuccess', { email: selectedAccount.email })
      );
      setIsDialogOpen(false);
      setSelectedAccount(null);
      setActionType(null);
      fetchAccounts();
    } else {
      toast.error(
        result.message ||
          (actionType === 'lock' ? t('admin.accounts.toast.lockError') : t('admin.accounts.toast.unlockError'))
      );
    }

    setIsProcessing(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      SUSPENDED: 'destructive',
      DELETED: 'outline'
    };

    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 hover:bg-green-200',
      INACTIVE: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      SUSPENDED: 'bg-red-100 text-red-800 hover:bg-red-200',
      DELETED: 'bg-gray-200 text-gray-600 hover:bg-gray-300'
    };

    return (
      <Badge className={colors[status] || colors.INACTIVE} variant={variants[status] || 'secondary'}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      CUSTOMER: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      OWNER: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      ADMIN: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      STAFF: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    };

    return (
      <Badge className={colors[role] || colors.CUSTOMER} variant="outline">
        {roleLabels[role] || role}
      </Badge>
    );
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.accounts.loading.title')}</h1>
            <p className="text-gray-500 mt-1">{t('admin.accounts.loading.description')}</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('admin.accounts.loading.message')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.accounts.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.accounts.subtitle')}</p>
        </div>
        <Button
          onClick={() => setIsCreateOwnerDialogOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.accounts.create.button')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.accounts.filters.title')}</CardTitle>
          <CardDescription>{t('admin.accounts.filters.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('admin.accounts.filters.searchPlaceholder')}
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                handleFilterChange('status', value === 'all' ? undefined : (value as User['status'] | 'DELETED'))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {filters.status ? statusFilterLabels[filters.status] : t('admin.accounts.filters.statusAll')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.accounts.filters.statusAll')}</SelectItem>
                <SelectItem value="ACTIVE">{statusFilterLabels.ACTIVE}</SelectItem>
                <SelectItem value="INACTIVE">{statusFilterLabels.INACTIVE}</SelectItem>
                <SelectItem value="SUSPENDED">{statusFilterLabels.SUSPENDED}</SelectItem>
                <SelectItem value="DELETED">{statusFilterLabels.DELETED}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-');
                handleFilterChange('sortBy', sortBy as AccountsListQuery['sortBy']);
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
                <SelectItem value="email-asc">{sortOptionLabels['email-asc']}</SelectItem>
                <SelectItem value="email-desc">{sortOptionLabels['email-desc']}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.accounts.table.title', { count: pagination.total })}</CardTitle>
          <CardDescription>{t('admin.accounts.table.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>{t('admin.accounts.table.empty')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.accounts.table.columns.owner')}</TableHead>
                      <TableHead>{t('admin.accounts.table.columns.role')}</TableHead>
                      <TableHead>{t('admin.accounts.table.columns.status')}</TableHead>
                      <TableHead>{t('admin.accounts.table.columns.email')}</TableHead>
                      <TableHead>{t('admin.accounts.table.columns.phone')}</TableHead>
                      <TableHead>{t('admin.accounts.table.columns.created')}</TableHead>
                      <TableHead className="text-right">{t('admin.accounts.table.columns.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {account.avatar?.url ? (
                              <img
                                src={account.avatar.url}
                                alt={account.fullName || account.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {account.role === 'OWNER' ? (
                                  <Building2 className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <UserIcon className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{account.fullName || account.username}</div>
                              <div className="text-sm text-gray-500">@{account.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(account.role)}</TableCell>
                        <TableCell>{getStatusBadge(account.status)}</TableCell>
                        <TableCell>{account.email}</TableCell>
                        <TableCell>{account.phoneNumber || '-'}</TableCell>
                        <TableCell>{format(new Date(account.createdAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Only show View button for OWNER accounts - to view branches and customers */}
                            {account.role === 'OWNER' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/admin/accounts/${account._id}/owner`)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {t('common.actions.view')}
                              </Button>
                            )}
                            {/* CUSTOMER accounts don't have View button - customers are viewed through owner -> branch flow */}
                            {account.status === 'SUSPENDED' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLockUnlock(account, 'unlock')}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Unlock className="w-4 h-4 mr-1" />
                                {t('common.actions.unlock')}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLockUnlock(account, 'lock')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                    {t('admin.accounts.pagination.showing', {
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
                      <ChevronLeft className="w-4 h-4" />
                      {t('common.actions.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                    >
                      {t('common.actions.next')}
                      <ChevronRight className="w-4 h-4" />
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
              {actionType === 'lock' ? t('admin.accounts.dialog.lockTitle') : t('admin.accounts.dialog.unlockTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'lock'
                ? t('admin.accounts.dialog.lockDescription', { email: selectedAccount?.email })
                : t('admin.accounts.dialog.unlockDescription', { email: selectedAccount?.email })}
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
                  ? t('admin.accounts.dialog.lockConfirm')
                  : t('admin.accounts.dialog.unlockConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Owner Dialog */}
      <CreateOwnerDialog
        open={isCreateOwnerDialogOpen}
        onOpenChange={setIsCreateOwnerDialogOpen}
        onSuccess={() => {
          // Refresh accounts list
          fetchAccounts();
        }}
      />
    </div>
  );
};

export default AdminAccountsPage;
