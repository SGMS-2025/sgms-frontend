import { useState, useEffect } from 'react';
import { staffApi } from '@/services/api/staffApi';
import { workShiftApi } from '@/services/api/workShiftApi';
import { useAuthState } from '@/hooks/useAuth';
import type { Staff } from '@/types/api/Staff';
import type { WorkShift } from '@/types/api/WorkShift';
import type { ScheduleTemplate } from '@/types/api/ScheduleTemplate';
import type { UseStaffScheduleDataReturn } from '@/types/forms/StaffScheduleFormTypes';

export const useStaffScheduleData = (
  branchId?: string,
  staffId?: string,
  selectedTemplate?: ScheduleTemplate | null
): UseStaffScheduleDataReturn => {
  const { isAuthenticated } = useAuthState();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loadingWorkShifts, setLoadingWorkShifts] = useState(false);
  const [workShiftError, setWorkShiftError] = useState<string | null>(null);

  // Fetch staff list
  useEffect(() => {
    const fetchStaff = async () => {
      if (branchId && isAuthenticated) {
        setLoadingStaff(true);
        const response = await staffApi.getStaffList({ branchId });
        if (response.success) {
          let filteredStaff = response.data.staffList;

          // Filter staff based on template type if template is selected
          if (selectedTemplate) {
            switch (selectedTemplate.type) {
              case 'PERSONAL_TRAINING':
                filteredStaff = response.data.staffList.filter((staff) => staff.jobTitle === 'Personal Trainer');
                break;
              case 'MAINTENANCE':
                filteredStaff = response.data.staffList.filter((staff) => staff.jobTitle === 'Technician');
                break;
              case 'CLASS':
                filteredStaff = response.data.staffList.filter(
                  (staff) => staff.jobTitle === 'Personal Trainer' || staff.jobTitle === 'Manager'
                );
                break;
              case 'FREE_TIME':
                // For free time, show all available staff
                filteredStaff = response.data.staffList;
                break;
              default:
                filteredStaff = response.data.staffList;
            }
          }

          setStaffList(filteredStaff);
        } else {
          setStaffList([]);
        }
        setLoadingStaff(false);
      } else {
        setStaffList([]);
      }
    };
    fetchStaff();
  }, [branchId, isAuthenticated, selectedTemplate]);

  // Fetch workshifts when staff is selected
  useEffect(() => {
    const fetchWorkShifts = async () => {
      if (staffId && isAuthenticated) {
        setLoadingWorkShifts(true);
        setWorkShiftError(null);
        const response = await workShiftApi.getWorkShiftsByStaff(staffId);
        if (response.success) {
          setWorkShifts(response.data.data);
        } else {
          setWorkShiftError(response.message || 'Failed to fetch workshifts');
          setWorkShifts([]);
        }
        setLoadingWorkShifts(false);
      } else {
        setWorkShifts([]);
      }
    };
    fetchWorkShifts();
  }, [staffId, isAuthenticated]);

  const refetchWorkShifts = async (): Promise<void> => {
    if (staffId && isAuthenticated) {
      setLoadingWorkShifts(true);
      setWorkShiftError(null);
      const response = await workShiftApi.getWorkShiftsByStaff(staffId, { limit: 20 });
      if (response.success) {
        setWorkShifts(response.data.data);
      } else {
        setWorkShiftError(response.message || 'Failed to fetch workshifts');
        setWorkShifts([]);
      }
      setLoadingWorkShifts(false);
    }
  };

  return {
    staffList,
    loadingStaff,
    workShifts,
    loadingWorkShifts,
    workShiftError,
    refetchWorkShifts
  };
};
