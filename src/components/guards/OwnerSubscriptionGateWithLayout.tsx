import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthState } from '@/hooks/useAuth';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import SubscriptionRequiredPage from '@/pages/owner/SubscriptionRequiredPage';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

/**
 * Same as OwnerSubscriptionGate, but always renders with Owner manage layout
 * so the requirement page keeps navbar/sidebar.
 */
export const OwnerSubscriptionGateWithLayout: React.FC = () => {
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

  const Content = hasActive ? <Outlet /> : <SubscriptionRequiredPage />;

  if (loading) return null;
  return (
    <SidebarProvider>
      <div className="h-screen bg-[#f1f3f4] flex overflow-hidden">
        <OwnerSidebar />
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="bg-white border-b border-gray-200">
            <div className="px-5 py-2 pb-3">
              <DashboardHeader />
            </div>
          </div>
          <div className="p-6">{Content}</div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default OwnerSubscriptionGateWithLayout;
