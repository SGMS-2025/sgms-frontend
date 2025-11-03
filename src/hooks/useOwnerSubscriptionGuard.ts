import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthState } from '@/hooks/useAuth';
import { subscriptionApi } from '@/services/api/subscriptionApi';

/**
 * Guard for OWNER routes: allows navigation, but if there's no active
 * subscription, shows a toast and redirects to the subscription page.
 */
export function useOwnerSubscriptionGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthState();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (checkingRef.current) return;
    if (!isAuthenticated || !user || user.role !== 'OWNER') return;

    // Do not guard the subscription page itself
    if (location.pathname.startsWith('/manage/subscriptions')) return;

    checkingRef.current = true;

    (async () => {
      const res = await subscriptionApi.getActiveSubscription();
      checkingRef.current = false;
      if (!res.success || !res.data) {
        toast.warning('Vui lòng mua gói dịch vụ để sử dụng tính năng này');
        navigate('/manage/subscriptions', { replace: true });
      }
    })();
  }, [isAuthenticated, user, location.pathname, navigate]);
}
