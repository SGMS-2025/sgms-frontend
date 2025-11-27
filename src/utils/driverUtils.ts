import { driver, type Driver, type Config } from 'driver.js';

/**
 * Create a driver instance with default configuration
 */
export function createDriver(config?: Config): Driver {
  return driver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    allowClose: true,
    overlayOpacity: 0.5,
    smoothScroll: true,
    ...config
  });
}

/**
 * Predefined tour configurations for common use cases
 */
export const driverTours = {
  /**
   * Create a simple highlight tour
   */
  createHighlightTour: (element: string | HTMLElement, title: string, description: string) => {
    const driverObj = createDriver();
    driverObj.highlight({
      element,
      popover: {
        title,
        description
      }
    });
    return driverObj;
  },

  /**
   * Create a multi-step tour
   */
  createMultiStepTour: (steps: Config['steps'], config?: Config) => {
    const driverObj = createDriver({
      ...config,
      steps
    });
    return driverObj;
  }
};

/**
 * Common driver step configurations
 */
export const driverSteps = {
  /**
   * Create a step configuration
   */
  createStep: (
    element: string | HTMLElement,
    title: string,
    description: string,
    options?: {
      side?: 'top' | 'bottom' | 'left' | 'right';
      align?: 'start' | 'center' | 'end';
    }
  ) => ({
    element,
    popover: {
      title,
      description,
      side: options?.side || 'bottom',
      align: options?.align || 'start'
    }
  })
};
