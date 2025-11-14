import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateKPI, useUpdateKPI, useKPIDetails } from '@/hooks/useKPI';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';
import { isBranchWideKPIResponse } from '@/types/api/KPI';

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
    commissionRate: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (!open) return;

    if (isEditMode && kpiConfig) {
      // Edit mode: Load existing KPI data
      setFormData({
        branchId: typeof kpiConfig.branchId === 'string' ? kpiConfig.branchId : kpiConfig.branchId._id,
        commissionRate: kpiConfig.commissionRate?.toString() || '',
        startDate: kpiConfig.startDate ? new Date(kpiConfig.startDate).toISOString().split('T')[0] : '',
        endDate: kpiConfig.endDate ? new Date(kpiConfig.endDate).toISOString().split('T')[0] : '',
        notes: kpiConfig.notes || ''
      });
    } else {
      // Create mode: Set defaults - always use currentBranch from context
      const defaultDates = getDefaultDates();
      setFormData({
        branchId: currentBranch?._id || '',
        commissionRate: '',
        startDate: defaultDates.startDate,
        endDate: defaultDates.endDate,
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

    // Commission rate validation
    if (formData.commissionRate === '') {
      newErrors.commissionRate = t('kpi.form.commission_rate_required', 'Vui lòng nhập tỷ lệ hoa hồng');
    } else {
      const rate = Number.parseFloat(formData.commissionRate);
      if (Number.isNaN(rate) || rate < 0 || rate > 100) {
        newErrors.commissionRate = t('kpi.form.commission_rate_invalid', 'Tỷ lệ hoa hồng phải từ 0 đến 100');
      }
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
        // Update mode: Only update commissionRate and notes
        await updateKPI(kpiId, {
          commissionRate: Number.parseFloat(formData.commissionRate),
          notes: formData.notes || undefined
        });

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

        // Create KPI data - branch-wide (no staffId)
        const kpiData = {
          branchId: currentBranch?._id || formData.branchId,
          periodType: periodType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          commissionRate: Number.parseFloat(formData.commissionRate),
          notes: formData.notes || undefined,
          roleType: 'Personal Trainer' // Default to PT
          // No targets - backend will handle commission based on referral
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

            {/* Commission Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('kpi.form.commission_rate', 'Tỷ lệ hoa hồng (%)')} <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                placeholder={t('kpi.form.commission_rate_placeholder', 'Nhập tỷ lệ hoa hồng (ví dụ: 10)')}
                className={errors.commissionRate ? 'border-red-500' : ''}
              />
              <p className="mt-1 text-sm text-gray-500">
                {t(
                  'kpi.form.commission_rate_description',
                  'Tỷ lệ hoa hồng khi nhân viên giới thiệu được khách hàng mới'
                )}
              </p>
              {errors.commissionRate && <p className="mt-1 text-sm text-red-500">{errors.commissionRate}</p>}
            </div>

            {/* Start Date - Only editable in create mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('kpi.form.start_date', 'Ngày bắt đầu')}
                {!isEditMode && <span className="text-red-500">*</span>}
                {isEditMode && <span className="text-gray-500 text-xs ml-2">({t('kpi.form.cannot_change')})</span>}
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                disabled={isEditMode ? true : loading}
                className={`${errors.startDate ? 'border-red-500' : ''} ${isEditMode || loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
            </div>

            {/* End Date - Only editable in create mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('kpi.form.end_date', 'Ngày kết thúc')}
                {!isEditMode && <span className="text-red-500">*</span>}
                {isEditMode && <span className="text-gray-500 text-xs ml-2">({t('kpi.form.cannot_change')})</span>}
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                disabled={isEditMode ? true : loading}
                className={`${errors.endDate ? 'border-red-500' : ''} ${isEditMode || loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
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
