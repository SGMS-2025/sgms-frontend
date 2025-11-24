import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Calendar,
  User,
  Package,
  DollarSign,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import type { OwnerSubscription, GetSubscriptionsQuery } from '@/types/api/Subscription';

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
  const [total, setTotal] = React.useState<number>(0);
  const [hasNext, setHasNext] = React.useState<boolean>(false);
  const [hasPrev, setHasPrev] = React.useState<boolean>(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState<boolean>(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = React.useState<OwnerSubscription | null>(null);
  const [cancelReason, setCancelReason] = React.useState<string>('');
  const [cancelling, setCancelling] = React.useState<boolean>(false);

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
  }, [query.page, query.limit, query.sortBy, query.sortOrder, query.status]);

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

  const handleCancelClick = (subscription: OwnerSubscription) => {
    setSubscriptionToCancel(subscription);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!subscriptionToCancel) return;

    setCancelling(true);
    try {
      await subscriptionApi.cancelSubscriptionByAdmin(subscriptionToCancel._id, {
        reason: cancelReason || undefined
      });
      toast.success(t('admin.subscriptions.cancel_dialog.success_message') || 'Subscription cancelled successfully');
      setCancelDialogOpen(false);
      setSubscriptionToCancel(null);
      setCancelReason('');
      fetchData();
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        t('admin.subscriptions.error.cancel_failed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelDialogClose = () => {
    if (!cancelling) {
      setCancelDialogOpen(false);
      setSubscriptionToCancel(null);
      setCancelReason('');
    }
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
        <Button variant="outline" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.subscriptions.button.refresh')}
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t('admin.subscriptions.filters.title') || 'Filters'}
          </CardTitle>
          <CardDescription>
            {t('admin.subscriptions.filters.description') || 'Filter subscriptions by status'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
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
                      <TableHead className="font-semibold text-right">
                        {t('admin.subscriptions.table.header.actions')}
                      </TableHead>
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
                        <TableCell className="text-right">
                          {s.status === 'ACTIVE' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelClick(s)}
                              disabled={cancelling}
                              className="gap-2 hover:bg-red-700"
                            >
                              <X className="w-4 h-4" />
                              {t('admin.subscriptions.button.cancel')}
                            </Button>
                          )}
                          {s.status !== 'ACTIVE' && (
                            <span className="text-sm text-gray-400 italic">
                              {t('admin.subscriptions.table.no_action') || 'No action'}
                            </span>
                          )}
                        </TableCell>
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

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={handleCancelDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {t('admin.subscriptions.cancel_dialog.title') || 'Cancel Subscription'}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-2">
                  {t('admin.subscriptions.cancel_dialog.description', {
                    owner: subscriptionToCancel ? getOwnerName(subscriptionToCancel) : ''
                  }) || 'Are you sure you want to cancel this subscription? This action cannot be undone.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {subscriptionToCancel && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('admin.subscriptions.cancel_dialog.owner') || 'Owner'}:</span>
                <span className="font-medium text-gray-900">{getOwnerName(subscriptionToCancel)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('admin.subscriptions.cancel_dialog.package') || 'Package'}:</span>
                <span className="font-medium text-gray-900">{getPackageName(subscriptionToCancel)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('admin.subscriptions.cancel_dialog.amount') || 'Amount'}:</span>
                <span className="font-semibold text-green-700">{formatCurrency(subscriptionToCancel.amount || 0)}</span>
              </div>
            </div>
          )}

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason" className="text-sm font-medium">
                {t('admin.subscriptions.cancel_dialog.reason_label') || 'Cancellation Reason'}{' '}
                <span className="text-gray-500 font-normal">
                  ({t('admin.subscriptions.cancel_dialog.optional') || 'Optional'})
                </span>
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder={
                  t('admin.subscriptions.cancel_dialog.reason_placeholder') || 'Enter cancellation reason (optional)'
                }
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                maxLength={500}
                rows={4}
                disabled={cancelling}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {t('admin.subscriptions.cancel_dialog.warning') ||
                    'This action will immediately cancel the subscription and the owner will lose access to premium features.'}
                </p>
                <p className="text-xs text-gray-400">
                  {cancelReason.length}/500 {t('admin.subscriptions.cancel_dialog.characters') || 'characters'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDialogClose}
              disabled={cancelling}
              className="flex-1 sm:flex-none"
            >
              {t('admin.subscriptions.cancel_dialog.button_cancel') || 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelling}
              className="flex-1 sm:flex-none gap-2"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('admin.subscriptions.cancel_dialog.cancelling') || 'Cancelling...'}
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  {t('admin.subscriptions.cancel_dialog.button_confirm') || 'Confirm Cancel'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptionsPage;
