import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Calendar,
  User,
  Package,
  DollarSign,
  Filter,
  BarChart3,
  Wallet,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import type { OwnerSubscription, GetSubscriptionsQuery, SubscriptionAnalyticsResponse } from '@/types/api/Subscription';
import { Input } from '@/components/ui/input';

const AdminSubscriptionsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [items, setItems] = React.useState<OwnerSubscription[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');
  const [query, setQuery] = React.useState<GetSubscriptionsQuery>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [total, setTotal] = React.useState<number>(0);
  const [hasNext, setHasNext] = React.useState<boolean>(false);
  const [hasPrev, setHasPrev] = React.useState<boolean>(false);
  const [analytics, setAnalytics] = React.useState<SubscriptionAnalyticsResponse['data'] | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = React.useState<boolean>(true);
  const [analyticsError, setAnalyticsError] = React.useState<string>('');

  const fetchData = () => {
    setLoading(true);
    setError('');

    subscriptionApi
      .getAllSubscriptions(query)
      .then((res) => {
        if (res.success && res.data) {
          const subscriptions = Array.isArray(res.data) ? res.data : [];
          setItems(subscriptions);
          setTotal(res.pagination?.total || 0);
          setHasNext(res.pagination?.hasNext || false);
          setHasPrev(res.pagination?.hasPrev || false);
        } else {
          setError(res.message || t('admin.subscriptions.error.load_failed'));
          setItems([]);
          setTotal(0);
          setHasNext(false);
          setHasPrev(false);
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || t('admin.subscriptions.error.load_failed'));
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.limit, query.sortBy, query.sortOrder, query.status, query.search]);

  // Debounce search updates
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setQuery((q) => ({
        ...q,
        search: searchTerm.trim() || undefined,
        page: 1
      }));
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchAnalytics = React.useCallback(() => {
    setAnalyticsLoading(true);
    setAnalyticsError('');

    subscriptionApi
      .getSubscriptionAnalytics()
      .then((res) => {
        if (res.success && res.data) {
          setAnalytics(res.data);
        } else {
          setAnalytics(null);
          setAnalyticsError(res.message || t('admin.subscriptions.error.load_failed'));
        }
      })
      .catch((err) => {
        const message = err?.response?.data?.message || err?.message || t('admin.subscriptions.error.load_failed');
        setAnalytics(null);
        setAnalyticsError(message);
      })
      .finally(() => setAnalyticsLoading(false));
  }, [t]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatDate = (iso: string | undefined) => {
    if (!iso) return '-';
    const date = new Date(iso);
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    });
  };

  const statusBadge = (status?: string) => {
    if (status === 'ACTIVE')
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
          {t('admin.subscriptions.status.active')}
        </Badge>
      );
    if (status === 'CANCELLED')
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
          {t('admin.subscriptions.status.cancelled')}
        </Badge>
      );
    if (status === 'EXPIRED')
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
          {t('admin.subscriptions.status.expired')}
        </Badge>
      );
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
        {t('admin.subscriptions.status.unknown')}
      </Badge>
    );
  };

  const getOwnerName = (subscription: OwnerSubscription) => {
    if (typeof subscription.userId === 'object') {
      return subscription.userId?.fullName || subscription.userId?.username || subscription.userId?.email || '-';
    }
    return subscription.userId || '-';
  };

  const getPackageName = (subscription: OwnerSubscription) => {
    if (typeof subscription.packageId === 'object') {
      return subscription.packageId?.name || '-';
    }
    return subscription.packageId || '-';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.subscriptions.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('admin.subscriptions.description') || 'Manage all owner subscriptions'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            fetchData();
            fetchAnalytics();
          }}
          disabled={loading || analyticsLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading || analyticsLoading ? 'animate-spin' : ''}`} />
          {t('admin.subscriptions.button.refresh')}
        </Button>
      </div>

      {/* Subscription statistics */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {t('admin.subscriptions.analytics.title', 'Thống kê giao dịch')}
            </CardTitle>
            <CardDescription>
              {t('admin.subscriptions.analytics.subtitle', 'Tổng quan giao dịch gói đăng ký')}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white text-gray-700 border-gray-200">
            {analyticsLoading ? t('common.loading', 'Đang tải...') : t('admin.subscriptions.analytics.top', 'Cập nhật')}
          </Badge>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="p-4 rounded-xl border border-gray-100 bg-white animate-pulse space-y-3 shadow-sm"
                >
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-6 w-20 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : analyticsError ? (
            <Alert variant="destructive" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{analyticsError}</AlertDescription>
            </Alert>
          ) : (
            (() => {
              const summary = analytics?.summary || {
                totalSubscriptions: 0,
                totalRevenue: 0,
                status: { active: 0, cancelled: 0, expired: 0, unknown: 0 }
              };
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {t('admin.subscriptions.analytics.total', 'Tổng giao dịch')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">{summary.totalSubscriptions}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {t('admin.subscriptions.analytics.revenue', 'Tổng doanh thu')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(summary.totalRevenue || 0)}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('admin.subscriptions.status.active', 'ACTIVE')}</p>
                      <p className="text-lg font-semibold text-gray-900">{summary.status.active}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-50 text-red-600">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('admin.subscriptions.status.cancelled', 'CANCELLED')}</p>
                      <p className="text-lg font-semibold text-gray-900">{summary.status.cancelled}</p>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </CardContent>
      </Card>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <div>
              <CardTitle className="text-base">{t('admin.subscriptions.filters.title') || 'Filters'}</CardTitle>
              <CardDescription className="text-sm">
                {t('admin.subscriptions.filters.description') || 'Filter subscriptions'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label className="mb-2 block text-sm font-medium">
                {t('admin.subscriptions.filters.search', 'Search (owner, email, package)')}
              </Label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('admin.subscriptions.filters.search_placeholder', 'Type to search...')}
              />
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium">
                {t('admin.subscriptions.filter.status') || 'Status'}
              </Label>
              <Select
                value={query.status || 'all'}
                onValueChange={(value) =>
                  setQuery((q) => ({
                    ...q,
                    status: value === 'all' ? undefined : (value as GetSubscriptionsQuery['status']),
                    page: 1
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {query.status
                      ? t(`admin.subscriptions.filter.status_${query.status.toLowerCase()}`)
                      : t('admin.subscriptions.filter.status_all')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.subscriptions.filter.status_all')}</SelectItem>
                  <SelectItem value="ACTIVE">{t('admin.subscriptions.filter.status_active')}</SelectItem>
                  <SelectItem value="CANCELLED">{t('admin.subscriptions.filter.status_cancelled')}</SelectItem>
                  <SelectItem value="EXPIRED">{t('admin.subscriptions.filter.status_expired')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t('admin.subscriptions.table.title') || 'Subscriptions'}
            {total > 0 && (
              <Badge variant="secondary" className="ml-2">
                {total}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {t('admin.subscriptions.table.description') || 'View and manage all owner subscriptions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
              <p className="text-sm text-gray-600">{t('admin.subscriptions.loading') || 'Loading subscriptions...'}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('admin.subscriptions.table.empty_title') || 'No subscriptions found'}
              </h3>
              <p className="text-sm text-gray-500 max-w-md">
                {t('admin.subscriptions.table.empty') || 'There are no subscriptions matching your filters.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {t('admin.subscriptions.table.header.owner')}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          {t('admin.subscriptions.table.header.package')}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          {t('admin.subscriptions.table.header.price')}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {t('admin.subscriptions.table.header.start_date')}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {t('admin.subscriptions.table.header.end_date')}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">{t('admin.subscriptions.table.header.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((s) => (
                      <TableRow key={s._id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-orange-600" />
                            </div>
                            <span>{getOwnerName(s)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{getPackageName(s)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-700">{formatCurrency(s.amount || 0)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(s.startDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(s.endDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(s.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {total > 0 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {t('admin.subscriptions.pagination.showing') || 'Showing'}{' '}
                    <span className="font-semibold">
                      {(query.page || 1) * (query.limit || 10) - (query.limit || 10) + 1}
                    </span>{' '}
                    {t('admin.subscriptions.pagination.to') || 'to'}{' '}
                    <span className="font-semibold">{Math.min((query.page || 1) * (query.limit || 10), total)}</span>{' '}
                    {t('admin.subscriptions.pagination.of') || 'of'} <span className="font-semibold">{total}</span>{' '}
                    {t('admin.subscriptions.pagination.results') || 'results'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPrev || loading}
                      onClick={() => setQuery((q) => ({ ...q, page: Math.max((q.page || 1) - 1, 1) }))}
                      className="gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {t('admin.subscriptions.pagination.prev')}
                    </Button>
                    <div className="flex items-center gap-2 px-4">
                      <span className="text-sm font-medium text-gray-700">
                        {t('admin.subscriptions.pagination.page', {
                          current: query.page || 1,
                          total: Math.ceil(total / (query.limit || 10)) || 1
                        })}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasNext || loading}
                      onClick={() => setQuery((q) => ({ ...q, page: (q.page || 1) + 1 }))}
                      className="gap-2"
                    >
                      {t('admin.subscriptions.pagination.next')}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSubscriptionsPage;
