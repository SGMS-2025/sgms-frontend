import { useTourBase } from './useTourBase';
import { findSidebarElementWithScroll, findStatsCards, findPagination } from './tourUtils';

/**
 * Hook để tạo tour hướng dẫn sử dụng Payments
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function usePaymentsTour() {
  const { t, startTour } = useTourBase();

  /**
   * Khởi chạy tour hướng dẫn Payments
   * Tour sẽ hướng dẫn từ sidebar đến trang Payments và các tính năng chính
   */
  const startPaymentsTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Payments trong sidebar
      {
        element: () => findSidebarElementWithScroll('payments-menu-item', ['payment', 'thanh toán']),
        popover: {
          title: t('payment.tour.sidebar_payments.title'),
          description: t('payment.tour.sidebar_payments.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 2: Giới thiệu summary cards (toàn bộ 4 cards)
      {
        element: () => findStatsCards('payments-stats-cards', 4),
        popover: {
          title: t('payment.tour.stats_cards.title'),
          description: t('payment.tour.stats_cards.description'),
          side: 'right' as const,
          align: 'start' as const
        }
      },
      // Bước 3: Giới thiệu action buttons (Refresh, Export)
      {
        element: () => {
          // Ưu tiên tìm bằng data-tour attribute
          const actionButtons = document.querySelector('[data-tour="payments-action-buttons"]') as HTMLElement;
          if (actionButtons) {
            setTimeout(() => {
              actionButtons.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return actionButtons;
          }

          // Fallback: Tìm buttons container - tìm div chứa Refresh và Export buttons
          const buttonsContainer = Array.from(document.querySelectorAll('div')).find((el) => {
            const buttons = Array.from(el.querySelectorAll('button'));
            const hasRefresh = buttons.some((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              const hasRotateIcon = btn.querySelector('svg[class*="RotateCcw"]') !== null;
              return text.includes('refresh') || text.includes('làm mới') || hasRotateIcon;
            });
            const hasExport = buttons.some((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              const hasDownloadIcon = btn.querySelector('svg[class*="Download"]') !== null;
              return text.includes('export') || text.includes('xuất') || hasDownloadIcon;
            });
            return hasRefresh && hasExport;
          });
          if (buttonsContainer) {
            setTimeout(() => {
              buttonsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }
          return (buttonsContainer as HTMLElement) || undefined;
        },
        popover: {
          title: t('payment.tour.action_buttons.title'),
          description: t('payment.tour.action_buttons.description'),
          side: 'left',
          align: 'start'
        }
      },
      // Bước 4: Giới thiệu search input
      {
        element: () => {
          // Ưu tiên tìm bằng data-tour attribute
          const searchInput = document.querySelector('[data-tour="payments-search-input"]');
          if (searchInput) return searchInput as HTMLElement;

          // Fallback: Tìm search input
          const inputs = Array.from(document.querySelectorAll('input[type="text"]')).find((input) => {
            const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
            return (
              placeholder.includes('customer') ||
              placeholder.includes('transaction') ||
              placeholder.includes('khách hàng') ||
              placeholder.includes('giao dịch') ||
              placeholder.includes('search') ||
              placeholder.includes('tìm')
            );
          });
          return (inputs as HTMLElement) || undefined;
        },
        popover: {
          title: t('payment.tour.search.title'),
          description: t('payment.tour.search.description'),
          side: 'bottom',
          align: 'start'
        }
      },
      // Bước 5: Giới thiệu filters (Branch, Status, Date Range)
      {
        element: () => {
          // Ưu tiên tìm bằng data-tour attribute
          const filters = document.querySelector('[data-tour="payments-filters"]');
          if (filters) return filters as HTMLElement;

          // Fallback: Tìm filters container - tìm grid chứa các select và date picker
          const filtersContainer = Array.from(document.querySelectorAll('div')).find((el) => {
            const className = el.className || '';
            const hasSelects = el.querySelectorAll('select, [role="combobox"]').length >= 2;
            const hasDatePicker = el.querySelector('[class*="Calendar"], button[class*="calendar"]') !== null;
            return className.includes('grid') && (hasSelects || hasDatePicker);
          });
          return (filtersContainer as HTMLElement) || undefined;
        },
        popover: {
          title: t('payment.tour.filters.title'),
          description: t('payment.tour.filters.description'),
          side: 'bottom',
          align: 'start'
        }
      },
      // Bước 6: Giới thiệu transactions table
      {
        element: () => {
          // Ưu tiên tìm CardContent chứa filters và table (không bao gồm header)
          const transactionsContent = document.querySelector('[data-tour="payments-transactions-content"]');
          if (transactionsContent) {
            const rect = transactionsContent.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              setTimeout(() => {
                transactionsContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return transactionsContent as HTMLElement;
            }
          }

          // Fallback: Tìm container có data-tour attribute cho table
          const transactionsContainer = document.querySelector('[data-tour="payments-transactions-table"]');
          if (transactionsContainer) {
            const rect = transactionsContainer.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              setTimeout(() => {
                transactionsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return transactionsContainer as HTMLElement;
            }
          }

          // Fallback: Tìm table trực tiếp
          const table = document.querySelector('table');
          if (table) {
            const rect = table.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              setTimeout(() => {
                table.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return table as HTMLElement;
            }
          }

          return undefined;
        },
        popover: {
          title: t('payment.tour.transactions_table.title'),
          description: t('payment.tour.transactions_table.description'),
          side: 'top',
          align: 'start'
        }
      },
      // Bước 7: Giới thiệu pagination
      {
        element: () => findPagination('payments-pagination'),
        popover: {
          title: t('payment.tour.pagination.title'),
          description: t('payment.tour.pagination.description'),
          side: 'top',
          align: 'start'
        }
      }
    ];

    startTour(steps, 'Payments');
  };

  return {
    startPaymentsTour
  };
}
