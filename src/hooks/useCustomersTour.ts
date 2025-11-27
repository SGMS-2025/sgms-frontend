import { useTourBase } from './useTourBase';
import {
  findElementByTourAttr,
  findButtonByText,
  findSidebarElementWithScroll,
  findSearchInput,
  findPagination,
  scrollIntoView,
  isElementVisible
} from './tourUtils';

/**
 * Hook để tạo tour hướng dẫn sử dụng Customers
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useCustomersTour() {
  const { t, startTour } = useTourBase();

  /**
   * Khởi chạy tour hướng dẫn Customers
   * Tour sẽ hướng dẫn từ sidebar đến trang Customers và các tính năng chính
   */
  const startCustomersTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Customers trong sidebar
      {
        element: () => findSidebarElementWithScroll('customers-menu-item', ['customer', 'khách hàng']),
        popover: {
          title: t('customer.tour.sidebar_customers.title'),
          description: t('customer.tour.sidebar_customers.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 2: Giới thiệu action buttons (Add Customer, Import Excel, Column Selector)
      {
        element: () => {
          const element = findElementByTourAttr('customers-action-buttons', () => {
            return Array.from(document.querySelectorAll('div')).find((el) => {
              const buttons = Array.from(el.querySelectorAll('button'));
              return buttons.some((btn) => {
                const text = btn.textContent?.toLowerCase() || '';
                return (
                  text.includes('add customer') ||
                  text.includes('thêm khách hàng') ||
                  text.includes('import excel') ||
                  text.includes('import') ||
                  text.includes('columns') ||
                  text.includes('cột')
                );
              });
            }) as HTMLElement | undefined;
          });
          if (element) scrollIntoView(element);
          return element;
        },
        popover: {
          title: t('customer.tour.action_buttons.title'),
          description: t('customer.tour.action_buttons.description'),
          side: 'left' as const,
          align: 'start' as const
        }
      },
      // Bước 3: Giới thiệu search input
      {
        element: () => findSearchInput('customers-search', ['customer', 'khách hàng', 'name', 'tên', 'search', 'tìm']),
        popover: {
          title: t('customer.tour.search.title'),
          description: t('customer.tour.search.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 4: Giới thiệu Select All button
      {
        element: () =>
          findElementByTourAttr('customers-select-all', () => findButtonByText(['select all', 'chọn tất cả'])),
        popover: {
          title: t('customer.tour.select_all.title'),
          description: t('customer.tour.select_all.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 5: Giới thiệu customer table
      {
        element: () => {
          const element = findElementByTourAttr('customers-table') || (document.querySelector('table') as HTMLElement);
          if (element && isElementVisible(element)) {
            scrollIntoView(element);
            return element;
          }
          return undefined;
        },
        popover: {
          title: t('customer.tour.customer_table.title'),
          description: t('customer.tour.customer_table.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      },
      // Bước 6: Giới thiệu actions buttons (View, Edit, Toggle Status)
      {
        element: () => {
          const table = document.querySelector('[data-tour="customers-table"]') || document.querySelector('table');
          if (table) {
            const firstRow = table.querySelector('tbody tr');
            if (firstRow) {
              const actionsContainer = Array.from(firstRow.querySelectorAll('td')).find((td) => {
                const buttons = td.querySelectorAll('button');
                return buttons.length >= 2;
              });
              if (actionsContainer) {
                scrollIntoView(actionsContainer as HTMLElement);
                return actionsContainer as HTMLElement;
              }

              const viewButton = Array.from(firstRow.querySelectorAll('button')).find((btn) => {
                const icon = btn.querySelector('svg');
                return icon && icon.querySelector('path[d*="M"]') !== null;
              });
              if (viewButton) {
                scrollIntoView(viewButton as HTMLElement);
                return viewButton as HTMLElement;
              }
            }
          }
          return undefined;
        },
        popover: {
          title: t('customer.tour.actions_buttons.title'),
          description: t('customer.tour.actions_buttons.description'),
          side: 'left' as const,
          align: 'start' as const
        }
      },
      // Bước 7: Giới thiệu pagination
      {
        element: () => findPagination('customers-pagination'),
        popover: {
          title: t('customer.tour.pagination.title'),
          description: t('customer.tour.pagination.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      }
    ];

    startTour(steps, 'Customers');
  };

  return {
    startCustomersTour
  };
}
