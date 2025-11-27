import { useEffect, useRef } from 'react';
import { driver, type Driver } from 'driver.js';
import type { Config } from 'driver.js';

/**
 * Hook to initialize and manage driver.js instance
 *
 * @param config - Driver.js configuration options
 * @returns Driver instance and helper methods
 *
 * @example
 * ```tsx
 * const { driverObj, highlight, startTour } = useDriver({
 *   showProgress: true,
 *   steps: [
 *     { element: '#step1', popover: { title: 'Step 1', description: 'Description' } },
 *     { element: '#step2', popover: { title: 'Step 2', description: 'Description' } }
 *   ]
 * });
 *
 * // Highlight a single element
 * highlight({ element: '#my-element', popover: { title: 'Title', description: 'Description' } });
 *
 * // Start a tour
 * startTour();
 * ```
 */
export function useDriver(config?: Config) {
  const driverRef = useRef<Driver | null>(null);

  useEffect(() => {
    // Initialize driver instance
    driverRef.current = driver(config);

    // Cleanup on unmount
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  /**
   * Highlight a single element
   */
  const highlight = (options: {
    element: string | HTMLElement;
    popover?: {
      title?: string;
      description?: string;
      side?: 'top' | 'bottom' | 'left' | 'right';
      align?: 'start' | 'center' | 'end';
    };
  }) => {
    if (driverRef.current) {
      driverRef.current.highlight({
        element: options.element,
        popover: options.popover
      });
    }
  };

  /**
   * Start a tour with steps
   */
  const startTour = (steps?: Config['steps']) => {
    if (driverRef.current) {
      if (steps) {
        // Create a new driver instance with the provided steps
        const tourDriver = driver({
          ...config,
          steps
        });
        tourDriver.drive();
      } else {
        driverRef.current.drive();
      }
    }
  };

  /**
   * Move to next step
   */
  const moveNext = () => {
    if (driverRef.current) {
      driverRef.current.moveNext();
    }
  };

  /**
   * Move to previous step
   */
  const movePrevious = () => {
    if (driverRef.current) {
      driverRef.current.movePrevious();
    }
  };

  /**
   * Destroy the driver instance
   */
  const destroy = () => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
  };

  /**
   * Check if driver is active
   */
  const isActive = () => {
    return driverRef.current?.isActive() ?? false;
  };

  return {
    driverObj: driverRef.current,
    highlight,
    startTour,
    moveNext,
    movePrevious,
    destroy,
    isActive
  };
}
