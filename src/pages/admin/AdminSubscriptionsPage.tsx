import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

  const fetchData = () => {
    setLoading(true);
    setError('');

    subscriptionApi
      .getAllSubscriptions(query)
      .then((res) => {
        if (res.success && res.data) {
          // sendPaginated returns data as array directly, pagination at root level
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
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchData();
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

  const statusBadge = (status?: string) => {
    if (status === 'ACTIVE') return <Badge>{t('admin.subscriptions.status.active')}</Badge>;
    if (status === 'CANCELLED') return <Badge variant="destructive">{t('admin.subscriptions.status.cancelled')}</Badge>;
    if (status === 'EXPIRED') return <Badge variant="secondary">{t('admin.subscriptions.status.expired')}</Badge>;
    return <Badge variant="secondary">{t('admin.subscriptions.status.unknown')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('admin.subscriptions.title')}</CardTitle>
          <div className="flex gap-2">
            <select
              className="h-10 border rounded-md px-3"
              value={query.status || ''}
              onChange={(e) =>
                setQuery((q) => ({
                  ...q,
                  status: (e.target.value || undefined) as GetSubscriptionsQuery['status'],
                  page: 1
                }))
              }
            >
              <option value="">{t('admin.subscriptions.filter.status_all')}</option>
              <option value="ACTIVE">{t('admin.subscriptions.filter.status_active')}</option>
              <option value="CANCELLED">{t('admin.subscriptions.filter.status_cancelled')}</option>
              <option value="EXPIRED">{t('admin.subscriptions.filter.status_expired')}</option>
            </select>
            <Button variant="outline" onClick={fetchData}>
              {t('admin.subscriptions.button.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}
          {loading ? (
            <div className="text-sm text-gray-600">{t('admin.subscriptions.loading')}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.subscriptions.table.header.owner')}</TableHead>
                    <TableHead>{t('admin.subscriptions.table.header.package')}</TableHead>
                    <TableHead>{t('admin.subscriptions.table.header.price')}</TableHead>
                    <TableHead>{t('admin.subscriptions.table.header.start_date')}</TableHead>
                    <TableHead>{t('admin.subscriptions.table.header.end_date')}</TableHead>
                    <TableHead>{t('admin.subscriptions.table.header.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        {t('admin.subscriptions.table.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell>
                          {typeof s.userId === 'object' ? s.userId?.fullName || s.userId?.username : s.userId}
                        </TableCell>
                        <TableCell>{typeof s.packageId === 'object' ? s.packageId?.name : s.packageId}</TableCell>
                        <TableCell>
                          {(s.amount || 0).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}{' '}
                          {t('admin.subscriptions.currency')}
                        </TableCell>
                        <TableCell>{formatDate(s.startDate)}</TableCell>
                        <TableCell>{formatDate(s.endDate)}</TableCell>
                        <TableCell>{statusBadge(s.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <div>{t('admin.subscriptions.pagination.total', { total })}</div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrev}
                    onClick={() => setQuery((q) => ({ ...q, page: Math.max((q.page || 1) - 1, 1) }))}
                  >
                    {t('admin.subscriptions.pagination.prev')}
                  </Button>
                  <span>
                    {t('admin.subscriptions.pagination.page', {
                      current: query.page || 1,
                      total: Math.ceil(total / (query.limit || 10)) || 1
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNext}
                    onClick={() => setQuery((q) => ({ ...q, page: (q.page || 1) + 1 }))}
                  >
                    {t('admin.subscriptions.pagination.next')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSubscriptionsPage;
