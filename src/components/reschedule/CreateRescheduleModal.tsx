import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, MapPin, Loader2, ArrowRightLeft, UserPlus, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/utils';
import { useCreateRescheduleRequest } from '@/hooks/useReschedule';
import { useWorkShift } from '@/hooks/useWorkShift';
import { useBranch } from '@/contexts/BranchContext';
import { staffApi } from '@/services/api/staffApi';
import { workShiftApi } from '@/services/api/workShiftApi';
import { useAuth } from '@/contexts/AuthContext';
import type {
  CreateRescheduleModalProps,
  CreateRescheduleRequestDto,
  RescheduleType,
  ReschedulePriority
} from '@/types/api/Reschedule';
import type { Staff } from '@/types/api/Staff';
import type { WorkShift } from '@/types/api/WorkShift';

const RESCHEDULE_TYPES: { value: RescheduleType; label: string; description: string }[] = [
  {
    value: 'FIND_REPLACEMENT',
    label: 'Find Replacement',
    description: 'Find someone to cover your shift'
  },
  {
    value: 'DIRECT_SWAP',
    label: 'Direct Swap',
    description: 'Swap shifts with another staff member'
  },
  {
    value: 'MANAGER_ASSIGN',
    label: 'Manager Assign',
    description: 'Let manager assign someone to cover'
  }
];

const PRIORITY_OPTIONS: { value: ReschedulePriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

const CreateRescheduleModal: React.FC<CreateRescheduleModalProps> = ({ isOpen, onClose, onSuccess, workShiftId }) => {
  const { t } = useTranslation();
  const { create, loading } = useCreateRescheduleRequest();
  const { currentBranch } = useBranch();
  const { state: authState } = useAuth();

  // If workShiftId is provided, fetch the work shift details
  const { workShift } = useWorkShift(workShiftId || '');

  // State for staff list and available shifts
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [availableShifts, setAvailableShifts] = useState<WorkShift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);

  // Filter reschedule types based on context
  const getAvailableRescheduleTypes = () => {
    // If workShiftId is provided (from WorkShift Detail), hide Direct Swap
    if (workShiftId) {
      return RESCHEDULE_TYPES.filter((type) => type.value !== 'DIRECT_SWAP');
    }
    // If no workShiftId (from Reschedule Management), show all types
    return RESCHEDULE_TYPES;
  };

  const [formData, setFormData] = useState<CreateRescheduleRequestDto>({
    originalShiftId: workShiftId || '',
    targetStaffId: '',
    targetShiftId: '',
    swapType: 'FIND_REPLACEMENT',
    reason: '',
    priority: 'MEDIUM'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch staff list when modal opens
  useEffect(() => {
    const fetchStaffList = async () => {
      if (isOpen && authState.isAuthenticated) {
        setLoadingStaff(true);
        // Try to fetch staff list without specifying branchId first
        // This will use the user's accessible branches
        const response = await staffApi.getStaffList();
        if (response.success) {
          setStaffList(response.data.staffList);
        } else {
          // If that fails, try with current branch if available
          if (currentBranch?._id) {
            const branchResponse = await staffApi.getStaffList({ branchId: currentBranch._id });
            if (branchResponse.success) {
              setStaffList(branchResponse.data.staffList);
            } else {
              setStaffList([]);
            }
          } else {
            setStaffList([]);
          }
        }
        setLoadingStaff(false);
      }
    };
    fetchStaffList();
  }, [isOpen, currentBranch?._id, authState.isAuthenticated]);

  // Fetch available shifts for Direct Swap when needed
  useEffect(() => {
    const fetchAvailableShifts = async () => {
      if (isOpen && formData.swapType === 'DIRECT_SWAP' && authState.isAuthenticated) {
        setLoadingShifts(true);
        // Try to fetch shifts without specifying branchId first
        let response;
        if (currentBranch?._id) {
          response = await workShiftApi.getWorkShifts({
            branchId: currentBranch._id,
            limit: 100
          });
        } else {
          // If no current branch, try without branchId
          response = await workShiftApi.getWorkShifts({
            limit: 100
          });
        }

        if (response.success) {
          // Filter out the original shift and shifts that are too close in time
          const filteredShifts = response.data.data.filter((shift: WorkShift) => {
            // Don't show the same shift
            if (shift._id === formData.originalShiftId) return false;

            // Don't show shifts that are in the past
            const shiftDate = new Date(shift.startTime);
            const now = new Date();
            if (shiftDate < now) return false;

            return true;
          });
          setAvailableShifts(filteredShifts);
        } else {
          setAvailableShifts([]);
        }
        setLoadingShifts(false);
      } else if (formData.swapType !== 'DIRECT_SWAP') {
        setAvailableShifts([]);
      }
    };
    fetchAvailableShifts();
  }, [isOpen, formData.swapType, formData.originalShiftId, currentBranch?._id, authState.isAuthenticated]);

  // Auto-populate targetStaffId when targetShiftId is selected
  useEffect(() => {
    if (formData.targetShiftId && availableShifts.length > 0) {
      const selectedShift = availableShifts.find((shift) => shift._id === formData.targetShiftId);
      if (selectedShift?.staffId?._id) {
        setFormData((prev) => ({
          ...prev,
          targetStaffId: selectedShift.staffId._id
        }));
      }
    }
  }, [formData.targetShiftId, availableShifts]);

  // Reset form when modal opens/closes or workShiftId changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        originalShiftId: workShiftId || '',
        targetStaffId: '',
        targetShiftId: '',
        swapType: 'FIND_REPLACEMENT',
        reason: '',
        priority: 'MEDIUM'
      });
      setErrors({});
    }
  }, [isOpen, workShiftId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.originalShiftId) {
      newErrors.originalShiftId = t('reschedule.validation.original_shift_required');
    }

    if (!formData.reason.trim()) {
      newErrors.reason = t('reschedule.validation.reason_required');
    } else if (formData.reason.length > 500) {
      newErrors.reason = t('reschedule.validation.reason_too_long');
    }

    if (formData.swapType === 'DIRECT_SWAP') {
      if (!formData.targetShiftId) {
        newErrors.targetShiftId = t('reschedule.validation.target_shift_required');
      }
      if (!formData.targetStaffId) {
        newErrors.targetStaffId = t('reschedule.validation.target_staff_required');
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

    const result = await create(formData);

    if (result) {
      onSuccess?.();
      onClose();
    }
  };

  const handleInputChange = (field: keyof CreateRescheduleRequestDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const getTypeIcon = (type: RescheduleType) => {
    switch (type) {
      case 'FIND_REPLACEMENT':
        return <UserPlus className="h-4 w-4" />;
      case 'DIRECT_SWAP':
        return <ArrowRightLeft className="h-4 w-4" />;
      case 'MANAGER_ASSIGN':
        return <User className="h-4 w-4" />;
      default:
        return <ArrowRightLeft className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="overflow-y-auto p-0"
        style={{
          width: '600px',
          maxWidth: '100vw',
          maxHeight: '100vh'
        }}
      >
        <DialogTitle className="sr-only">{t('reschedule.create_request')}</DialogTitle>
        <DialogDescription className="sr-only">{t('reschedule.create_request_description')}</DialogDescription>

        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{t('reschedule.create_request')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('reschedule.create_request_description')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-6">
            {/* Original Shift Display */}
            {workShift && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('reschedule.original_shift')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{workShift.staffId?.userId?.fullName}</span>
                      <span className="text-gray-600">({workShift.staffId?.jobTitle})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>
                        {workShift.startTimeFmt} - {workShift.endTimeFmt}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{workShift.branchId?.branchName}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Swap Type */}
            <div className="space-y-2">
              <Label htmlFor="swapType">{t('reschedule.swap_type')}</Label>
              <Select
                value={formData.swapType}
                onValueChange={(value: RescheduleType) => handleInputChange('swapType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('reschedule.select_swap_type')} />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRescheduleTypes().map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(type.value)}
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Shift (for Direct Swap) */}
            {formData.swapType === 'DIRECT_SWAP' && (
              <div className="space-y-2">
                <Label htmlFor="targetShiftId">{t('reschedule.target_shift')}</Label>
                <Select
                  value={formData.targetShiftId}
                  onValueChange={(value) => handleInputChange('targetShiftId', value)}
                  disabled={loadingShifts}
                >
                  <SelectTrigger className={cn(errors.targetShiftId && 'border-red-500')}>
                    <SelectValue
                      placeholder={loadingShifts ? t('common.loading') : t('reschedule.select_target_shift')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      if (loadingShifts) {
                        return (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t('common.loading')}
                            </div>
                          </SelectItem>
                        );
                      }

                      if (availableShifts.length > 0) {
                        return availableShifts.map((shift) => (
                          <SelectItem key={shift._id} value={shift._id}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{shift.staffId?.userId?.fullName}</div>
                                <div className="text-xs text-gray-500">
                                  {shift.startTimeFmt} - {shift.endTimeFmt}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ));
                      }

                      return (
                        <SelectItem value="no-shifts" disabled>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {t('reschedule.no_available_shifts')}
                          </div>
                        </SelectItem>
                      );
                    })()}
                  </SelectContent>
                </Select>
                {errors.targetShiftId && <p className="text-sm text-red-600">{errors.targetShiftId}</p>}
                <p className="text-xs text-gray-500">{t('reschedule.target_shift_help')}</p>
              </div>
            )}

            {/* Target Staff (for Direct Swap) */}
            {formData.swapType === 'DIRECT_SWAP' && (
              <div className="space-y-2">
                <Label htmlFor="targetStaffId">{t('reschedule.target_staff')}</Label>
                <Select
                  value={formData.targetStaffId}
                  onValueChange={(value) => handleInputChange('targetStaffId', value)}
                  disabled={loadingStaff}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={loadingStaff ? t('common.loading') : t('reschedule.select_target_staff')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      if (loadingStaff) {
                        return (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t('common.loading')}
                            </div>
                          </SelectItem>
                        );
                      }

                      if (staffList.length > 0) {
                        return staffList.map((staff) => (
                          <SelectItem key={staff._id} value={staff._id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{staff.userId?.fullName || 'Unknown'}</div>
                                <div className="text-xs text-gray-500">{staff.jobTitle}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ));
                      }

                      return (
                        <SelectItem value="no-staff" disabled>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {t('staff.no_staff_available')}
                          </div>
                        </SelectItem>
                      );
                    })()}
                  </SelectContent>
                </Select>
                {errors.targetStaffId && <p className="text-sm text-red-600">{errors.targetStaffId}</p>}
                <p className="text-xs text-gray-500">{t('reschedule.target_staff_help')}</p>
              </div>
            )}

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">{t('reschedule.priority')}</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: ReschedulePriority) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('reschedule.select_priority')} />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={cn('text-xs', priority.color)}>{priority.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">{t('reschedule.reason')} *</Label>
              <Textarea
                id="reason"
                placeholder={t('reschedule.enter_reason')}
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className={cn(errors.reason && 'border-red-500')}
                rows={3}
                maxLength={500}
              />
              {errors.reason && <p className="text-sm text-red-600">{errors.reason}</p>}
              <div className="flex justify-between text-xs text-gray-500">
                <span>{t('reschedule.reason_help')}</span>
                <span>{formData.reason.length}/500</span>
              </div>
            </div>

            {/* Priority Info */}
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">{t('reschedule.priority_info_title')}</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• {t('reschedule.priority_urgent_info')}</li>
                    <li>• {t('reschedule.priority_high_info')}</li>
                    <li>• {t('reschedule.priority_medium_info')}</li>
                    <li>• {t('reschedule.priority_low_info')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.creating')}
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  {t('reschedule.create_request')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRescheduleModal;
