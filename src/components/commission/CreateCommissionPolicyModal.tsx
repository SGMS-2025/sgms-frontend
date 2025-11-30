import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateCommissionPolicy, useUpdateCommissionPolicy } from '@/hooks/useCommissionPolicy';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';
import { packageApi } from '@/services/api/packageApi';
import { membershipApi } from '@/services/api/membershipApi';
import { commissionPolicyApi, type CreateBulkCommissionPolicyRequest } from '@/services/api/commissionPolicyApi';
import type { CommissionPolicy, CreateCommissionPolicyRequest } from '@/types/api/CommissionPolicy';
import type { ServicePackage } from '@/types/api/Package';
import type { MembershipPlan } from '@/types/api/Membership';

interface CreateCommissionPolicyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingPolicy?: CommissionPolicy | null;
}

export const CreateCommissionPolicyModal: React.FC<CreateCommissionPolicyModalProps> = ({
  open,
  onClose,
  onSuccess,
  editingPolicy
}) => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const {
    createPolicy,
    loading: createLoading,
    error: createError,
    resetError: resetCreateError
  } = useCreateCommissionPolicy();
  const {
    updatePolicy,
    loading: updateLoading,
    error: updateError,
    resetError: resetUpdateError
  } = useUpdateCommissionPolicy();

  const isEditMode = !!editingPolicy;
  const loading = createLoading || updateLoading;
  const error = createError || updateError;

  const [formData, setFormData] = useState({
    scope: 'PACKAGE' as CreateCommissionPolicyRequest['scope'],
    branchId: '',
    roleType: '',
    servicePackageId: '',
    membershipPlanId: '',
    commissionRate: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [loadingMembershipPlans, setLoadingMembershipPlans] = useState(false);
  const [packageType, setPackageType] = useState<'service' | 'membership'>('service');
  const [isMultipleSelect, setIsMultipleSelect] = useState(false);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [selectedMembershipPlanIds, setSelectedMembershipPlanIds] = useState<string[]>([]);

  // Fetch packages and membership plans when scope is PACKAGE
  useEffect(() => {
    if (!open || formData.scope !== 'PACKAGE') {
      return;
    }

    const fetchData = async () => {
      // Fetch service packages
      setLoadingPackages(true);
      try {
        const response = await packageApi.getPackages({ status: 'ACTIVE', limit: 100 });
        if (response.success && response.data?.packages) {
          setPackages(response.data.packages);
        }
      } catch (err) {
        console.error('Failed to fetch packages:', err);
      } finally {
        setLoadingPackages(false);
      }

      // Fetch membership plans
      if (currentBranch?._id) {
        setLoadingMembershipPlans(true);
        try {
          const response = await membershipApi.getMembershipPlans({ status: 'ACTIVE', limit: 100 }, [
            currentBranch._id
          ]);
          if (response.success && response.data?.plans) {
            setMembershipPlans(response.data.plans);
          }
        } catch (err) {
          console.error('Failed to fetch membership plans:', err);
        } finally {
          setLoadingMembershipPlans(false);
        }
      }
    };

    fetchData();
  }, [open, formData.scope, currentBranch?._id]);

  // Initialize form data
  useEffect(() => {
    if (!open) return;

    if (isEditMode && editingPolicy) {
      const servicePackageId =
        typeof editingPolicy.servicePackageId === 'string'
          ? editingPolicy.servicePackageId
          : editingPolicy.servicePackageId?._id || '';
      const membershipPlanId =
        typeof editingPolicy.membershipPlanId === 'string'
          ? editingPolicy.membershipPlanId
          : editingPolicy.membershipPlanId?._id || '';

      setFormData({
        scope: editingPolicy.scope,
        branchId:
          typeof editingPolicy.branchId === 'string' ? editingPolicy.branchId : editingPolicy.branchId?._id || '',
        roleType: editingPolicy.roleType || '',
        servicePackageId,
        membershipPlanId,
        commissionRate: editingPolicy.commissionRate.toString(),
        notes: editingPolicy.notes || ''
      });

      // Set package type based on which one is selected
      if (servicePackageId) {
        setPackageType('service');
      } else if (membershipPlanId) {
        setPackageType('membership');
      }
    } else {
      setFormData({
        scope: 'PACKAGE',
        branchId: currentBranch?._id || '',
        roleType: '',
        servicePackageId: '',
        membershipPlanId: '',
        commissionRate: '',
        notes: ''
      });
      setPackageType('service');
      setIsMultipleSelect(false);
      setSelectedPackageIds([]);
      setSelectedMembershipPlanIds([]);
    }

    setErrors({});
    resetCreateError();
    resetUpdateError();
  }, [open, isEditMode, editingPolicy, currentBranch, resetCreateError, resetUpdateError]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.scope === 'BRANCH' && !formData.branchId) {
      newErrors.branchId = t('commission.form.branch_required', 'Vui lòng chọn chi nhánh');
    }

    if (formData.scope === 'ROLE' && !formData.roleType) {
      newErrors.roleType = t('commission.form.role_required', 'Vui lòng chọn vai trò');
    }

    if (formData.scope === 'PACKAGE') {
      if (isMultipleSelect) {
        if (packageType === 'service' && selectedPackageIds.length === 0) {
          newErrors.package = t('commission.form.package_required', 'Vui lòng chọn ít nhất một gói dịch vụ');
        } else if (packageType === 'membership' && selectedMembershipPlanIds.length === 0) {
          newErrors.package = t('commission.form.membership_required', 'Vui lòng chọn ít nhất một gói membership');
        }
      } else {
        if (!formData.servicePackageId && !formData.membershipPlanId) {
          newErrors.package = t('commission.form.package_required', 'Vui lòng chọn gói dịch vụ hoặc gói membership');
        }
      }
    }

    if (!formData.commissionRate) {
      newErrors.commissionRate = t('commission.form.rate_required', 'Vui lòng nhập tỷ lệ hoa hồng');
    } else {
      const rate = Number.parseFloat(formData.commissionRate);
      if (Number.isNaN(rate) || rate < 0 || rate > 100) {
        newErrors.commissionRate = t('commission.form.rate_invalid', 'Tỷ lệ hoa hồng phải từ 0 đến 100');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode && editingPolicy) {
        await updatePolicy(editingPolicy._id, {
          commissionRate: Number.parseFloat(formData.commissionRate),
          notes: formData.notes || undefined
        });

        toast.success(t('commission.update_success', 'Cập nhật chính sách hoa hồng thành công'));
        onSuccess?.();
        onClose();
      } else {
        // Check if bulk create is needed
        const shouldBulkCreate =
          formData.scope === 'PACKAGE' &&
          isMultipleSelect &&
          ((packageType === 'service' && selectedPackageIds.length > 1) ||
            (packageType === 'membership' && selectedMembershipPlanIds.length > 1));

        if (shouldBulkCreate) {
          // Bulk create
          const bulkData: CreateBulkCommissionPolicyRequest = {
            scope: formData.scope,
            commissionRate: Number.parseFloat(formData.commissionRate),
            notes: formData.notes || undefined
          };

          if (formData.branchId) {
            bulkData.branchId = formData.branchId;
          }

          if (formData.roleType) {
            bulkData.roleType = formData.roleType;
          }

          if (packageType === 'service' && selectedPackageIds.length > 0) {
            bulkData.servicePackageIds = selectedPackageIds;
          }

          if (packageType === 'membership' && selectedMembershipPlanIds.length > 0) {
            bulkData.membershipPlanIds = selectedMembershipPlanIds;
          }

          const response = await commissionPolicyApi.createBulkPolicies(bulkData);

          if (response.success) {
            const count = response.data?.length || 0;
            toast.success(t('commission.bulk_create_success', { count }));
            onSuccess?.();
            onClose();
          } else {
            throw new Error(response.message || 'Failed to create bulk policies');
          }
        } else {
          // Single create
          const policyData: CreateCommissionPolicyRequest = {
            scope: formData.scope,
            commissionRate: Number.parseFloat(formData.commissionRate),
            notes: formData.notes || undefined
          };

          if (formData.scope === 'BRANCH' && formData.branchId) {
            policyData.branchId = formData.branchId;
          }

          if (formData.scope === 'ROLE' && formData.roleType) {
            policyData.roleType = formData.roleType;
          }

          if (formData.scope === 'PACKAGE') {
            if (isMultipleSelect) {
              // Use first selected if multiple select mode but only one selected
              if (packageType === 'service' && selectedPackageIds.length > 0) {
                policyData.servicePackageId = selectedPackageIds[0];
              } else if (packageType === 'membership' && selectedMembershipPlanIds.length > 0) {
                policyData.membershipPlanId = selectedMembershipPlanIds[0];
              }
            } else {
              if (formData.servicePackageId) {
                policyData.servicePackageId = formData.servicePackageId;
              }
              if (formData.membershipPlanId) {
                policyData.membershipPlanId = formData.membershipPlanId;
              }
            }
          }

          await createPolicy(policyData);

          toast.success(t('commission.create_success', 'Tạo chính sách hoa hồng thành công'));
          onSuccess?.();
          onClose();
        }
      }
    } catch (submitError: unknown) {
      let errorMessage =
        error ||
        (isEditMode
          ? t('commission.update_error', 'Không thể cập nhật')
          : t('commission.create_error', 'Không thể tạo'));

      if (submitError instanceof Error) {
        errorMessage = submitError.message;
      }

      toast.error(errorMessage);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode
              ? t('commission.form.edit_title', 'Chỉnh Sửa Chính Sách Hoa Hồng')
              : t('commission.form.create_title', 'Tạo Chính Sách Hoa Hồng Mới')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" disabled={loading}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Scope */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('commission.form.scope', 'Phạm vi áp dụng')} <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.scope}
                onValueChange={(value: CreateCommissionPolicyRequest['scope']) =>
                  setFormData({ ...formData, scope: value })
                }
                disabled={isEditMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRANCH">{t('commission.scope.branch', 'Chi nhánh')}</SelectItem>
                  <SelectItem value="ROLE">{t('commission.scope.role', 'Vai trò')}</SelectItem>
                  <SelectItem value="PACKAGE">{t('commission.scope.package', 'Gói dịch vụ')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch (for BRANCH scope) */}
            {formData.scope === 'BRANCH' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('commission.form.branch', 'Chi nhánh')} <span className="text-red-500">*</span>
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                  {currentBranch?.branchName || t('commission.form.no_branch', 'Chưa chọn chi nhánh')}
                </div>
                {errors.branchId && <p className="mt-1 text-sm text-red-500">{errors.branchId}</p>}
              </div>
            )}

            {/* Role (for ROLE scope) */}
            {formData.scope === 'ROLE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('commission.form.role', 'Vai trò')} <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.roleType}
                  onValueChange={(value) => setFormData({ ...formData, roleType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('commission.form.select_role', 'Chọn vai trò')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal Trainer">
                      {t('commission.form.roles.personal_trainer', 'Personal Trainer')}
                    </SelectItem>
                    <SelectItem value="Manager">{t('commission.form.roles.manager', 'Manager')}</SelectItem>
                    <SelectItem value="Technician">{t('commission.form.roles.technician', 'Technician')}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.roleType && <p className="mt-1 text-sm text-red-500">{errors.roleType}</p>}
              </div>
            )}

            {/* Package (for PACKAGE scope) */}
            {formData.scope === 'PACKAGE' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('commission.form.package_type', 'Loại gói')} <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={packageType}
                    onValueChange={(value: 'service' | 'membership') => {
                      setPackageType(value);
                      setFormData({
                        ...formData,
                        servicePackageId: value === 'service' ? formData.servicePackageId : '',
                        membershipPlanId: value === 'membership' ? formData.membershipPlanId : ''
                      });
                      setSelectedPackageIds([]);
                      setSelectedMembershipPlanIds([]);
                    }}
                    disabled={isEditMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">{t('commission.form.service_package', 'Service Package')}</SelectItem>
                      <SelectItem value="membership">
                        {t('commission.form.membership_plan', 'Membership Plan')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Multiple Select Checkbox */}
                {!isEditMode && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="multiple-select"
                      checked={isMultipleSelect}
                      onCheckedChange={(checked) => {
                        setIsMultipleSelect(checked === true);
                        if (!checked) {
                          setSelectedPackageIds([]);
                          setSelectedMembershipPlanIds([]);
                          setFormData({
                            ...formData,
                            servicePackageId: '',
                            membershipPlanId: ''
                          });
                        }
                      }}
                    />
                    <label htmlFor="multiple-select" className="text-sm font-medium text-gray-700 cursor-pointer">
                      {t('commission.form.select_multiple', 'Chọn nhiều gói cùng lúc')}
                    </label>
                  </div>
                )}

                {packageType === 'service' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('commission.form.service_package', 'Service Package')} <span className="text-red-500">*</span>
                      {isMultipleSelect && selectedPackageIds.length > 0 && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({selectedPackageIds.length} {t('commission.form.selected', 'đã chọn')})
                        </span>
                      )}
                    </label>
                    {isMultipleSelect ? (
                      <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                        {loadingPackages ? (
                          <div className="text-sm text-gray-500">{t('common.loading', 'Đang tải...')}</div>
                        ) : packages.length > 0 ? (
                          <div className="space-y-2">
                            {packages.map((pkg) => (
                              <div key={pkg._id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`package-${pkg._id}`}
                                  checked={selectedPackageIds.includes(pkg._id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedPackageIds([...selectedPackageIds, pkg._id]);
                                    } else {
                                      setSelectedPackageIds(selectedPackageIds.filter((id) => id !== pkg._id));
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`package-${pkg._id}`}
                                  className="text-sm text-gray-700 cursor-pointer flex-1"
                                >
                                  {pkg.name} ({pkg.type})
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {t('commission.form.no_packages', 'Không có gói dịch vụ nào')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Select
                        value={formData.servicePackageId}
                        onValueChange={(value) => {
                          setFormData({
                            ...formData,
                            servicePackageId: value,
                            membershipPlanId: ''
                          });
                        }}
                        disabled={loadingPackages || isEditMode}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingPackages
                                ? t('common.loading', 'Đang tải...')
                                : t('commission.form.select_package', 'Chọn gói dịch vụ')
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {packages.length > 0
                            ? packages.map((pkg) => (
                                <SelectItem key={pkg._id} value={pkg._id}>
                                  {pkg.name} ({pkg.type})
                                </SelectItem>
                              ))
                            : !loadingPackages && (
                                <div className="px-2 py-1.5 text-sm text-gray-500">
                                  {t('commission.form.no_packages', 'Không có gói dịch vụ nào')}
                                </div>
                              )}
                        </SelectContent>
                      </Select>
                    )}
                    {errors.package && <p className="mt-1 text-sm text-red-500">{errors.package}</p>}
                  </div>
                )}

                {packageType === 'membership' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('commission.form.membership_plan', 'Membership Plan')} <span className="text-red-500">*</span>
                      {isMultipleSelect && selectedMembershipPlanIds.length > 0 && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({selectedMembershipPlanIds.length} {t('commission.form.selected', 'đã chọn')})
                        </span>
                      )}
                    </label>
                    {isMultipleSelect ? (
                      <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                        {loadingMembershipPlans ? (
                          <div className="text-sm text-gray-500">{t('common.loading', 'Đang tải...')}</div>
                        ) : membershipPlans.length > 0 ? (
                          <div className="space-y-2">
                            {membershipPlans.map((plan) => (
                              <div key={plan._id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`membership-${plan._id}`}
                                  checked={selectedMembershipPlanIds.includes(plan._id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedMembershipPlanIds([...selectedMembershipPlanIds, plan._id]);
                                    } else {
                                      setSelectedMembershipPlanIds(
                                        selectedMembershipPlanIds.filter((id) => id !== plan._id)
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`membership-${plan._id}`}
                                  className="text-sm text-gray-700 cursor-pointer flex-1"
                                >
                                  {plan.name} - {plan.durationInMonths} {t('commission.form.month', 'tháng')}
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {t('commission.form.no_membership_plans', 'Không có gói membership nào')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Select
                        value={formData.membershipPlanId}
                        onValueChange={(value) => {
                          setFormData({
                            ...formData,
                            membershipPlanId: value,
                            servicePackageId: ''
                          });
                        }}
                        disabled={loadingMembershipPlans || isEditMode}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingMembershipPlans
                                ? t('common.loading', 'Đang tải...')
                                : t('commission.form.select_membership', 'Chọn gói membership')
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {membershipPlans.length > 0
                            ? membershipPlans.map((plan) => (
                                <SelectItem key={plan._id} value={plan._id}>
                                  {plan.name} - {plan.durationInMonths} {t('commission.form.month', 'tháng')}
                                </SelectItem>
                              ))
                            : !loadingMembershipPlans && (
                                <div className="px-2 py-1.5 text-sm text-gray-500">
                                  {t('commission.form.no_membership_plans', 'Không có gói membership nào')}
                                </div>
                              )}
                        </SelectContent>
                      </Select>
                    )}
                    {errors.package && <p className="mt-1 text-sm text-red-500">{errors.package}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Commission Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('commission.form.rate', 'Tỷ lệ hoa hồng (%)')} <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                placeholder={t('commission.form.rate_placeholder', 'Ví dụ: 10')}
                className={errors.commissionRate ? 'border-red-500' : ''}
              />
              {errors.commissionRate && <p className="mt-1 text-sm text-red-500">{errors.commissionRate}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.notes', 'Ghi chú')}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={t('common.notes_placeholder', 'Nhập ghi chú (tùy chọn)')}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                {t('common.cancel', 'Hủy')}
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
                {loading
                  ? t('common.loading', 'Đang tải...')
                  : isEditMode
                    ? t('common.update', 'Cập nhật')
                    : t('common.create', 'Tạo')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
