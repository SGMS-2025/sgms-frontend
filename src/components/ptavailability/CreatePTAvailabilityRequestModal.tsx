import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, User, AlertCircle, Loader2, CheckCircle2, Search } from 'lucide-react';
import { cn } from '@/utils/utils';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { usePTAvailabilityRequestOperations } from '@/hooks/usePTAvailabilityRequest';
import { useBranch } from '@/contexts/BranchContext';
import { useUser } from '@/hooks/useAuth';
import { useBranchWorkingConfig } from '@/hooks/useBranchWorkingConfig';
import { toast } from 'sonner';
import { ScheduleGridSelector } from './ScheduleGridSelector';
import { usePTCustomerList } from '@/hooks/usePTCustomer';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { CreatePTAvailabilityRequestModalProps } from '@/types/api/PTAvailabilityRequest';
import type { PTCustomer } from '@/types/api/Customer';

// Validation schema
const createPTAvailabilityRequestSchema = (t: (key: string) => string) =>
  z.object({
    slots: z
      .array(
        z.object({
          date: z.string().min(1, t('pt_availability.validation.date_required')),
          startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, t('pt_availability.validation.time_format')),
          endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, t('pt_availability.validation.time_format')),
          maxCapacity: z.number().min(1).max(10)
        })
      )
      .min(1, t('pt_availability.validation.at_least_one_slot'))
      .refine(
        (slots) => {
          return slots.every((slot) => {
            const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
            const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
            const startTotal = startHours * 60 + startMinutes;
            const endTotal = endHours * 60 + endMinutes;
            return endTotal > startTotal;
          });
        },
        {
          message: t('pt_availability.validation.end_time_after_start'),
          path: ['slots']
        }
      )
      .refine(
        (slots) => {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          return slots.every((slot) => {
            const slotDate = new Date(slot.date);
            slotDate.setHours(0, 0, 0, 0);

            // If slot date is before today, it's invalid
            if (slotDate < today) {
              return false;
            }

            // If slot date is today, check if start time is in the past
            if (slotDate.getTime() === today.getTime()) {
              const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
              const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHours, startMinutes);
              return slotDateTime >= now;
            }

            return true;
          });
        },
        {
          message: t('pt_availability.validation.slot_in_past') || 'Không thể chọn khung giờ trong quá khứ',
          path: ['slots']
        }
      ),
    serviceContractIds: z.array(z.string()).optional(),
    notes: z.string().max(500).optional()
  });

type CreatePTAvailabilityRequestFormData = z.infer<ReturnType<typeof createPTAvailabilityRequestSchema>>;

export const CreatePTAvailabilityRequestModal: React.FC<CreatePTAvailabilityRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prefillData
}) => {
  const { t } = useTranslation();
  const { currentStaff } = useCurrentUserStaff();
  const { currentBranch } = useBranch();
  const { createRequest, loading } = usePTAvailabilityRequestOperations();
  const currentUser = useUser();
  const { config: branchConfig } = useBranchWorkingConfig(currentBranch?._id);

  const [conflictInfo, setConflictInfo] = useState<{
    hasConflicts: boolean;
    conflictCount: number;
    conflictingShifts: Array<{ _id: string; startTime: string; endTime: string; status: string }>;
  } | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  // Change from array to single selection - only allow one customer at a time
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    prefillData?.serviceContractIds?.[0] || null
  );

  // Fetch PT customers
  // Note: trainerId should be User._id, not Staff._id
  // API getCustomersByTrainer expects User._id, so use currentUser._id directly
  const trainerUserId = currentUser?._id || '';

  const { customerList, loading: loadingCustomers } = usePTCustomerList({
    trainerId: trainerUserId,
    branchId: currentBranch?._id,
    status: 'ACTIVE',
    packageType: 'PT', // Explicitly set packageType to PT
    limit: 100
  });

  // Filter customers by search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customerList;
    const searchLower = customerSearch.toLowerCase();
    return customerList.filter(
      (customer) =>
        customer.fullName.toLowerCase().includes(searchLower) ||
        customer.phone.includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower)
    );
  }, [customerList, customerSearch]);

  // Handle contract selection - Single select only (one customer at a time)
  const handleContractToggle = (contractId: string) => {
    setSelectedContractId((prev) => {
      // If clicking the same contract, deselect it
      if (prev === contractId) {
        return null;
      }
      // Otherwise, select the new contract (replaces previous selection)
      return contractId;
    });
  };

  const { register, handleSubmit, setValue, watch, reset } = useForm<CreatePTAvailabilityRequestFormData>({
    resolver: zodResolver(createPTAvailabilityRequestSchema(t)),
    defaultValues: {
      slots: prefillData?.slots || [],
      serviceContractIds: prefillData?.serviceContractIds || [],
      notes: prefillData?.notes || ''
    }
  });

  const watchedSlots = watch('slots');

  // Calculate working days from branch config
  // Priority: roleConfigs for PT > defaultWorkingDays > all days (fallback)
  const workingDays = useMemo(() => {
    if (!branchConfig) {
      // If no config, allow all days (fallback)
      return [0, 1, 2, 3, 4, 5, 6];
    }

    // Check if there's a role config for PT
    if (currentStaff?.jobTitle === 'Personal Trainer') {
      const ptRoleConfig = branchConfig.roleConfigs?.find((config) => config.role === 'PT');
      if (ptRoleConfig && ptRoleConfig.workingDays && ptRoleConfig.workingDays.length > 0) {
        return ptRoleConfig.workingDays;
      }
    }

    // Fallback to defaultWorkingDays
    if (branchConfig.defaultWorkingDays && branchConfig.defaultWorkingDays.length > 0) {
      return branchConfig.defaultWorkingDays;
    }

    // Final fallback: all days
    return [0, 1, 2, 3, 4, 5, 6];
  }, [branchConfig, currentStaff?.jobTitle]);

  // Update form when selected contract changes (convert single contractId to array format for API)
  useEffect(() => {
    setValue('serviceContractIds', selectedContractId ? [selectedContractId] : []);
  }, [selectedContractId, setValue]);

  // Merge consecutive and overlapping slots on the same day
  const mergeConsecutiveSlots = (
    slots: Array<{ date: string; startTime: string; endTime: string; maxCapacity: number }>
  ) => {
    // Group slots by date
    const slotsByDate = new Map<string, typeof slots>();

    slots.forEach((slot) => {
      if (!slot.date) return;
      const dateKey = slot.date;
      if (!slotsByDate.has(dateKey)) {
        slotsByDate.set(dateKey, []);
      }
      slotsByDate.get(dateKey)!.push(slot);
    });

    const mergedSlots: typeof slots = [];

    // Helper function to convert time string to minutes
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Helper function to convert minutes to time string
    const minutesToTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    // Process each date group
    slotsByDate.forEach((dateSlots, date) => {
      if (dateSlots.length === 0) return;

      // Sort slots by startTime
      const sortedSlots = [...dateSlots].sort((a, b) => {
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
      });

      // Merge overlapping or consecutive slots
      // Use a list of intervals and merge them iteratively
      const intervals: Array<{ startTime: number; endTime: number; maxCapacity: number }> = [];

      for (const slot of sortedSlots) {
        const startMinutes = timeToMinutes(slot.startTime);
        const endMinutes = timeToMinutes(slot.endTime);

        // Find all intervals that overlap or are consecutive with this slot
        const overlappingIndices: number[] = [];

        for (let i = 0; i < intervals.length; i++) {
          const interval = intervals[i];
          // Check if slots are consecutive (liền nhau) or overlapping (chồng chéo)
          // Two slots merge if they are consecutive (endTime of one = startTime of other)
          // OR if they overlap (have common time period)
          // For consecutive: startMinutes == interval.endTime OR endMinutes == interval.startTime
          // For overlapping: startMinutes < interval.endTime AND endMinutes > interval.startTime
          const isConsecutive = startMinutes === interval.endTime || endMinutes === interval.startTime;
          const isOverlapping = startMinutes < interval.endTime && endMinutes > interval.startTime;

          if (isConsecutive || isOverlapping) {
            overlappingIndices.push(i);
          }
        }

        if (overlappingIndices.length === 0) {
          // No overlap, add as new interval
          intervals.push({
            startTime: startMinutes,
            endTime: endMinutes,
            maxCapacity: slot.maxCapacity
          });
        } else {
          // Merge with all overlapping intervals
          // Start with the new slot
          let mergedStart = startMinutes;
          let mergedEnd = endMinutes;
          let mergedCapacity = slot.maxCapacity;

          // Merge with all overlapping intervals (in reverse order to avoid index issues)
          for (let i = overlappingIndices.length - 1; i >= 0; i--) {
            const idx = overlappingIndices[i];
            const interval = intervals[idx];
            mergedStart = Math.min(mergedStart, interval.startTime);
            mergedEnd = Math.max(mergedEnd, interval.endTime);
            mergedCapacity = Math.max(mergedCapacity, interval.maxCapacity);
            intervals.splice(idx, 1);
          }

          // Add the merged interval
          intervals.push({
            startTime: mergedStart,
            endTime: mergedEnd,
            maxCapacity: mergedCapacity
          });
        }
      }

      // Convert merged intervals back to time strings and add to result
      intervals.forEach((interval) => {
        mergedSlots.push({
          date,
          startTime: minutesToTime(interval.startTime),
          endTime: minutesToTime(interval.endTime),
          maxCapacity: interval.maxCapacity
        });
      });
    });

    return mergedSlots;
  };

  // Convert form slots to grid format (ensure date is in YYYY-MM-DD format)
  const gridSlots = useMemo(() => {
    return watchedSlots.map((slot) => ({
      ...slot,
      date: slot.date || ''
    }));
  }, [watchedSlots]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const initialContractId = prefillData?.serviceContractIds?.[0] || null;
      setSelectedContractId(initialContractId);
      reset({
        slots: prefillData?.slots || [],
        serviceContractIds: initialContractId ? [initialContractId] : [],
        notes: prefillData?.notes || ''
      });
      setConflictInfo(null);
      setCustomerSearch('');
    } else {
      setSelectedContractId(null);
      setCustomerSearch('');
    }
  }, [isOpen, reset, prefillData]);

  const onSubmit = async (data: CreatePTAvailabilityRequestFormData) => {
    if (!currentStaff || !currentBranch) {
      toast.error(t('pt_availability.staff_or_branch_missing', 'Staff or branch information is missing'));
      return;
    }

    // Merge consecutive slots before submitting
    const mergedSlots = mergeConsecutiveSlots(data.slots);

    const createData = {
      staffId: currentStaff._id,
      branchId: currentBranch._id,
      slots: mergedSlots.map((slot) => ({
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxCapacity: slot.maxCapacity
      })),
      serviceContractIds: data.serviceContractIds,
      notes: data.notes
    };

    const result = await createRequest(createData);
    if (result) {
      // Check if result has conflict info
      if (result.hasConflicts !== undefined) {
        setConflictInfo({
          hasConflicts: result.hasConflicts,
          conflictCount: result.conflictCount || 0,
          conflictingShifts: result.conflictingShifts || []
        });
      }

      if (!result.hasConflicts) {
        onSuccess?.();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col overflow-hidden p-0">
        <div className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="space-y-3 pb-4 border-b px-6 pt-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-orange-500" />
                  {t('pt_availability.create_request', 'Tạo Yêu Cầu Lịch Kèm 1vs1')}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-gray-600">
                  {t(
                    'pt_availability.create_description',
                    'Đăng ký các khung giờ bạn có thể kèm 1vs1. Yêu cầu sẽ được gửi đến Owner/Manager để phê duyệt.'
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Conflict Warning */}
            {conflictInfo?.hasConflicts && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-sm mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-amber-900 mb-1">
                      {t('pt_availability.conflict_warning', 'Cảnh báo xung đột lịch')}
                    </h4>
                    <p className="text-sm text-amber-800">
                      {t('pt_availability.conflict_details', {
                        count: conflictInfo.conflictCount,
                        defaultValue: `Có ${conflictInfo.conflictCount} ca làm việc xung đột với yêu cầu của bạn.`
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Selection Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-500" />
                    {t('pt_availability.select_customers', 'Chọn Khách Hàng')} ({t('common.optional', 'Tùy chọn')})
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {t(
                      'pt_availability.select_customers_description',
                      'Chọn khách hàng để liên kết với lịch kèm này. Nếu không chọn, lịch sẽ dành cho tất cả khách hàng.'
                    )}
                  </p>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('pt_availability.search_customers', 'Tìm kiếm khách hàng...')}
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Customer List */}
                <Card className="border-gray-200">
                  <CardContent className="p-0">
                    <ScrollArea className="h-64">
                      {loadingCustomers ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                          <span className="ml-2 text-sm text-gray-600">{t('common.loading', 'Đang tải...')}</span>
                        </div>
                      ) : filteredCustomers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                          <User className="w-12 h-12 mb-2 opacity-50" />
                          <p className="text-sm">
                            {customerSearch
                              ? t('pt_availability.no_customers_found', 'Không tìm thấy khách hàng')
                              : t('pt_availability.no_customers', 'Chưa có khách hàng')}
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {filteredCustomers.map((customer: PTCustomer) => {
                            const contractId = customer.package.contractId;
                            // Single selection - check if this contract is selected
                            const isSelected = selectedContractId === contractId;
                            const isActive = customer.package.status === 'ACTIVE';

                            return (
                              <div
                                key={customer._id}
                                className={cn('p-4 hover:bg-gray-50 transition-colors', !isActive && 'opacity-60')}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id={`customer-${customer._id}`}
                                    checked={isSelected}
                                    onCheckedChange={() => handleContractToggle(contractId)}
                                    disabled={!isActive}
                                    className="mt-1"
                                  />
                                  <label htmlFor={`customer-${customer._id}`} className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="w-10 h-10">
                                        <AvatarImage src={customer.avatar} alt={customer.fullName} />
                                        <AvatarFallback className="bg-orange-100 text-orange-600">
                                          {customer.fullName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-gray-900 truncate">{customer.fullName}</p>
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              'text-xs',
                                              isActive
                                                ? 'bg-green-50 text-green-700 border-green-300'
                                                : 'bg-gray-50 text-gray-600 border-gray-300'
                                            )}
                                          >
                                            {customer.package.status === 'ACTIVE'
                                              ? t('common.active', 'Hoạt động')
                                              : customer.package.status === 'PENDING_ACTIVATION'
                                                ? t('common.pending', 'Chờ kích hoạt')
                                                : t('common.expired', 'Hết hạn')}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                                          <span>{customer.phone}</span>
                                          {customer.email && <span>{customer.email}</span>}
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                          <div className="text-xs text-gray-600">
                                            <span className="font-medium">{customer.package.name}</span>
                                          </div>
                                          {customer.contractType === 'PT_PACKAGE' && (
                                            <div className="text-xs text-gray-500">
                                              {t('pt_availability.sessions_remaining', 'Còn lại')}:{' '}
                                              <span className="font-medium text-orange-600">
                                                {customer.package.sessionsRemaining}
                                              </span>
                                              /{customer.package.totalSessions}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Slots Section - Grid Selector */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    {t('pt_availability.time_slots', 'Khung Giờ Kèm')}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t(
                      'pt_availability.time_slots_description',
                      'Click vào các ô trong lưới để chọn khung giờ bạn muốn đăng ký kèm 1vs1'
                    )}
                  </p>
                </div>

                <ScheduleGridSelector
                  selectedSlots={gridSlots}
                  onSlotsChange={(slots) => {
                    // Don't merge immediately - let users see all selected slots
                    // Merge will happen only when submitting the form
                    setValue('slots', slots, { shouldValidate: true });
                  }}
                  slotDuration={30}
                  minTime="06:00"
                  maxTime="22:00"
                  staffId={currentStaff?._id}
                  workingDays={workingDays}
                />
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  {t('pt_availability.notes', 'Ghi Chú')} ({t('common.optional', 'Tùy chọn')})
                </Label>
                <Textarea
                  id="notes"
                  placeholder={t('pt_availability.notes_placeholder', 'Thêm ghi chú cho yêu cầu của bạn...')}
                  {...register('notes')}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">{t('pt_availability.notes_help', 'Tối đa 500 ký tự')}</p>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  {t('common.cancel', 'Hủy')}
                </Button>
                <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.submitting', 'Đang gửi...')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('pt_availability.submit_request', 'Gửi Yêu Cầu')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePTAvailabilityRequestModal;
