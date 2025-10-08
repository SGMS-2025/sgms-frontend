import { useEffect, useRef } from 'react';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

/**
 * Observe when an element enters the viewport and toggle `data-in-view` attribute.
 * Use together with the `.scroll-reveal` utility class for smooth animations.
 */
export function useScrollReveal<T extends HTMLElement>({
  threshold = 0.2,
  rootMargin = '0px',
  once = true
}: UseScrollRevealOptions = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;

    if (!node || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-in-view', 'true');
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            entry.target.setAttribute('data-in-view', 'false');
          }
        });
      },
      { threshold, rootMargin }
    );

    node.setAttribute('data-in-view', 'false');
    observer.observe(node);

    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}
