import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { membershipApi } from '@/services/api/membershipApi';
import type { MembershipPlan } from '@/types/api/Membership';

interface UseMembershipPlanActionsProps {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export const useMembershipPlanActions = ({ onSuccess, onError }: UseMembershipPlanActionsProps = {}) => {
  const { t } = useTranslation();

  const togglePlanStatus = useCallback(
    async (plan: MembershipPlan) => {
      const response = await membershipApi.toggleMembershipPlanStatus(plan._id, {
        isActive: !plan.isActive,
        branchId: plan.branchId?.map((branch) => branch._id) || []
      });

      if (response.success) {
        toast.success(t('membershipManager.toast.toggleSuccess'));
        onSuccess?.();
        return;
      }

      toast.error(response.message || t('membershipManager.toast.toggleError'));
      onError?.(response);
    },
    [t, onSuccess, onError]
  );

  return {
    togglePlanStatus
  };
};
