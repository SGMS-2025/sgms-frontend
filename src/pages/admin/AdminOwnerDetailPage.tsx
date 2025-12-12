import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Building2, MapPin, Users, Phone, Mail, Calendar, Package, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { userApi } from '@/services/api/userApi';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import type { OwnerSubscription } from '@/types/api/Subscription';
import type { User } from '@/types/api/User';
import { format } from 'date-fns';

interface OwnerBranch {
  _id: string;
  branchName: string;
  location?: string;
  description?: string;
  isActive: boolean;
  ownerId: string;
  managerId?:
    | Array<{
        _id: string;
        fullName?: string;
        email?: string;
      }>
    | string[];
  createdAt: string;
  updatedAt: string;
}

const AdminOwnerDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [owner, setOwner] = useState<User | null>(null);
  const [branches, setBranches] = useState<OwnerBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<OwnerSubscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const statusLabels: Record<string, string> = {
    ACTIVE: t('common.status.active'),
    INACTIVE: t('common.status.inactive'),
    SUSPENDED: t('common.status.suspended'),
    DELETED: t('common.status.deleted')
  };

  useEffect(() => {
    if (userId) {
      fetchOwnerDetail();
      fetchOwnerSubscriptions();
    }
  }, [userId]);

  const fetchOwnerDetail = async () => {
    if (!userId) return;

    setLoading(true);
    const result = await userApi.getOwnerDetail(userId);

    if (result.success && result.data) {
      setOwner(result.data.owner);
      setBranches(result.data.branches || []);
    } else {
      const errorMessage = result.message || t('admin.owner_detail.toast.fetchError');
      toast.error(errorMessage);
      console.error('Owner detail error:', result);
      navigate('/admin/accounts');
    }

    setLoading(false);
  };

  const fetchOwnerSubscriptions = async () => {
    if (!userId) return;
    setSubsLoading(true);
    try {
      const res = await subscriptionApi.getAllSubscriptions({
        ownerId: userId,
        limit: 20,
        sortBy: 'startDate',
        sortOrder: 'desc'
      });
      if (res.success && res.data) {
        const subs = Array.isArray(res.data) ? res.data : [];
        setSubscriptions(subs);
      } else {
        setSubscriptions([]);
      }
    } catch (error) {
      console.error('Failed to load owner subscriptions', error);
      setSubscriptions([]);
    } finally {
      setSubsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 hover:bg-green-200',
      INACTIVE: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      SUSPENDED: 'bg-red-100 text-red-800 hover:bg-red-200',
      DELETED: 'bg-gray-200 text-gray-600 hover:bg-gray-300'
    };

    return (
      <Badge className={colors[status] || colors.INACTIVE} variant="outline">
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const handleCancelSubscription = async (subId: string) => {
    if (cancelling) return;
    const confirm = window.confirm(t('admin.owner_detail.subscriptions.confirm_cancel', 'Hủy gói hiện tại?'));
    if (!confirm) return;
    setCancelling(true);
    try {
      await subscriptionApi.cancelSubscriptionByAdmin(subId);
      toast.success(t('admin.owner_detail.subscriptions.cancel_success', 'Đã hủy gói đăng ký'));
      fetchOwnerSubscriptions();
    } catch (error) {
      const msg =
        (error as { message?: string })?.message ||
        t('admin.owner_detail.subscriptions.cancel_error', 'Hủy gói thất bại');
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.owner_detail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => navigate('/admin/accounts')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('admin.owner_detail.backButton')}
        </Button>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-gray-500">
              <p>{t('admin.owner_detail.empty')}</p>
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
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/accounts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.actions.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.owner_detail.title')}</h1>
            <p className="text-gray-500 mt-1">{t('admin.owner_detail.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.owner_detail.info.title')}</CardTitle>
          <CardDescription>{t('admin.owner_detail.info.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              {owner.avatar?.url ? (
                <img
                  src={owner.avatar.url}
                  alt={owner.fullName || owner.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-gray-500" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold">{owner.fullName || owner.username}</h3>
                <p className="text-gray-500">@{owner.username}</p>
                {getStatusBadge(owner.status)}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{owner.email}</span>
              </div>
              {owner.phoneNumber && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{owner.phoneNumber}</span>
                </div>
              )}
              {owner.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{owner.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {t('admin.owner_detail.info.joined', {
                    date: format(new Date(owner.createdAt), 'MMM dd, yyyy')
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branches List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t('admin.owner_detail.branches.title', { count: branches.length })}
          </CardTitle>
          <CardDescription>{t('admin.owner_detail.branches.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>{t('admin.owner_detail.branches.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.owner_detail.branches.columns.name')}</TableHead>
                    <TableHead>{t('admin.owner_detail.branches.columns.location')}</TableHead>
                    <TableHead>{t('admin.owner_detail.branches.columns.status')}</TableHead>
                    <TableHead>{t('admin.owner_detail.branches.columns.created')}</TableHead>
                    <TableHead className="text-right">{t('admin.owner_detail.branches.columns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch._id}>
                      <TableCell className="font-medium">{branch.branchName}</TableCell>
                      <TableCell>{branch.location || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          className={branch.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          variant="outline"
                        >
                          {branch.isActive ? t('common.status.active') : t('common.status.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(branch.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/branches/${branch._id}/customers`)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          {t('admin.owner_detail.actions.viewCustomers')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t('admin.owner_detail.subscriptions.title', 'Giao dịch gói đăng ký')}
          </CardTitle>
          <CardDescription>
            {t('admin.owner_detail.subscriptions.description', 'Lịch sử và gói hiện tại')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subsLoading ? (
            <div className="text-center py-6 text-gray-500">{t('common.loading', 'Đang tải...')}</div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              {t('admin.owner_detail.subscriptions.empty', 'Chưa có giao dịch')}
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const activeSub = subscriptions.find((s) => s.status === 'ACTIVE');
                if (!activeSub) return null;
                return (
                  <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/80 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {t('admin.owner_detail.subscriptions.current', 'Gói hiện tại')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {typeof activeSub.packageId === 'object' ? activeSub.packageId?.name : activeSub.packageId}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('admin.owner_detail.subscriptions.period', 'Hiệu lực')}:{' '}
                        {activeSub.startDate
                          ? new Date(activeSub.startDate).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')
                          : '-'}{' '}
                        -{' '}
                        {activeSub.endDate
                          ? new Date(activeSub.endDate).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')
                          : '-'}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleCancelSubscription(activeSub._id)}
                      disabled={cancelling}
                    >
                      <XCircle className="w-4 h-4" />
                      {cancelling
                        ? t('admin.owner_detail.subscriptions.cancelling', 'Đang hủy...')
                        : t('admin.owner_detail.subscriptions.cancel', 'Hủy gói')}
                    </Button>
                  </div>
                );
              })()}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.owner_detail.subscriptions.package', 'Gói')}</TableHead>
                      <TableHead>{t('admin.owner_detail.subscriptions.amount', 'Giá')}</TableHead>
                      <TableHead>{t('admin.owner_detail.subscriptions.start', 'Bắt đầu')}</TableHead>
                      <TableHead>{t('admin.owner_detail.subscriptions.end', 'Kết thúc')}</TableHead>
                      <TableHead>{t('admin.owner_detail.subscriptions.status', 'Trạng thái')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub._id}>
                        <TableCell className="font-medium">
                          {typeof sub.packageId === 'object' ? sub.packageId?.name : sub.packageId}
                        </TableCell>
                        <TableCell>{sub.amount?.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</TableCell>
                        <TableCell>
                          {sub.startDate
                            ? new Date(sub.startDate).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {sub.endDate
                            ? new Date(sub.endDate).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              sub.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : sub.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                            }
                            variant="outline"
                          >
                            {sub.status === 'ACTIVE'
                              ? t('admin.subscriptions.status.active', 'ACTIVE')
                              : sub.status === 'CANCELLED'
                                ? t('admin.subscriptions.status.cancelled', 'CANCELLED')
                                : sub.status === 'EXPIRED'
                                  ? t('admin.subscriptions.status.expired', 'EXPIRED')
                                  : sub.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOwnerDetailPage;
