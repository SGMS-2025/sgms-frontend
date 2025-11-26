import { useTourBase } from './useTourBase';
import {
  findElementByTourAttr,
  findButtonByText,
  findSelectByText,
  findSidebarElementWithScroll,
  findSearchInput,
  findPagination,
  scrollIntoView
} from './tourUtils';

/**
 * Hook để tạo tour hướng dẫn sử dụng Contracts
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useContractsTour() {
  const { t, startTour } = useTourBase();

  /**
   * Khởi chạy tour hướng dẫn Contracts
   * Tour sẽ hướng dẫn từ sidebar đến trang Contracts và các tính năng chính
   */
  const startContractsTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Contracts trong sidebar
      {
        element: () => findSidebarElementWithScroll('contracts-menu-item', ['contracts', 'hợp đồng']),
        popover: {
          title: t('contracts.tour.sidebar_contracts.title'),
          description: t('contracts.tour.sidebar_contracts.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 2: Giới thiệu nút Upload Document
      {
        element: () =>
          findElementByTourAttr('contracts-upload-button', () => findButtonByText(['upload document', 'tải lên'])),
        popover: {
          title: t('contracts.tour.upload_button.title'),
          description: t('contracts.tour.upload_button.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 3: Giới thiệu tabs (Templates/Customer Contracts)
      {
        element: () => {
          const element = findElementByTourAttr('contracts-tabs');
          if (element) return element;

          return Array.from(document.querySelectorAll('[role="tablist"], [class*="TabsList"]')).find((el) => {
            const text = el.textContent?.toLowerCase() || '';
            return (
              text.includes('templates') ||
              text.includes('customer contracts') ||
              text.includes('mẫu') ||
              text.includes('hợp đồng khách hàng')
            );
          }) as HTMLElement | undefined;
        },
        popover: {
          title: t('contracts.tour.tabs.title'),
          description: t('contracts.tour.tabs.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 4: Giới thiệu search input
      {
        element: () => findSearchInput('contracts-search', ['search', 'tìm']),
        popover: {
          title: t('contracts.tour.search.title'),
          description: t('contracts.tour.search.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 5: Giới thiệu status filter
      {
        element: () =>
          findElementByTourAttr('contracts-status-filter', () => findSelectByText(['status', 'trạng thái'])),
        popover: {
          title: t('contracts.tour.status_filter.title'),
          description: t('contracts.tour.status_filter.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 6: Giới thiệu documents list
      {
        element: () => {
          const element = findElementByTourAttr('contracts-documents-list', () => {
            return Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              return (
                (className.includes('divide-y') || className.includes('border')) &&
                Array.from(el.querySelectorAll('[class*="FileText"], [class*="file"]')).length > 0
              );
            }) as HTMLElement | undefined;
          });
          if (element) scrollIntoView(element);
          return element;
        },
        popover: {
          title: t('contracts.tour.documents_list.title'),
          description: t('contracts.tour.documents_list.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      },
      // Bước 7: Giới thiệu actions buttons (View, Edit, Send, Delete)
      {
        element: () => {
          const documentsList = document.querySelector('[data-tour="contracts-documents-list"]');
          let firstDocument: HTMLElement | null = null;

          if (documentsList) {
            firstDocument = documentsList.querySelector(
              'div[class*="hover:bg-gray-50"], div[class*="p-4"]'
            ) as HTMLElement;
          } else {
            const list = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              return (
                (className.includes('divide-y') || className.includes('border')) &&
                Array.from(el.querySelectorAll('[class*="FileText"]')).length > 0
              );
            });
            if (list) {
              firstDocument = list.querySelector('div[class*="hover:bg-gray-50"], div[class*="p-4"]') as HTMLElement;
            }
          }

          if (firstDocument) {
            const actionsContainer = firstDocument.querySelector('[data-tour="contracts-actions-buttons"]');
            if (actionsContainer) {
              scrollIntoView(actionsContainer as HTMLElement);
              return actionsContainer as HTMLElement;
            }

            const buttonsContainer = Array.from(firstDocument.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              return (
                className.includes('flex') &&
                className.includes('gap') &&
                Array.from(el.querySelectorAll('button')).length >= 2
              );
            });
            if (buttonsContainer) {
              scrollIntoView(buttonsContainer as HTMLElement);
              return buttonsContainer as HTMLElement;
            }
          }

          return undefined;
        },
        popover: {
          title: t('contracts.tour.actions_buttons.title'),
          description: t('contracts.tour.actions_buttons.description'),
          side: 'left' as const,
          align: 'start' as const
        }
      },
      // Bước 8: Giới thiệu pagination
      {
        element: () => findPagination('contracts-pagination'),
        popover: {
          title: t('contracts.tour.pagination.title'),
          description: t('contracts.tour.pagination.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      }
    ];

    startTour(steps, 'Contracts');
  };

  return {
    startContractsTour
  };
}
