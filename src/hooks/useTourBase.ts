import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import { DEFAULT_DRIVER_CONFIG, type TourStepDefinition, startTourWithSteps } from './tourUtils';
import type { Config } from 'driver.js';

/**
 * Base hook for creating tour hooks
 * Provides common functionality for all tour hooks
 */
export function useTourBase(customConfig?: Partial<Config>) {
  const { t } = useTranslation();
  const { startTour } = useDriver({
    ...DEFAULT_DRIVER_CONFIG,
    ...customConfig
  });

  /**
   * Start a tour with the given steps
   */
  const startTourWithStepsWrapper = (steps: TourStepDefinition[], pageName: string, delay: number = 800) => {
    startTourWithSteps(startTour, steps, pageName, delay);
  };

  return {
    t,
    startTour: startTourWithStepsWrapper
  };
}
