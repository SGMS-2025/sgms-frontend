import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng Payments
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function usePaymentsTour() {
  const { t } = useTranslation();
  const { startTour } = useDriver({
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
  });

  /**
   * Khởi chạy tour hướng dẫn Payments
   * Tour sẽ hướng dẫn từ sidebar đến trang Payments và các tính năng chính
   */
  const startPaymentsTour = () => {
    // Đợi một chút để đảm bảo DOM đã render, đặc biệt là các buttons và stats
    setTimeout(() => {
      const steps = [
        // Bước 1: Giới thiệu menu Payments trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const paymentsButton = document.querySelector('[data-tour="payments-menu-item"]');
            if (paymentsButton) {
              setTimeout(() => {
                paymentsButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return paymentsButton as HTMLElement;
            }

            // Fallback: Tìm menu Payments trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Payments" hoặc "Thanh toán"
            const paymentsMenu = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return text.includes('payment') || text.includes('thanh toán');
            });

            if (paymentsMenu) {
              setTimeout(() => {
                paymentsMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }

            return (paymentsMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('payment.tour.sidebar_payments.title'),
            description: t('payment.tour.sidebar_payments.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Giới thiệu summary cards (toàn bộ 4 cards)
        {
          element: () => {
            // Ưu tiên tìm grid container chứa toàn bộ 4 cards bằng data-tour attribute
            const statsCards = document.querySelector('[data-tour="payments-stats-cards"]');
            if (statsCards) {
              const rect = statsCards.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTimeout(() => {
                  statsCards.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return statsCards as HTMLElement;
              }
            }

            // Fallback: Tìm grid chứa các cards - tìm div có grid và chứa 4 cards
            const stats = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              const hasGrid =
                className.includes('grid') &&
                (className.includes('md:grid-cols-2') || className.includes('lg:grid-cols-4'));
              const cardCount = Array.from(el.querySelectorAll('[class*="Card"]')).length;
              return hasGrid && cardCount >= 4;
            });

            if (stats) {
              const rect = stats.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTimeout(() => {
                  stats.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return stats as HTMLElement;
              }
            }

            return undefined;
          },
          popover: {
            title: t('payment.tour.stats_cards.title'),
            description: t('payment.tour.stats_cards.description'),
            side: 'right',
            align: 'start'
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
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const pagination = document.querySelector('[data-tour="payments-pagination"]') as HTMLElement;
            if (pagination) {
              const rect = pagination.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTimeout(() => {
                  pagination.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return pagination;
              }
            }

            // Fallback: Tìm pagination component - tìm nav có class Pagination
            const paginationNav = document.querySelector('nav[class*="Pagination"]') as HTMLElement;
            if (paginationNav) {
              const rect = paginationNav.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTimeout(() => {
                  paginationNav.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return paginationNav;
              }
            }

            // Fallback: Tìm div chứa pagination
            const paginationContainer = Array.from(document.querySelectorAll('div')).find((el) => {
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
              return hasPaginationNav || hasPaginationButtons || className.includes('Pagination');
            }) as HTMLElement | undefined;

            if (paginationContainer) {
              setTimeout(() => {
                paginationContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return paginationContainer;
            }

            return undefined;
          },
          popover: {
            title: t('payment.tour.pagination.title'),
            description: t('payment.tour.pagination.description'),
            side: 'top',
            align: 'start'
          }
        }
      ];

      // Lọc bỏ các step có element undefined và chuyển đổi element function
      const validSteps: Config['steps'] = [];
      for (const step of steps) {
        let element: HTMLElement | undefined;
        if (typeof step.element === 'function') {
          element = step.element() || undefined;
        } else {
          element = step.element || undefined;
        }

        if (element) {
          validSteps.push({
            element,
            popover: {
              title: step.popover.title,
              description: step.popover.description,
              side: step.popover.side as 'top' | 'bottom' | 'left' | 'right',
              align: step.popover.align as 'start' | 'center' | 'end'
            }
          });
        }
      }

      if (validSteps.length > 0) {
        startTour(validSteps);
      } else {
        // Nếu không tìm thấy elements, hiển thị thông báo
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang Payments.');
      }
    }, 800);
  };

  return {
    startPaymentsTour
  };
}
