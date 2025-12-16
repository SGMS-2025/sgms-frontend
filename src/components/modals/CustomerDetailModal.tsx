import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  FileText,
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  Building,
  UserCheck,
  Star,
  Award,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { CustomerDetailModalProps } from '@/types/api/Customer';
import { useBranch } from '@/contexts/BranchContext';

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ isOpen, onClose, customer }) => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();

  if (!customer) return null;

  // Get membership dates from contract if available
  const membershipContract = customer.latestMembershipContract;
  const membershipJoinDate = membershipContract?.startDate || customer.joinDate;
  const membershipExpiryDate = membershipContract?.endDate || customer.expiryDate;
  const membershipPackageStatus = membershipContract?.status;
  const membershipPaymentStatus = membershipContract?.paymentStatus;

  // Format currency
  const formatCurrency = (value: string | number): string => {
    if (!value || value === '') return '0';
    const numValue = parseInt(String(value).replace(/[^\d]/g, ''), 10);
    return numValue.toLocaleString('vi-VN');
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'destructive';
      case 'SUSPENDED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return t('customer_modal.status_active');
      case 'INACTIVE':
        return t('customer_modal.status_inactive');
      case 'SUSPENDED':
        return t('customer_modal.status_suspended');
      default:
        return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="bg-orange-500 text-white rounded-t-lg -m-6 mb-0 p-6">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('customer_detail.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6">
          {/* Left Column - Basic Information */}
          <div className="xl:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-4 border-orange-200">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 mt-4">{customer.name}</CardTitle>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={getStatusBadgeVariant(customer.status)}>{getStatusText(customer.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {t('customer_detail.contact_info')}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-orange-500" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 text-orange-500" />
                      <span>{customer.email}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Membership Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    {t('customer_detail.membership_info')}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span>
                        {t('customer_detail.join_date')}: {membershipJoinDate || t('customer_detail.not_available')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard className="w-4 h-4 text-orange-500" />
                      <span>
                        {t('customer_detail.membership_plan')}:{' '}
                        {customer.membershipType || t('customer_detail.not_available')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span>
                        {t('customer_detail.expiry_date')}: {membershipExpiryDate || t('customer_detail.not_available')}
                      </span>
                    </div>
                    {/* Membership package status + payment status */}
                    <div className="flex flex-col gap-1 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-orange-500" />
                        <span>
                          {t('customer_detail.package_status', { defaultValue: 'Trạng thái gói' })}:{' '}
                          {membershipPackageStatus || t('customer_detail.unknown_status')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span>
                          {t('customer_detail.payment_status', { defaultValue: 'Trạng thái thanh toán' })}:{' '}
                          {membershipPaymentStatus || t('customer_detail.unknown_status')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Branch Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {t('customer_detail.branch_info')}
                  </h4>
                  <div className="space-y-2 text-sm">
                    {currentBranch ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span>{currentBranch.branchName}</span>
                      </div>
                    ) : customer.branches && customer.branches.length > 0 ? (
                      customer.branches.map((branch) => (
                        <div key={branch.branchName} className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <span>{branch.branchName}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{t('customer_detail.no_branch_info')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="xl:col-span-2 space-y-6">
            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  {t('customer_detail.service_info')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Service Package */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700">{t('customer_detail.service_package')}</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">
                          {customer.serviceName || t('customer_detail.no_service_package')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Membership Plan */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700">{t('customer_detail.membership_plan_detail')}</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">
                          {customer.membershipType || t('customer_detail.no_membership_plan')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contract Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700">{t('customer_detail.contract_info')}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="w-4 h-4 text-orange-500" />
                        <span>
                          {t('customer_detail.start_date')}:{' '}
                          {customer.contractStartDate || t('customer_detail.not_available')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span>
                          {t('customer_detail.end_date')}:{' '}
                          {customer.contractEndDate || t('customer_detail.not_available')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Referrer Staff */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700">{t('customer_detail.referrer_staff')}</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">
                          {customer.referrerStaffName || t('customer_detail.no_referrer')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Created By Staff */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700">
                      {t('customer_detail.created_by_staff', { defaultValue: 'Nhân viên tạo hợp đồng' })}
                    </h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">
                          {customer.createdByStaffName ||
                            t('customer_detail.no_created_by', { defaultValue: 'Không có thông tin' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t('customer_detail.financial_info')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Spent */}
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-700">{t('customer_detail.total_spent')}</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(customer.totalSpent || '0')} VNĐ
                    </div>
                  </div>

                  {/* Last Payment */}
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-700">{t('customer_detail.last_payment')}</span>
                    </div>
                    <div className="text-sm text-blue-600">
                      {customer.lastPaymentDate || t('customer_detail.not_available')}
                    </div>
                  </div>

                  {/* Membership Status */}
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-orange-700">{t('customer_detail.membership_status')}</span>
                    </div>
                    <div className="text-sm text-orange-600">
                      {customer.membershipStatus || t('customer_detail.unknown_status')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('customer_detail.additional_info')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Creation Date */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700">{t('customer_detail.account_creation_date')}</h4>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span>{customer.createdAt || t('customer_detail.not_available')}</span>
                    </div>
                  </div>

                  {/* Customer ID */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700">{t('customer_detail.customer_id')}</h4>
                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard className="w-4 h-4 text-orange-500" />
                      <span className="font-mono text-sm">{customer.id}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-lg -m-6 mt-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-gray-500 text-white hover:bg-gray-600 border-gray-500"
          >
            {t('customer_detail.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
