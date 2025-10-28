// Realtime update hook for reschedule
import { useEffect } from 'react';

export const useRescheduleRealtime = (refetch: () => void) => {
  useEffect(() => {
    const handleRealtimeNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const notification = customEvent.detail;

      const isRescheduleNotification =
        notification.type?.includes('RESCHEDULE') ||
        notification.type?.includes('notification:reschedule') ||
        notification.category === 'reschedule';

      if (isRescheduleNotification) {
        console.log('🔄 [useRescheduleRealtime] Reschedule notification detected, refreshing...');
        refetch();
      }
    };

    globalThis.addEventListener('realtime-notification', handleRealtimeNotification);

    return () => {
      globalThis.removeEventListener('realtime-notification', handleRealtimeNotification);
    };
  }, [refetch]);
};
