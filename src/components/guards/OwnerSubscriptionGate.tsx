import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthState } from '@/hooks/useAuth';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import SubscriptionRequiredPage from '@/pages/owner/SubscriptionRequiredPage';

/**
 * Route element: if user is OWNER and has no active subscription,
 * show SubscriptionRequiredPage; otherwise render child routes via <Outlet/>.
 */
export const OwnerSubscriptionGate: React.FC = () => {
  const { isAuthenticated, user } = useAuthState();
  const [loading, setLoading] = useState(true);
  const [hasActive, setHasActive] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isAuthenticated || !user || user.role !== 'OWNER') {
        setHasActive(true);
        setLoading(false);
        return;
      }
      const res = await subscriptionApi.getActiveSubscription();
      if (!mounted) return;
      setHasActive(!!(res.success && res.data));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user]);

  if (loading) return null;
  if (!hasActive) return <SubscriptionRequiredPage />;
  return <Outlet />;
};

export default OwnerSubscriptionGate;
