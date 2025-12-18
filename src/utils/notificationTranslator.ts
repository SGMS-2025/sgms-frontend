import type { TFunction } from 'i18next';
import type { Notification } from '@/contexts/SocketContext';
import type { TimeOffNotificationData, RescheduleNotificationData } from '@/types/api/Socket';
import i18n from '@/configs/i18n';

/**
 * Get i18n key for notification title based on type
 */
function getNotificationTitleKey(type: string): string {
  const keyMap: Record<string, string> = {
    // WorkShift notifications
    WORKSHIFT_CREATED: 'notifications.workshift.created.title',
    WORKSHIFT_UPDATED: 'notifications.workshift.updated.title',
    WORKSHIFT_BATCH_CREATED: 'notifications.workshift.batch_created.title',
    WORKSHIFT_BATCH_ASSIGNED: 'notifications.workshift.batch_assigned.title',
    BRANCH_NOTIFICATION: 'notifications.workshift.branch_update.title',
    EMERGENCY_NOTIFICATION: 'notifications.workshift.emergency.title',

    // TimeOff notifications
    'notification:timeoff:created': 'notifications.timeoff.created.title',
    'notification:timeoff:approved': 'notifications.timeoff.approved.title',
    'notification:timeoff:rejected': 'notifications.timeoff.rejected.title',
    'notification:timeoff:cancelled': 'notifications.timeoff.cancelled.title',
    'notification:timeoff:branch_update': 'notifications.timeoff.branch_update.title',
    'notification:timeoff:owner_update': 'notifications.timeoff.owner_update.title',

    // Reschedule notifications
    'notification:reschedule:created': 'notifications.reschedule.created.title',
    'notification:reschedule:accepted': 'notifications.reschedule.accepted.title',
    'notification:reschedule:approved': 'notifications.reschedule.approved.title',
    'notification:reschedule:rejected': 'notifications.reschedule.rejected.title',
    'notification:reschedule:cancelled': 'notifications.reschedule.cancelled.title',
    'notification:reschedule:expired': 'notifications.reschedule.expired.title',
    'notification:reschedule:completed': 'notifications.reschedule.completed.title',
    'notification:reschedule:branch_update': 'notifications.reschedule.branch_update.title',

    // Service Contract notifications
    SERVICE_CONTRACT_CREATED: 'notifications.service_contract.created.title',
    SERVICE_CONTRACT_ACTIVATED: 'notifications.service_contract.activated.title',
    SERVICE_CONTRACT_UPDATED: 'notifications.service_contract.updated.title',
    'notification:servicecontract:registered': 'notifications.service_contract.registered.title',
    'notification:servicecontract:purchased': 'notifications.service_contract.purchased.title',
    'notification:servicecontract:assigned': 'notifications.service_contract.assigned.title',
    'notification:servicecontract:owner_update': 'notifications.service_contract.owner_update.title',
    'notification:servicecontract:manager_update': 'notifications.service_contract.manager_update.title',
    'notification:servicecontract:sessions_running_low': 'notifications.service_contract.sessions_running_low.title',

    // Membership notifications
    MEMBERSHIP_CONTRACT_CREATED: 'notifications.membership.created.title',
    MEMBERSHIP_CONTRACT_ACTIVATED: 'notifications.membership.activated.title',
    MEMBERSHIP_CONTRACT_UPDATED: 'notifications.membership.updated.title',
    'notification:membership:registered': 'notifications.membership.registered.title',
    'notification:membership:purchased': 'notifications.membership.purchased.title',
    'notification:membership:owner_update': 'notifications.membership.owner_update.title',
    'notification:membership:manager_update': 'notifications.membership.manager_update.title',

    // KPI notifications
    'notification:kpi:achieved': 'notifications.kpi.achieved.title',
    KPI: 'notifications.kpi.achieved.title',

    // PT Progress Reminder notifications
    'notification:pt-progress-reminder:add-progress': 'notifications.pt_progress_reminder.add_progress.title'
  };

  return keyMap[type] || '';
}

/**
 * Get i18n key for notification message based on type
 */
function getNotificationMessageKey(type: string): string {
  const keyMap: Record<string, string> = {
    WORKSHIFT_CREATED: 'notifications.workshift.created.message',
    WORKSHIFT_UPDATED: 'notifications.workshift.updated.message',
    WORKSHIFT_BATCH_CREATED: 'notifications.workshift.batch_created.message',
    WORKSHIFT_BATCH_ASSIGNED: 'notifications.workshift.batch_assigned.message',
    BRANCH_NOTIFICATION: 'notifications.workshift.branch_update.message',
    EMERGENCY_NOTIFICATION: 'notifications.workshift.emergency.message',

    'notification:timeoff:created': 'notifications.timeoff.created.message',
    'notification:timeoff:approved': 'notifications.timeoff.approved.message',
    'notification:timeoff:rejected': 'notifications.timeoff.rejected.message',
    'notification:timeoff:cancelled': 'notifications.timeoff.cancelled.message',
    'notification:timeoff:branch_update': 'notifications.timeoff.branch_update.message',
    'notification:timeoff:owner_update': 'notifications.timeoff.owner_update.message',

    'notification:reschedule:created': 'notifications.reschedule.created.message',
    'notification:reschedule:accepted': 'notifications.reschedule.accepted.message',
    'notification:reschedule:approved': 'notifications.reschedule.approved.message',
    'notification:reschedule:rejected': 'notifications.reschedule.rejected.message',
    'notification:reschedule:cancelled': 'notifications.reschedule.cancelled.message',
    'notification:reschedule:expired': 'notifications.reschedule.expired.message',
    'notification:reschedule:completed': 'notifications.reschedule.completed.message',
    'notification:reschedule:branch_update': 'notifications.reschedule.branch_update.message',

    SERVICE_CONTRACT_CREATED: 'notifications.service_contract.created.message',
    SERVICE_CONTRACT_ACTIVATED: 'notifications.service_contract.activated.message',
    SERVICE_CONTRACT_UPDATED: 'notifications.service_contract.updated.message',
    'notification:servicecontract:registered': 'notifications.service_contract.registered.message',
    'notification:servicecontract:purchased': 'notifications.service_contract.purchased.message',
    'notification:servicecontract:assigned': 'notifications.service_contract.assigned.message',
    'notification:servicecontract:owner_update': 'notifications.service_contract.owner_update.message',
    'notification:servicecontract:manager_update': 'notifications.service_contract.manager_update.message',
    'notification:servicecontract:sessions_running_low': 'notifications.service_contract.sessions_running_low.message',

    MEMBERSHIP_CONTRACT_CREATED: 'notifications.membership.created.message',
    MEMBERSHIP_CONTRACT_ACTIVATED: 'notifications.membership.activated.message',
    MEMBERSHIP_CONTRACT_UPDATED: 'notifications.membership.updated.message',
    'notification:membership:registered': 'notifications.membership.registered.message',
    'notification:membership:purchased': 'notifications.membership.purchased.message',
    'notification:membership:owner_update': 'notifications.membership.owner_update.message',
    'notification:membership:manager_update': 'notifications.membership.manager_update.message',

    // KPI notifications
    'notification:kpi:achieved': 'notifications.kpi.achieved.message',
    KPI: 'notifications.kpi.achieved.message',

    // PT Progress Reminder notifications
    'notification:pt-progress-reminder:add-progress': 'notifications.pt_progress_reminder.add_progress.message'
  };

  return keyMap[type] || '';
}

/**
 * Translate notification title
 */
export function translateNotificationTitle(notification: Notification, t: TFunction): string {
  const key = getNotificationTitleKey(notification.type);
  if (key) {
    // notification.data is Record<string, unknown> - may contain data directly or nested
    const data = notification.data;

    // Try to get nested data for TimeOff and Reschedule (they have data.data structure)
    // But also check root level for WorkShift (data is directly in root)
    const timeOffData = (data as unknown as TimeOffNotificationData)?.data || data;
    const rescheduleData = (data as unknown as RescheduleNotificationData)?.data || data;

    const translated = t(key, {
      // WorkShift data - accessed directly from data object (backend sends directly)
      staffName:
        (data.staffName as string) ||
        (data.assignedStaff as string) ||
        ((timeOffData as Record<string, unknown>)?.staffName as string) ||
        ((rescheduleData as Record<string, unknown>)?.requesterName as string) ||
        '',
      branchName:
        (data.branchName as string) || ((rescheduleData as Record<string, unknown>)?.branchName as string) || '',
      dayOfTheWeek: (data.dayOfTheWeek as string) || '',
      totalShifts: (data.totalShifts as number) || 0,
      totalStaff: (data.totalStaff as number) || 0,
      assignedBy: (data.assignedBy as string) || '',
      createdBy: (data.createdBy as string) || '',

      // TimeOff data - check both nested and root
      type: ((timeOffData as Record<string, unknown>)?.type as string) || (data.type as string) || '',
      status: ((timeOffData as Record<string, unknown>)?.status as string) || (data.status as string) || '',
      startDate:
        ((timeOffData as Record<string, unknown>)?.startDate as string) || (data.startDate as string)
          ? new Date(
              ((timeOffData as Record<string, unknown>)?.startDate as string) || (data.startDate as string)
            ).toLocaleDateString('vi-VN')
          : '',
      endDate:
        ((timeOffData as Record<string, unknown>)?.endDate as string) || (data.endDate as string)
          ? new Date(
              ((timeOffData as Record<string, unknown>)?.endDate as string) || (data.endDate as string)
            ).toLocaleDateString('vi-VN')
          : '',

      // Reschedule data - check both nested and root
      requesterName:
        ((rescheduleData as Record<string, unknown>)?.requesterName as string) || (data.requesterName as string) || '',
      acceptorName:
        ((rescheduleData as Record<string, unknown>)?.acceptorName as string) || (data.acceptorName as string) || '',

      // Membership/Service Contract data
      customerName: (data.customerName as string) || '',
      planName: (data.membershipPlanName as string) || '',
      packageName: (data.servicePackageName as string) || (data.packageName as string) || '',
      price: (data.total as number) || (data.price as number) || 0,
      // Use formattedPrice from backend if available (already formatted in VND)
      formattedPrice:
        (data.formattedPrice as string) ||
        ((data.total as number) || (data.price as number)
          ? new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format((data.total as number) || (data.price as number))
          : ''),
      sessionsRemaining: (data.sessionsRemaining as number) || 0,
      sessionCount: (data.sessionCount as number) || 0,

      // KPI data (branchName already defined above, so only add period and rewardText)
      period: (data.period as string) || '',
      rewardText: ''
    });

    // If translation exists (not the key itself), return it
    if (translated !== key) {
      return translated;
    }
  }

  // Fallback to original title from backend
  return notification.title;
}

/**
 * Translate notification message
 */
export function translateNotificationMessage(notification: Notification, t: TFunction): string {
  const key = getNotificationMessageKey(notification.type);
  if (key) {
    // notification.data is Record<string, unknown> - may contain data directly or nested
    const data = notification.data;

    // Try to get nested data for TimeOff and Reschedule (they have data.data structure)
    // But also check root level for WorkShift (data is directly in root)
    const timeOffData = (data as unknown as TimeOffNotificationData)?.data || data;
    const rescheduleData = (data as unknown as RescheduleNotificationData)?.data || data;

    const translated = t(key, {
      // WorkShift data - accessed directly from data object (backend sends directly)
      staffName:
        (data.staffName as string) ||
        (data.assignedStaff as string) ||
        ((timeOffData as Record<string, unknown>)?.staffName as string) ||
        ((rescheduleData as Record<string, unknown>)?.requesterName as string) ||
        '',
      branchName:
        (data.branchName as string) || ((rescheduleData as Record<string, unknown>)?.branchName as string) || '',
      dayOfTheWeek: (data.dayOfTheWeek as string) || '',
      totalShifts: (data.totalShifts as number) || 0,
      totalStaff: (data.totalStaff as number) || 0,
      assignedBy: (data.assignedBy as string) || '',
      createdBy: (data.createdBy as string) || '',
      startTime: (data.formattedStartTime as string) || '',
      endTime: (data.formattedEndTime as string) || '',

      // TimeOff data - check both nested and root
      type: ((timeOffData as Record<string, unknown>)?.type as string) || (data.type as string) || '',
      status: ((timeOffData as Record<string, unknown>)?.status as string) || (data.status as string) || '',
      startDate:
        ((timeOffData as Record<string, unknown>)?.startDate as string) || (data.startDate as string)
          ? new Date(
              ((timeOffData as Record<string, unknown>)?.startDate as string) || (data.startDate as string)
            ).toLocaleDateString('vi-VN')
          : '',
      endDate:
        ((timeOffData as Record<string, unknown>)?.endDate as string) || (data.endDate as string)
          ? new Date(
              ((timeOffData as Record<string, unknown>)?.endDate as string) || (data.endDate as string)
            ).toLocaleDateString('vi-VN')
          : '',
      reason: ((timeOffData as Record<string, unknown>)?.reason as string) || (data.reason as string) || '',

      // Reschedule data - check both nested and root
      requesterName:
        ((rescheduleData as Record<string, unknown>)?.requesterName as string) || (data.requesterName as string) || '',
      acceptorName:
        ((rescheduleData as Record<string, unknown>)?.acceptorName as string) || (data.acceptorName as string) || '',
      rescheduleReason:
        ((rescheduleData as Record<string, unknown>)?.reason as string) || (data.reason as string) || '',

      // Membership/Service Contract data
      customerName: (data.customerName as string) || '',
      planName: (data.membershipPlanName as string) || '',
      packageName: (data.servicePackageName as string) || (data.packageName as string) || '',
      price: (data.total as number) || (data.price as number) || 0,
      // Use formattedPrice from backend if available (already formatted in VND)
      formattedPrice:
        (data.formattedPrice as string) ||
        ((data.total as number) || (data.price as number)
          ? new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format((data.total as number) || (data.price as number))
          : ''),
      sessionsRemaining: (data.sessionsRemaining as number) || 0,
      sessionCount: (data.sessionCount as number) || 0,

      // KPI data (branchName already defined above, so only add period and rewardText)
      period: (data.period as string) || '',
      rewardText: (() => {
        // Extract reward from achievement if available
        const achievement = (data.achievement as Record<string, unknown>) || {};
        const reward = (achievement.reward as Record<string, unknown>) || {};
        const currentLang = i18n.language || 'vi';
        const isEnglish = currentLang === 'en';
        const rewardLabel = isEnglish ? 'Reward' : 'Phần thưởng';
        const locale = isEnglish ? 'en-US' : 'vi-VN';

        if (reward.type === 'FIXED_AMOUNT' && reward.amount) {
          const amount = reward.amount as number;
          return `. ${rewardLabel}: ${new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(amount)}`;
        } else if (reward.type === 'PERCENTAGE_BONUS' && reward.percentage) {
          const percentage = typeof reward.percentage === 'number' ? reward.percentage : Number(reward.percentage) || 0;
          return `. ${rewardLabel}: ${percentage}%`;
        } else if (reward.type === 'VOUCHER' && reward.voucherDetails) {
          // Only handle string voucherDetails to avoid object stringification issues
          if (typeof reward.voucherDetails === 'string' && reward.voucherDetails.trim()) {
            return `. ${rewardLabel}: ${reward.voucherDetails}`;
          }
        }
        return '';
      })()
    });

    if (translated !== key) {
      return translated;
    }
  }

  // Fallback to original message from backend
  return notification.message;
}
