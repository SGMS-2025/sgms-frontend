import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * BusinessVerificationPage - Redirects to dashboard
 *
 * This page now only serves as a redirect to the owner dashboard.
 * The actual business verification is handled via a modal that can be
 * triggered from:
 * - Profile dropdown in sidebar
 * - Alert banner on dashboard
 *
 * The modal component is BusinessVerificationModal.tsx
 */
const BusinessVerificationPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard where user can open modal via sidebar or alert banner
    navigate('/manage/owner', { replace: true });
  }, [navigate]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  );
};

export default BusinessVerificationPage;
