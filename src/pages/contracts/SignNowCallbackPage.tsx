import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Callback page for SignNow redirects
 * This page handles redirects from SignNow after document operations (send, sign, etc.)
 * It prevents nested dashboard issues by closing the iframe if embedded, or redirecting normally if not
 */
export default function SignNowCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're in an iframe
    const isInIframe = window.self !== window.top;

    if (isInIframe) {
      // If we're in an iframe, notify parent window to close it immediately
      // This prevents the nested dashboard issue
      try {
        // Send message to parent window to close the iframe
        window.parent.postMessage(
          {
            type: 'signnow-callback',
            action: 'close-iframe',
            success: true
          },
          window.location.origin
        );

        // The parent window will handle the actual closing
        // We don't need to do anything else here - return null immediately
      } catch (error) {
        console.error('Failed to send message to parent:', error);
        // If message fails, try to redirect parent directly (only works if same origin)
        try {
          if (window.parent && window.parent !== window && window.parent.location) {
            window.parent.location.href = '/manage/contracts';
          }
        } catch (e) {
          // Cross-origin error, cannot redirect parent
          console.error('Cannot redirect parent window:', e);
        }
      }
    } else {
      // If not in iframe, redirect normally to contracts page
      navigate('/manage/contracts', { replace: true });
    }
  }, [navigate]);

  // Always return null if in iframe (check immediately to avoid flash)
  // For non-iframe, show loading briefly before redirect
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  if (isInIframe) {
    return null; // Don't show anything in iframe - parent will close it
  }

  // Only show loading if not in iframe (will redirect anyway)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Document sent successfully. Redirecting...</p>
      </div>
    </div>
  );
}
