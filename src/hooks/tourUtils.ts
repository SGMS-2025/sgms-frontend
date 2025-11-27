import type { Config } from 'driver.js';

/**
 * Type definition for a tour step with element finder function
 */
export interface TourStepDefinition {
  element: (() => HTMLElement | undefined) | HTMLElement | string;
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right' | string;
    align?: 'start' | 'center' | 'end' | string;
  };
}

/**
 * Default driver config used across all tours
 */
export const DEFAULT_DRIVER_CONFIG: Partial<Config> = {
  showProgress: true,
  showButtons: ['next', 'previous', 'close'],
  allowClose: true,
  overlayOpacity: 0.5,
  smoothScroll: true,
  stagePadding: 4,
  stageRadius: 5,
  popoverOffset: 10,
  allowKeyboardControl: true,
  disableActiveInteraction: false
};

/**
 * Helper function to find element by data-tour attribute with fallback
 */
export function findElementByTourAttr(
  dataTourAttr: string,
  fallback?: () => HTMLElement | undefined
): HTMLElement | undefined {
  const element = document.querySelector(`[data-tour="${dataTourAttr}"]`);
  if (element) {
    return element as HTMLElement;
  }
  return fallback?.();
}

/**
 * Helper function to find element in sidebar by text
 */
export function findSidebarElementByText(searchTexts: string[], excludeTexts: string[] = []): HTMLElement | undefined {
  const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
  if (!sidebar) return undefined;

  return Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
    const text = el.textContent?.toLowerCase() || '';
    const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
    const combinedText = `${text} ${ariaLabel}`;

    const matches = searchTexts.some((searchText) => combinedText.includes(searchText.toLowerCase()));
    const excludes = excludeTexts.some((excludeText) => combinedText.includes(excludeText.toLowerCase()));

    return matches && !excludes;
  }) as HTMLElement | undefined;
}

/**
 * Helper function to find button by text
 */
export function findButtonByText(searchTexts: string[], excludeTexts: string[] = []): HTMLElement | undefined {
  return Array.from(document.querySelectorAll('button')).find((btn) => {
    const text = btn.textContent?.toLowerCase() || '';
    const matches = searchTexts.some((searchText) => text.includes(searchText.toLowerCase()));
    const excludes = excludeTexts.some((excludeText) => text.includes(excludeText.toLowerCase()));
    return matches && !excludes;
  }) as HTMLElement | undefined;
}

/**
 * Helper function to find input by placeholder
 */
export function findInputByPlaceholder(searchTexts: string[], excludeTexts: string[] = []): HTMLElement | undefined {
  return Array.from(document.querySelectorAll('input[type="text"]')).find((input) => {
    const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
    const matches = searchTexts.some((searchText) => placeholder.includes(searchText.toLowerCase()));
    const excludes = excludeTexts.some((excludeText) => placeholder.includes(excludeText.toLowerCase()));
    return matches && !excludes;
  }) as HTMLElement | undefined;
}

/**
 * Helper function to find select/combobox by text or placeholder
 */
export function findSelectByText(searchTexts: string[], excludeTexts: string[] = []): HTMLElement | undefined {
  return Array.from(document.querySelectorAll('select, [role="combobox"]')).find((select) => {
    const text = select.textContent?.toLowerCase() || '';
    const placeholder = select.getAttribute('placeholder')?.toLowerCase() || '';
    const ariaLabel = select.getAttribute('aria-label')?.toLowerCase() || '';
    const combinedText = `${text} ${placeholder} ${ariaLabel}`;

    const matches = searchTexts.some((searchText) => combinedText.includes(searchText.toLowerCase()));
    const excludes = excludeTexts.some((excludeText) => combinedText.includes(excludeText.toLowerCase()));

    return matches && !excludes;
  }) as HTMLElement | undefined;
}

/**
 * Helper function to scroll element into view
 */
export function scrollIntoView(element: HTMLElement, delay: number = 100): void {
  setTimeout(() => {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, delay);
}

/**
 * Helper function to check if element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Process tour steps: convert element functions to HTMLElements and filter out undefined
 */
export function processTourSteps(steps: TourStepDefinition[]): Config['steps'] {
  const validSteps: Config['steps'] = [];

  for (const step of steps) {
    let element: HTMLElement | undefined;

    if (typeof step.element === 'function') {
      element = step.element() || undefined;
    } else if (typeof step.element === 'string') {
      const foundElement = document.querySelector(step.element);
      element = foundElement ? (foundElement as HTMLElement) : undefined;
    } else {
      element = step.element || undefined;
    }

    if (element) {
      validSteps.push({
        element,
        popover: {
          title: step.popover.title,
          description: step.popover.description,
          side: (step.popover.side as 'top' | 'bottom' | 'left' | 'right' | undefined) || undefined,
          align: (step.popover.align as 'start' | 'center' | 'end' | undefined) || undefined
        }
      });
    }
  }

  return validSteps.length > 0 ? validSteps : undefined;
}

/**
 * Start tour with processed steps
 */
export function startTourWithSteps(
  startTour: (steps?: Config['steps']) => void,
  steps: TourStepDefinition[],
  pageName: string,
  delay: number = 800
): void {
  setTimeout(() => {
    const validSteps = processTourSteps(steps);

    if (validSteps && validSteps.length > 0) {
      startTour(validSteps);
    } else {
      console.warn(`Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang ${pageName}.`);
    }
  }, delay);
}

/**
 * Helper function to find sidebar element with scroll
 */
export function findSidebarElementWithScroll(
  dataTourAttr: string,
  searchTexts: string[],
  excludeTexts: string[] = []
): HTMLElement | undefined {
  const element = findElementByTourAttr(dataTourAttr, () => findSidebarElementByText(searchTexts, excludeTexts));
  if (element) scrollIntoView(element);
  return element;
}

/**
 * Helper function to find stats cards container
 */
export function findStatsCards(
  dataTourAttr: string,
  minCards: number = 3,
  additionalTextChecks?: string[]
): HTMLElement | undefined {
  let element = findElementByTourAttr(dataTourAttr) as HTMLElement | undefined;
  if (element && isElementVisible(element)) {
    scrollIntoView(element);
    return element;
  }

  element = Array.from(document.querySelectorAll('div')).find((el) => {
    const className = el.className || '';
    const hasGrid = className.includes('grid') && className.includes('grid-cols');
    const cardCount = Array.from(el.querySelectorAll('[class*="card"], [class*="Card"]')).length;

    if (!hasGrid || cardCount < minCards) return false;

    if (additionalTextChecks && additionalTextChecks.length > 0) {
      const text = el.textContent?.toLowerCase() || '';
      return additionalTextChecks.some((check) => text.includes(check.toLowerCase()));
    }

    return true;
  }) as HTMLElement | undefined;

  if (element && isElementVisible(element)) {
    scrollIntoView(element);
    return element;
  }

  return undefined;
}

/**
 * Helper function to find pagination component
 */
export function findPagination(dataTourAttr?: string): HTMLElement | undefined {
  let element: HTMLElement | undefined;

  if (dataTourAttr) {
    element = findElementByTourAttr(dataTourAttr) as HTMLElement | undefined;
    if (element && isElementVisible(element)) {
      scrollIntoView(element);
      return element;
    }
  }

  element = document.querySelector('nav[class*="Pagination"]') as HTMLElement | undefined;
  if (element && isElementVisible(element)) {
    scrollIntoView(element);
    return element;
  }

  element = Array.from(document.querySelectorAll('div')).find((el) => {
    const className = el.className || '';
    const hasPaginationNav = el.querySelector('nav[class*="Pagination"]') !== null;
    const hasPaginationButtons = Array.from(el.querySelectorAll('button, a')).some((btn) => {
      const btnText = btn.textContent || '';
      return (
        (btnText.includes('Previous') ||
          btnText.includes('Next') ||
          btnText.includes('Trước') ||
          btnText.includes('Sau')) &&
        (btnText.includes('←') || btnText.includes('→') || btnText.includes('<') || btnText.includes('>'))
      );
    });
    const text = el.textContent || '';
    const hasPaginationText =
      (text.includes('Previous') && text.includes('Next')) ||
      (text.includes('Trước') && text.includes('Sau')) ||
      text.includes('Page');

    return hasPaginationNav || hasPaginationButtons || className.includes('Pagination') || hasPaginationText;
  }) as HTMLElement | undefined;

  if (element) {
    if (dataTourAttr && !isElementVisible(element)) return undefined;
    scrollIntoView(element);
    return element;
  }

  return undefined;
}

/**
 * Helper function to find actions menu/buttons in a list container
 */
export function findActionsMenu(dataTourAttr: string, listContainerSelector?: string): HTMLElement | undefined {
  const actionsMenus = Array.from(document.querySelectorAll(`[data-tour="${dataTourAttr}"]`));
  if (actionsMenus.length > 0) {
    return actionsMenus[0] as HTMLElement;
  }

  const container =
    document.querySelector(listContainerSelector || '') ||
    document.querySelector('table tbody') ||
    document.querySelector('div[class*="grid"][class*="grid-cols"]');

  if (container) {
    const actionButton = Array.from(container.querySelectorAll('button')).find((btn) => {
      const svg = btn.querySelector('svg');
      if (!svg) return false;
      const path = svg.querySelector('path');
      return path && (btn.closest('td') || btn.closest('[class*="card"]'));
    });
    if (actionButton) return actionButton as HTMLElement;
  }

  return undefined;
}

/**
 * Helper function to find view mode toggle (Card/Table view)
 */
export function findViewModeToggle(
  dataTourAttr: string,
  gridIconName: string = 'LayoutGrid',
  listIconName: string = 'List'
): HTMLElement | undefined {
  const element = findElementByTourAttr(dataTourAttr);
  if (element) return element;

  return Array.from(document.querySelectorAll('div')).find((el) => {
    const className = el.className || '';
    if (className.includes('flex') && className.includes('gap')) {
      const buttons = el.querySelectorAll('button');
      if (buttons.length >= 2) {
        const hasGridIcon = Array.from(buttons).some((btn) =>
          btn.querySelector('svg')?.innerHTML.includes(gridIconName)
        );
        const hasListIcon = Array.from(buttons).some((btn) =>
          btn.querySelector('svg')?.innerHTML.includes(listIconName)
        );
        return hasGridIcon && hasListIcon;
      }
    }
    if (className.includes('bg-gray-100') || className.includes('rounded-lg')) {
      const buttons = el.querySelectorAll('button');
      if (buttons.length >= 2) {
        const hasGridIcon = Array.from(buttons).some((btn) => btn.querySelector('svg')?.innerHTML.includes('Grid3X3'));
        const hasListIcon = Array.from(buttons).some((btn) =>
          btn.querySelector('svg')?.innerHTML.includes(listIconName)
        );
        return hasGridIcon && hasListIcon;
      }
    }
    return false;
  }) as HTMLElement | undefined;
}

/**
 * Helper function to find search input with tour attr and placeholder fallback
 */
export function findSearchInput(
  dataTourAttr: string,
  searchTexts: string[],
  excludeTexts: string[] = []
): HTMLElement | undefined {
  const container = findElementByTourAttr(dataTourAttr);
  if (container) return container;

  const input = findElementByTourAttr(`${dataTourAttr}-input`);
  if (input) return input;

  return findInputByPlaceholder(searchTexts, excludeTexts);
}

/**
 * Helper function to find first card in a grid/list
 */
export function findFirstCardInGrid(dataTourAttr: string, gridSelector?: string): HTMLElement | undefined {
  const element = findElementByTourAttr(dataTourAttr) as HTMLElement | undefined;
  if (element) {
    const firstCard = element.querySelector('[class*="Card"], [class*="card"]');
    if (firstCard) {
      scrollIntoView(firstCard as HTMLElement);
      return firstCard as HTMLElement;
    }
    scrollIntoView(element);
    return element;
  }

  const grid =
    (gridSelector ? document.querySelector(gridSelector) : null) ||
    Array.from(document.querySelectorAll('div')).find((el) => {
      const className = el.className || '';
      return (
        className.includes('grid') &&
        className.includes('grid-cols') &&
        el.querySelectorAll('[class*="Card"], [class*="card"]').length > 0
      );
    });

  if (grid) {
    const firstCard = grid.querySelector('[class*="Card"], [class*="card"]');
    if (firstCard) {
      scrollIntoView(firstCard as HTMLElement);
      return firstCard as HTMLElement;
    }
  }

  return undefined;
}
