import { useEffect } from 'react';

interface UseContractDocumentEventsOptions {
  onDocumentUpdate?: (documentId: string) => void;
}

/**
 * Hook to listen for contract document events (signer signed, document completed)
 * and trigger refresh callbacks
 */
export const useContractDocumentEvents = (options: UseContractDocumentEventsOptions = {}) => {
  const { onDocumentUpdate } = options;

  useEffect(() => {
    const handleContractSignerSigned = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;

      // Refresh documents to show updated signer status
      if (data?.data?.documentId) {
        // Wait a bit for backend to fully update, then refresh
        setTimeout(() => {
          onDocumentUpdate?.(data.data.documentId);
        }, 500);
      }
    };

    const handleContractCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;

      // Refresh documents to show completed status
      if (data?.data?.documentId) {
        // Wait a bit for backend to fully update, then refresh
        setTimeout(() => {
          onDocumentUpdate?.(data.data.documentId);
        }, 500);
      }
    };

    // Listen for contract signing events
    globalThis.addEventListener('contract:signer:signed', handleContractSignerSigned);
    globalThis.addEventListener('contract:completed', handleContractCompleted);

    return () => {
      globalThis.removeEventListener('contract:signer:signed', handleContractSignerSigned);
      globalThis.removeEventListener('contract:completed', handleContractCompleted);
    };
  }, [onDocumentUpdate]);
};

/**
 * Hook to refresh data when window/tab becomes visible (user comes back to the page)
 */
export const useVisibilityRefresh = (onRefresh: () => void) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to the page, refresh documents to get latest status
        onRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [onRefresh]);
};
