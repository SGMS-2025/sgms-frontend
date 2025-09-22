import { useEffect } from 'react';

/**
 * Hook to scroll to top when component mounts
 * Use this in all pages to ensure they start at the top
 */
export const useScrollToTop = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
};
