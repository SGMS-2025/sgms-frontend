import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  Award,
  User,
  BarChart3,
  Percent,
  Users,
  Eye,
  ArrowLeft,
  UserCheck
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/utils';
import { useKPIDetails } from '@/hooks/useKPI';
import {
  isKPIConfigPopulatedStaff,
  isKPIConfigPopulatedBranch,
  isPopulatedUser,
  type PopulatedUser,
  type KPINewCustomer,
  type KPIPTSession
} from '@/types/api/KPI';
import type { Staff } from '@/types/api/Staff';
import type { Branch } from '@/types/api/Branch';
import { kpiApi } from '@/services/api/kpiApi';

interface KPIDetailModalProps {
  kpiId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'detail' | 'newCustomers' | 'ptSessions';

export const KPIDetailModal: React.FC<KPIDetailModalProps> = ({ kpiId, isOpen, onClose }) => {
  const { t } = useTranslation();
  const { kpiConfig, achievement, loading, error } = useKPIDetails(kpiId);
  const [viewMode, setViewMode] = useState<ViewMode>('detail'); // ✅ View switching instead of nested modal
  const [newCustomers, setNewCustomers] = useState<KPINewCustomer[]>([]);
  const [ptSessions, setPtSessions] = useState<KPIPTSession[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingPTSessions, setLoadingPTSessions] = useState(false);

  // Reset view when modal closes
  useEffect(() => {
    if (!isOpen) {
      setViewMode('detail');
    }
  }, [isOpen]);

  // Load new customers when switching to newCustomers view
  useEffect(() => {
    if (viewMode === 'newCustomers' && kpiId && achievement && achievement.actual.members.newMembers > 0) {
      loadNewCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, kpiId, achievement]);

  // Load PT sessions when switching to ptSessions view
  useEffect(() => {
    if (viewMode === 'ptSessions' && kpiId && achievement && achievement.actual.sessions.ptSessions > 0) {
      loadPTSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, kpiId, achievement]);

  const loadNewCustomers = async () => {
    if (!kpiId) return;

    setLoadingCustomers(true);
    try {
      const response = await kpiApi.getNewCustomers(kpiId);
      if (response.success && response.data) {
        setNewCustomers(response.data);
      }
    } catch (err) {
      console.error('Failed to load new customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadPTSessions = async () => {
    if (!kpiId) return;

    setLoadingPTSessions(true);
    try {
      const response = await kpiApi.getPTSessions(kpiId);
      if (response.success && response.data) {
        setPtSessions(response.data);
      }
    } catch (err) {
      console.error('Failed to load PT sessions:', err);
    } finally {
      setLoadingPTSessions(false);
    }
  };

  if (!isOpen || !kpiId) return null;

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="ml-4 text-gray-600">{t('common.loading', 'Đang tải...')}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !kpiConfig) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="text-center py-10">
            <p className="text-red-600 mb-4">{error || t('kpi.detail.not_found', 'Không tìm thấy KPI')}</p>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              {t('common.close', 'Đóng')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Get staff name
  let staffName = 'N/A';
  if (kpiConfig.staffId) {
    if (isKPIConfigPopulatedStaff(kpiConfig.staffId)) {
      const staff = kpiConfig.staffId as Staff;
      // Check if userId is populated (object) or just an ID (string)
      if (isPopulatedUser(staff.userId)) {
        const user = staff.userId as PopulatedUser;
        staffName = user.fullName || user.username || 'N/A';
      } else {
        // userId is not populated or is just an ID
        staffName = 'N/A';
      }
    }
  } else {
    staffName = t('kpi.all_staff', 'Tất cả nhân viên');
  }

  // Get branch name
  let branchName = 'N/A';
  if (kpiConfig.branchId) {
    if (isKPIConfigPopulatedBranch(kpiConfig.branchId)) {
      const branch = kpiConfig.branchId as Branch;
      branchName = branch.branchName || 'N/A';
    }
  }

  // Get period
  const period = `${formatDate(kpiConfig.startDate)} - ${formatDate(kpiConfig.endDate)}`;

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { variant: 'default' as const, className: 'bg-green-100 text-green-800 hover:bg-green-100' };
      case 'CANCELLED':
        return { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 hover:bg-red-100' };
      default:
        return { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' };
    }
  };

  const statusBadgeConfig = getStatusBadge(kpiConfig.status);

  // No achievement rate (no targets)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)] pr-2 hide-scrollbar">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* ✅ Back button when in newCustomers or ptSessions view */}
                {(viewMode === 'newCustomers' || viewMode === 'ptSessions') && (
                  <button
                    onClick={() => setViewMode('detail')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">{t('common.back', 'Quay lại')}</span>
                  </button>
                )}

                <DialogTitle className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  {viewMode === 'newCustomers' && <Users className="w-6 h-6 text-green-500" />}
                  {viewMode === 'ptSessions' && <UserCheck className="w-6 h-6 text-orange-500" />}
                  {viewMode === 'newCustomers'
                    ? t('kpi.detail.new_customers_list', 'Danh Sách Khách Hàng Mới')
                    : viewMode === 'ptSessions'
                      ? t('kpi.detail.pt_sessions_list', 'Danh Sách Buổi PT')
                      : t('kpi.detail.title', 'Chi Tiết KPI')}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  {viewMode === 'newCustomers'
                    ? t('kpi.detail.new_customers_description', 'Danh sách khách hàng mới đã mua gói trong kỳ KPI này')
                    : viewMode === 'ptSessions'
                      ? t('kpi.detail.pt_sessions_description', 'Danh sách buổi PT đã thực hiện trong kỳ KPI này')
                      : t('kpi.detail.description', 'Thông tin chi tiết về KPI và thành tích')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator className="my-4" />

          {/* ✅ View switching based on viewMode */}
          {viewMode === 'detail' ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Staff Name */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">{t('kpi.table.staff_name', 'Nhân viên')}</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{staffName}</p>
                </div>

                {/* Branch */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">{t('kpi.table.branch', 'Chi nhánh')}</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{branchName}</p>
                </div>

                {/* Period */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">{t('kpi.table.period', 'Kỳ')}</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{period}</p>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">{t('kpi.table.status', 'Trạng thái')}</span>
                  </div>
                  <Badge variant={statusBadgeConfig.variant} className={statusBadgeConfig.className}>
                    {t(`kpi.status.${kpiConfig.status.toLowerCase()}`, kpiConfig.status)}
                  </Badge>
                </div>

                {/* Commission Rate */}
                {kpiConfig.commissionRate !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Percent className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {t('kpi.detail.commission_rate', 'Tỷ lệ hoa hồng')}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-orange-600">{kpiConfig.commissionRate}%</p>
                  </div>
                )}

                {/* Ranking */}
                {achievement?.rankings?.branch && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">{t('kpi.table.ranking', 'Xếp hạng')}</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">#{achievement.rankings.branch}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Targets vs Actual Table */}
              {(kpiConfig.targets || achievement) && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-orange-500" />
                      {t('kpi.detail.targets_vs_actual', 'Mục Tiêu vs Thực Tế')}
                    </h3>
                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-orange-600">
                              {t('kpi.table.targets', 'Mục tiêu')}
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-orange-600">
                              {t('kpi.table.actual', 'Thực tế')}
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-orange-600">
                              {t('kpi.table.commission', 'Hoa hồng')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {/* Revenue Row */}
                          {kpiConfig.targets?.revenue !== undefined && (
                            <tr className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className="font-medium">DT:</span> {formatCurrency(kpiConfig.targets.revenue)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className="font-medium">DT:</span>{' '}
                                {achievement ? formatCurrency(achievement.actual.revenue.total) : '0 ₫'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {achievement && achievement.commission.amount > 0
                                  ? formatCurrency(achievement.commission.amount)
                                  : '-'}
                              </td>
                            </tr>
                          )}

                          {/* PT Sessions Row */}
                          {kpiConfig.targets?.ptSessions !== undefined && (
                            <tr className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className="font-medium">PT:</span> {kpiConfig.targets.ptSessions}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className="font-medium">PT:</span>{' '}
                                {achievement ? achievement.actual.sessions.ptSessions : 0}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">-</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Achievements */}
              {achievement && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      {t('kpi.detail.achievements', 'Thành Tích')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          {t('kpi.detail.actual_revenue', 'Doanh thu thực tế')}
                        </p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(achievement.actual.revenue.total)}
                        </p>
                      </div>
                      <div
                        className="bg-green-50 p-4 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                        onClick={() => {
                          if (achievement.actual.members.newMembers > 0) {
                            setViewMode('newCustomers'); // ✅ Switch view instead of opening modal
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              {t('kpi.detail.actual_new_members', 'Khách hàng mới')}
                            </p>
                            <p className="text-xl font-bold text-green-600">{achievement.actual.members.newMembers}</p>
                          </div>
                          {achievement.actual.members.newMembers > 0 && <Eye className="w-5 h-5 text-green-600" />}
                        </div>
                      </div>
                      <div
                        className="bg-orange-50 p-4 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                        onClick={() => {
                          if (achievement.actual.sessions.ptSessions > 0) {
                            setViewMode('ptSessions'); // ✅ Switch view instead of opening modal
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              {t('kpi.detail.actual_pt_sessions', 'Buổi PT')}
                            </p>
                            <p className="text-xl font-bold text-orange-600">
                              {achievement.actual.sessions.ptSessions}
                            </p>
                          </div>
                          {achievement.actual.sessions.ptSessions > 0 && <Eye className="w-5 h-5 text-orange-600" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Earnings */}
              {achievement && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      {t('kpi.detail.earnings', 'Thu Nhập')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">{t('kpi.detail.commission', 'Hoa hồng')}</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(achievement.commission.amount)}
                        </p>
                        {achievement.commission.applicableRate && achievement.commission.applicableRate > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {t('kpi.detail.rate', 'Tỷ lệ')}: {achievement.commission.applicableRate.toFixed(1)}%
                          </p>
                        )}
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">{t('kpi.detail.reward', 'Thưởng')}</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {(() => {
                            // If qualified, show reward from achievement
                            if (achievement.reward.qualified && achievement.reward.type !== 'NONE') {
                              if (achievement.reward.type === 'PERCENTAGE_BONUS') {
                                return `${achievement.reward.percentage}%`;
                              }
                              if (achievement.reward.type === 'FIXED_AMOUNT') {
                                return formatCurrency(achievement.reward.amount);
                              }
                              return achievement.reward.voucherDetails || '-';
                            }

                            // If not qualified, show reward from config (potential reward)
                            const configReward = kpiConfig.reward;
                            if (configReward && configReward.type && configReward.type !== 'NONE') {
                              if (configReward.type === 'PERCENTAGE_BONUS') {
                                return `${configReward.percentage || 0}%`;
                              }
                              if (configReward.type === 'FIXED_AMOUNT') {
                                return formatCurrency(configReward.amount || 0);
                              }
                              return configReward.voucherDetails || '-';
                            }

                            return '-';
                          })()}
                        </p>
                        {(() => {
                          // Show reward type if qualified
                          if (achievement.reward.qualified && achievement.reward.type !== 'NONE') {
                            return (
                              <p className="text-xs text-gray-500 mt-1">
                                {t('kpi.detail.reward_type', 'Loại')}:{' '}
                                {t(`kpi.reward_type.${achievement.reward.type.toLowerCase()}`, achievement.reward.type)}
                              </p>
                            );
                          }

                          // Show "if complete all targets" if not qualified but has reward config
                          const configReward = kpiConfig.reward;
                          if (configReward && configReward.type && configReward.type !== 'NONE') {
                            return (
                              <p className="text-xs text-gray-500 mt-1">
                                {t('kpi.detail.reward_if_complete', 'nếu hoàn thành toàn bộ target')}
                              </p>
                            );
                          }

                          return null;
                        })()}
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">{t('kpi.detail.total_earnings', 'Tổng thu nhập')}</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(
                            achievement.commission.amount +
                              (achievement.reward.qualified && achievement.reward.type === 'FIXED_AMOUNT'
                                ? achievement.reward.amount
                                : 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {kpiConfig.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">{t('kpi.detail.notes', 'Ghi chú')}</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{kpiConfig.notes}</p>
                  </div>
                </>
              )}

              {!achievement && (
                <>
                  <Separator />
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      {t(
                        'kpi.detail.no_achievement',
                        'Chưa có dữ liệu thành tích. KPI sẽ được tính toán tự động khi có giao dịch.'
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : viewMode === 'newCustomers' ? (
            /* ✅ New Customers View */
            <div className="space-y-4">
              {loadingCustomers ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="ml-4 text-gray-600">{t('common.loading', 'Đang tải...')}</p>
                </div>
              ) : newCustomers.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{t('kpi.detail.no_new_customers', 'Không có khách hàng mới')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(90vh-12rem)] overflow-y-auto pr-2">
                  {/* ✅ Show all customers with scroll */}
                  {newCustomers.map((customer, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-blue-50 rounded-full">
                              <User className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-lg">{customer.customerName}</h4>
                              <Badge variant="outline" className="text-xs mt-1">
                                {customer.packageType}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600 ml-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <p>
                                <span className="font-medium text-gray-700">
                                  {t('kpi.detail.customer.package', 'Gói')}:
                                </span>{' '}
                                <span className="text-gray-900">{customer.packageName}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">
                                  {t('kpi.detail.customer.value', 'Giá trị')}:
                                </span>{' '}
                                <span className="text-orange-600 font-semibold">{formatCurrency(customer.amount)}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">
                                  {t('kpi.detail.customer.email', 'Email')}:
                                </span>{' '}
                                <span className="text-gray-900">{customer.customerEmail}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">
                                  {t('kpi.detail.customer.phone', 'SĐT')}:
                                </span>{' '}
                                <span className="text-gray-900">{customer.customerPhone}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">
                                  {t('kpi.detail.customer.purchase_date', 'Ngày mua')}:
                                </span>{' '}
                                <span className="text-gray-900">{formatDate(customer.transactionDate)}</span>
                              </p>
                              {customer.contractStartDate && (
                                <p>
                                  <span className="font-medium text-gray-700">
                                    {t('kpi.detail.customer.start_date', 'Ngày bắt đầu')}:
                                  </span>{' '}
                                  <span className="text-gray-900">{formatDate(customer.contractStartDate)}</span>
                                </p>
                              )}
                              {customer.contractEndDate && (
                                <p>
                                  <span className="font-medium text-gray-700">
                                    {t('kpi.detail.customer.end_date', 'Ngày hết hạn')}:
                                  </span>{' '}
                                  <span className="text-gray-900">{formatDate(customer.contractEndDate)}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : viewMode === 'ptSessions' ? (
            /* ✅ PT Sessions View */
            <div className="space-y-4">
              {loadingPTSessions ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="ml-4 text-gray-600">{t('common.loading', 'Đang tải...')}</p>
                </div>
              ) : ptSessions.length === 0 ? (
                <div className="text-center py-10">
                  <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{t('kpi.detail.no_pt_sessions', 'Không có buổi PT')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(90vh-12rem)] overflow-y-auto pr-2">
                  {/* ✅ Show all PT sessions with scroll */}
                  {ptSessions.map((session, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-50 rounded-full">
                              <User className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-lg">{session.customerName}</h4>
                              <Badge variant="outline" className="text-xs mt-1">
                                {session.packageType}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600 ml-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <p>
                                <span className="font-medium text-gray-700">
                                  {t('kpi.detail.pt_session.pt', 'PT')}:
                                </span>{' '}
                                <span className="text-orange-600 font-semibold">{session.ptName}</span>
                                {session.ptJobTitle && (
                                  <span className="text-gray-500 ml-1">({session.ptJobTitle})</span>
                                )}
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">
                                  {t('kpi.detail.pt_session.package', 'Gói')}:
                                </span>{' '}
                                <span className="text-gray-900">{session.packageName}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">
                                  {t('kpi.detail.pt_session.value', 'Giá trị')}:
                                </span>{' '}
                                <span className="text-orange-600 font-semibold">{formatCurrency(session.amount)}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">
                                  {t('kpi.detail.pt_session.execution_date', 'Ngày thực hiện')}:
                                </span>{' '}
                                <span className="text-gray-900">{formatDate(session.transactionDate)}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">
                                  {t('kpi.detail.pt_session.customer_email', 'Email KH')}:
                                </span>{' '}
                                <span className="text-gray-900">{session.customerEmail}</span>
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">
                                  {t('kpi.detail.pt_session.customer_phone', 'SĐT KH')}:
                                </span>{' '}
                                <span className="text-gray-900">{session.customerPhone}</span>
                              </p>
                              {session.contractStartDate && (
                                <p>
                                  <span className="font-medium text-gray-700">
                                    {t('kpi.detail.pt_session.start_date', 'Ngày bắt đầu')}:
                                  </span>{' '}
                                  <span className="text-gray-900">{formatDate(session.contractStartDate)}</span>
                                </p>
                              )}
                              {session.contractEndDate && (
                                <p>
                                  <span className="font-medium text-gray-700">
                                    {t('kpi.detail.pt_session.end_date', 'Ngày hết hạn')}:
                                  </span>{' '}
                                  <span className="text-gray-900">{formatDate(session.contractEndDate)}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
