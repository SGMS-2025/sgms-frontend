import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateKPI, useUpdateKPI, useKPIDetails } from '@/hooks/useKPI';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';
import { isBranchWideKPIResponse } from '@/types/api/KPI';
import type { KPITargets, KPIReward, UpdateKPIRequest } from '@/types/api/KPI';
import { formatPriceInput, parsePriceInput } from '@/utils/currency';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface KPIModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // Edit mode: provide KPI ID
  kpiId?: string | null;
  mode?: 'create' | 'edit';
}

export const CreateKPIModal: React.FC<KPIModalProps> = ({ open, onClose, onSuccess, kpiId, mode = 'create' }) => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const { createKPI, loading: createLoading, error: createError, resetError: resetCreateError } = useCreateKPI();
  const { updateKPI, loading: updateLoading, error: updateError, resetError: resetUpdateError } = useUpdateKPI();
  const { kpiConfig, loading: detailLoading } = useKPIDetails(mode === 'edit' ? kpiId || null : null);

  const isEditMode = mode === 'edit' && kpiId;
  const loading = createLoading || updateLoading || detailLoading;
  const error = createError || updateError;

  // Helper: Get default dates (start = today, end = 1 year from today)
  const getDefaultDates = () => {
    const today = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(today.getFullYear() + 1);

    return {
      startDate: today.toISOString().split('T')[0],
      endDate: oneYearLater.toISOString().split('T')[0]
    };
  };

  const [formData, setFormData] = useState({
    branchId: currentBranch?._id || '',
    startDate: '',
    endDate: '',
    targets: {
      revenue: '',
      ptSessions: ''
    },
    reward: {
      type: 'FIXED_AMOUNT' as KPIReward['type'],
      amount: '',
      percentage: '',
      voucherDetails: ''
    },
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const selectedStartDate = useMemo(() => {
    if (!formData.startDate) return undefined;
    const date = new Date(`${formData.startDate}T00:00:00`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }, [formData.startDate]);

  const selectedEndDate = useMemo(() => {
    if (!formData.endDate) return undefined;
    const date = new Date(`${formData.endDate}T00:00:00`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }, [formData.endDate]);

  // Initialize form data
  useEffect(() => {
    if (!open) return;

    if (isEditMode && kpiConfig) {
      // Edit mode: Load existing KPI data
      setFormData({
        branchId: typeof kpiConfig.branchId === 'string' ? kpiConfig.branchId : kpiConfig.branchId._id,
        startDate: kpiConfig.startDate ? new Date(kpiConfig.startDate).toISOString().split('T')[0] : '',
        endDate: kpiConfig.endDate ? new Date(kpiConfig.endDate).toISOString().split('T')[0] : '',
        targets: {
          revenue: kpiConfig.targets?.revenue ? formatPriceInput(kpiConfig.targets.revenue) : '',
          ptSessions: kpiConfig.targets?.ptSessions?.toString() || ''
        },
        reward: {
          type: 'FIXED_AMOUNT',
          amount: kpiConfig.reward?.amount ? formatPriceInput(kpiConfig.reward.amount) : '',
          percentage: kpiConfig.reward?.percentage?.toString() || '',
          voucherDetails: kpiConfig.reward?.voucherDetails || ''
        },
        notes: kpiConfig.notes || ''
      });
    } else {
      // Create mode: Set defaults - always use currentBranch from context
      const defaultDates = getDefaultDates();
      setFormData({
        branchId: currentBranch?._id || '',
        startDate: defaultDates.startDate,
        endDate: defaultDates.endDate,
        targets: {
          revenue: '',
          ptSessions: ''
        },
        reward: {
          type: 'FIXED_AMOUNT',
          amount: '',
          percentage: '',
          voucherDetails: ''
        },
        notes: ''
      });
    }

    setErrors({});
    resetCreateError();
    resetUpdateError();
  }, [open, isEditMode, kpiConfig, currentBranch, resetCreateError, resetUpdateError]);

  useEffect(() => {
    if (!isEditMode && open && currentBranch?._id) {
      setFormData((prev) => ({
        ...prev,
        branchId: currentBranch._id
      }));
    }
  }, [currentBranch, isEditMode, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditMode && !currentBranch?._id) {
      newErrors.branchId = t('kpi.form.branch_required', 'Vui lòng chọn chi nhánh');
    }

    // Targets validation (at least one target should be set)
    const hasAnyTarget = Object.values(formData.targets).some((val) => val !== '');
    if (!hasAnyTarget) {
      newErrors.targets = t('kpi.form.targets_required', 'Vui lòng nhập ít nhất một mục tiêu KPI');
    }

    // Validate target values
    if (formData.targets.revenue !== '') {
      const revenueValue = parsePriceInput(formData.targets.revenue);
      if (revenueValue <= 0) {
        newErrors.targetRevenue = t('kpi.form.target_revenue_invalid', 'Mục tiêu doanh thu phải là số dương');
      }
    }
    if (
      formData.targets.ptSessions !== '' &&
      (Number.isNaN(Number.parseInt(formData.targets.ptSessions, 10)) ||
        Number.parseInt(formData.targets.ptSessions, 10) < 0)
    ) {
      newErrors.targetPtSessions = t('kpi.form.target_pt_sessions_invalid', 'Mục tiêu buổi PT phải là số nguyên dương');
    }

    // Reward validation
    const rewardAmount = parsePriceInput(formData.reward.amount);
    if (!formData.reward.amount || rewardAmount <= 0) {
      newErrors.rewardAmount = t('kpi.form.reward_amount_required', 'Vui lòng nhập số tiền thưởng');
    }

    // Date validation (only for create mode - dates are fixed after creation)
    if (!isEditMode) {
      if (!formData.startDate) {
        newErrors.startDate = t('kpi.form.start_date_required', 'Vui lòng chọn ngày bắt đầu');
      }

      if (!formData.endDate) {
        newErrors.endDate = t('kpi.form.end_date_required', 'Vui lòng chọn ngày kết thúc');
      }

      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (start >= end) {
          newErrors.endDate = t('kpi.form.end_date_after_start', 'Ngày kết thúc phải sau ngày bắt đầu');
        }
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
      if (isEditMode && kpiId) {
        // Update mode: Update targets, reward, and notes
        const updateData: UpdateKPIRequest = {
          notes: formData.notes || undefined
        };

        // Build targets object (only include non-empty values)
        const targets: Partial<KPITargets> = {};
        if (formData.targets.revenue !== '') targets.revenue = parsePriceInput(formData.targets.revenue);
        if (formData.targets.ptSessions !== '') targets.ptSessions = Number.parseInt(formData.targets.ptSessions, 10);
        if (Object.keys(targets).length > 0) {
          updateData.targets = targets;
        }

        // Build reward object
        const reward: KPIReward = {
          type: 'FIXED_AMOUNT',
          amount: parsePriceInput(formData.reward.amount),
          percentage: 0,
          voucherDetails: undefined
        };
        updateData.reward = reward;

        await updateKPI(kpiId, updateData);

        toast.success(t('kpi.update_success', 'Cập nhật KPI thành công'));
        onSuccess?.();
        onClose();
      } else {
        // Create mode: Calculate period type based on date range
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        let periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' = 'MONTHLY';
        if (daysDiff > 365) {
          periodType = 'YEARLY';
        } else if (daysDiff > 90) {
          periodType = 'QUARTERLY';
        }

        // Build targets object (only include non-empty values)
        const targets: KPITargets = {
          revenue: formData.targets.revenue !== '' ? parsePriceInput(formData.targets.revenue) : 0,
          newMembers: 0,
          ptSessions: formData.targets.ptSessions !== '' ? Number.parseInt(formData.targets.ptSessions, 10) : 0,
          contracts: 0
        };

        // Check if any target is set (non-zero)
        const hasAnyTarget = Object.values(targets).some((val) => val > 0);

        // Build reward object
        const reward: KPIReward = {
          type: 'FIXED_AMOUNT',
          amount: parsePriceInput(formData.reward.amount),
          percentage: 0,
          voucherDetails: undefined
        };

        // Create KPI data - branch-wide (no staffId)
        const kpiData = {
          branchId: currentBranch?._id || formData.branchId,
          periodType: periodType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          targets: hasAnyTarget ? targets : undefined,
          reward: reward,
          notes: formData.notes || undefined,
          roleType: 'Personal Trainer' // Default to PT
        };

        const result = await createKPI(kpiData);

        // Check if result is branch-wide (has count property) or individual KPI
        if (result) {
          if (isBranchWideKPIResponse(result)) {
            // Branch-wide KPI creation
            toast.success(
              t('kpi.create_success_multiple', 'Tạo KPI thành công cho {count} nhân viên', {
                count: result.count || 0
              })
            );
          } else {
            // Individual KPI creation (result is KPIConfig)
            toast.success(t('kpi.create_success', 'Tạo KPI thành công'));
          }
          onSuccess?.();
          onClose();
        }
      }
    } catch (submitError: unknown) {
      // Extract error message with proper type checking
      let errorMessage =
        error ||
        (isEditMode ? t('kpi.update_error', 'Không thể cập nhật KPI') : t('kpi.create_error', 'Không thể tạo KPI'));

      if (submitError instanceof Error) {
        errorMessage = submitError.message;
      } else if (submitError && typeof submitError === 'object') {
        // Check for axios error response structure
        if ('response' in submitError) {
          const errorResponse = submitError.response;
          if (errorResponse && typeof errorResponse === 'object' && 'data' in errorResponse) {
            const responseData = errorResponse.data;
            if (responseData && typeof responseData === 'object' && 'error' in responseData) {
              const errorData = responseData.error;
              if (errorData && typeof errorData === 'object' && 'message' in errorData) {
                errorMessage = String(errorData.message);
              }
            }
          }
        } else if ('message' in submitError && typeof submitError.message === 'string') {
          errorMessage = submitError.message;
        }
      }

      toast.error(errorMessage);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        // Close modal when clicking on backdrop
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
        aria-labelledby="kpi-modal-title"
        onKeyDown={(e) => {
          // Close modal on Escape key
          if (e.key === 'Escape' && !loading) {
            onClose();
          }
        }}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 id="kpi-modal-title" className="text-2xl font-bold text-gray-900">
            {isEditMode ? t('kpi.form.edit_title', 'Chỉnh Sửa KPI') : t('kpi.form.create_title', 'Tạo KPI Mới')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            disabled={loading}
            aria-label={t('common.close_modal', 'Close modal')}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form - Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Branch Display - Auto-selected from current branch context */}
            {!isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('kpi.form.branch', 'Chi nhánh')} <span className="text-red-500">*</span>
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                  {currentBranch?.branchName || t('kpi.form.no_branch_selected', 'Chưa chọn chi nhánh')}
                </div>
                {errors.branchId && <p className="mt-1 text-sm text-red-500">{errors.branchId}</p>}
                {!currentBranch?._id && (
                  <p className="mt-1 text-sm text-amber-600">
                    {t('kpi.form.select_branch_first', 'Vui lòng chọn chi nhánh từ menu trên trước khi tạo KPI')}
                  </p>
                )}
              </div>
            )}

            {/* KPI Targets Section */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('kpi.form.targets_section', 'Mục tiêu KPI')}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t('kpi.form.targets_description', 'Đặt mục tiêu cho nhân viên cần đạt trong kỳ này')}
              </p>

              {errors.targets && <p className="mb-2 text-sm text-red-500">{errors.targets}</p>}

              <div className="grid grid-cols-2 gap-4">
                {/* Target Revenue */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('kpi.form.target_revenue', 'Mục tiêu doanh thu (VND)')}
                  </label>
                  <Input
                    type="text"
                    value={formData.targets.revenue}
                    onChange={(e) => {
                      const formatted = formatPriceInput(e.target.value);
                      setFormData({
                        ...formData,
                        targets: { ...formData.targets, revenue: formatted }
                      });
                    }}
                    placeholder={t('kpi.form.target_revenue_placeholder', 'Ví dụ: 50.000.000')}
                    className={errors.targetRevenue ? 'border-red-500' : ''}
                  />
                  {errors.targetRevenue && <p className="mt-1 text-sm text-red-500">{errors.targetRevenue}</p>}
                </div>

                {/* Target PT Sessions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('kpi.form.target_pt_sessions', 'Mục tiêu buổi PT')}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.targets.ptSessions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targets: { ...formData.targets, ptSessions: e.target.value }
                      })
                    }
                    placeholder={t('kpi.form.target_pt_sessions_placeholder', 'Ví dụ: 50')}
                    className={errors.targetPtSessions ? 'border-red-500' : ''}
                  />
                  {errors.targetPtSessions && <p className="mt-1 text-sm text-red-500">{errors.targetPtSessions}</p>}
                </div>
              </div>
            </div>

            {/* Reward Section */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('kpi.form.reward_section', 'Thưởng khi đạt KPI')}
              </h3>

              {/* Reward Amount (Fixed Reward) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('kpi.form.reward_amount', 'Số tiền thưởng (VND)')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.reward.amount}
                  onChange={(e) => {
                    const formatted = formatPriceInput(e.target.value);
                    setFormData({
                      ...formData,
                      reward: { ...formData.reward, amount: formatted }
                    });
                  }}
                  placeholder={t('kpi.form.reward_amount_placeholder', 'Ví dụ: 1.000.000')}
                  className={errors.rewardAmount ? 'border-red-500' : ''}
                />
                {errors.rewardAmount && <p className="mt-1 text-sm text-red-500">{errors.rewardAmount}</p>}
              </div>
            </div>

            {/* Start Date - Only editable in create mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('kpi.form.start_date', 'Ngày bắt đầu')}
                {!isEditMode && <span className="text-red-500">*</span>}
                {isEditMode && <span className="text-gray-500 text-xs ml-2">({t('kpi.form.cannot_change')})</span>}
              </label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen} modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isEditMode ? true : loading}
                    className={`w-full justify-between text-left font-normal ${isEditMode || loading ? 'bg-gray-100 cursor-not-allowed' : ''} ${errors.startDate ? 'border-red-500' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {selectedStartDate
                        ? format(selectedStartDate, 'dd/MM/yyyy', { locale: vi })
                        : t('membership_registration.activation_date_placeholder', {
                            defaultValue: 'Chọn ngày bắt đầu'
                          })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto rounded-2xl border border-border bg-white p-0 shadow-lg z-[9999]"
                  align="start"
                  side="bottom"
                  sideOffset={8}
                  collisionPadding={8}
                >
                  <CalendarComponent
                    mode="single"
                    selected={selectedStartDate}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, startDate: format(date, 'yyyy-MM-dd') });
                        setStartDateOpen(false);
                      }
                    }}
                    initialFocus
                    locale={vi}
                    className="bg-white"
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
            </div>

            {/* End Date - Only editable in create mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('kpi.form.end_date', 'Ngày kết thúc')}
                {!isEditMode && <span className="text-red-500">*</span>}
                {isEditMode && <span className="text-gray-500 text-xs ml-2">({t('kpi.form.cannot_change')})</span>}
              </label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen} modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isEditMode ? true : loading}
                    className={`w-full justify-between text-left font-normal ${isEditMode || loading ? 'bg-gray-100 cursor-not-allowed' : ''} ${errors.endDate ? 'border-red-500' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {selectedEndDate
                        ? format(selectedEndDate, 'dd/MM/yyyy', { locale: vi })
                        : t('membership_registration.activation_date_placeholder', {
                            defaultValue: 'Chọn ngày kết thúc'
                          })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto rounded-2xl border border-border bg-white p-0 shadow-lg z-[9999]"
                  align="start"
                  side="bottom"
                  sideOffset={8}
                  collisionPadding={8}
                >
                  <CalendarComponent
                    mode="single"
                    selected={selectedEndDate}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, endDate: format(date, 'yyyy-MM-dd') });
                        setEndDateOpen(false);
                      }
                    }}
                    initialFocus
                    locale={vi}
                    className="bg-white"
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('kpi.form.notes', 'Ghi chú')}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={t('kpi.form.notes_placeholder', 'Nhập ghi chú (tùy chọn)')}
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
                {(() => {
                  if (loading) return t('common.loading', 'Đang tải...');
                  if (isEditMode) return t('kpi.form.update', 'Cập nhật KPI');
                  return t('kpi.form.create', 'Tạo KPI');
                })()}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
