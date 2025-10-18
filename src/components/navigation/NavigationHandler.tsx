import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';

/**
 * NavigationHandler component handles custom navigation events
 * This component listens for custom events and navigates to appropriate routes
 */
const NavigationHandler: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { currentStaff, loading } = useCurrentUserStaff();

  useEffect(() => {
    const handleNavigateToWorkShift = () => {
      if (!user) {
        return;
      }

      // If currentStaff is still loading and user is STAFF, wait a bit or use fallback
      if (user.role === 'STAFF' && loading) {
        // Retry after a short delay
        const retryNavigation = () => {
          window.dispatchEvent(new CustomEvent('navigate-to-workshift'));
        };
        setTimeout(retryNavigation, 1000);
        return;
      }

      // Determine the appropriate workshift route based on user role and job title
      let targetRoute = '/home'; // Default fallback

      if (user.role === 'OWNER' || (user.role === 'STAFF' && currentStaff?.jobTitle === 'Manager')) {
        // Owner or Manager can access management workshift calendar
        targetRoute = '/manage/workshifts/calendar';
      } else if (user.role === 'STAFF' && currentStaff?.jobTitle === 'Personal Trainer') {
        // Personal Trainer can access PT calendar
        targetRoute = '/manage/pt/calendar';
      } else if (user.role === 'STAFF' && currentStaff?.jobTitle === 'Technician') {
        // Technician can access technician calendar
        targetRoute = '/manage/technician/calendar';
      } else {
        // For other staff or if job title is not determined yet
        return;
      }
      navigate(targetRoute);
    };

    // Add event listener for navigate-to-workshift custom event
    window.addEventListener('navigate-to-workshift', handleNavigateToWorkShift);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('navigate-to-workshift', handleNavigateToWorkShift);
    };
  }, [navigate, user, currentStaff, loading]);

  // This component doesn't render anything
  return null;
};

export default NavigationHandler;
