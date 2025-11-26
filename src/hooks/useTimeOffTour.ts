import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng Time Off
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useTimeOffTour() {
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
   * Khởi chạy tour hướng dẫn Time Off
   * Tour sẽ hướng dẫn từ sidebar đến trang Time Off và các tính năng chính
   */
  const startTimeOffTour = () => {
    // Đợi một chút để đảm bảo DOM đã render, đặc biệt là stats cards
    setTimeout(() => {
      const steps = [
        // Bước 1: Giới thiệu menu Schedule trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const scheduleButton = document.querySelector('[data-tour="schedule-menu"]');
            if (scheduleButton) {
              setTimeout(() => {
                scheduleButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return scheduleButton as HTMLElement;
            }

            // Fallback: Tìm menu Schedule trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Schedule" hoặc "Lịch trình"
            const scheduleMenu = Array.from(sidebar.querySelectorAll('button')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
              return (
                (text.includes('schedule') ||
                  text.includes('lịch trình') ||
                  ariaLabel.includes('schedule') ||
                  ariaLabel.includes('lịch trình')) &&
                !text.includes('work schedule') &&
                !text.includes('time off')
              );
            });

            if (scheduleMenu) {
              setTimeout(() => {
                scheduleMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }

            return (scheduleMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('timeoff.tour.sidebar_schedule.title'),
            description: t('timeoff.tour.sidebar_schedule.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Giới thiệu menu Time Off trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const timeOffButton = document.querySelector('[data-tour="timeoff-menu-item"]');
            if (timeOffButton) {
              setTimeout(() => {
                timeOffButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return timeOffButton as HTMLElement;
            }

            // Fallback: Tìm menu item Time Off trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Time Off" hoặc "Nghỉ phép"
            const timeOffMenu = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
              return (
                (text.includes('time off') ||
                  text.includes('nghỉ phép') ||
                  ariaLabel.includes('time off') ||
                  ariaLabel.includes('nghỉ phép')) &&
                !text.includes('work schedule')
              );
            });

            if (timeOffMenu) {
              setTimeout(() => {
                timeOffMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }

            return (timeOffMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('timeoff.tour.sidebar_timeoff.title'),
            description: t('timeoff.tour.sidebar_timeoff.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 3: Giới thiệu thống kê Time Off
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const statsContainer = document.querySelector('[data-tour="timeoff-stats-cards"]');
            if (statsContainer) {
              // Scroll vào view để đảm bảo stats cards hiển thị đầy đủ
              setTimeout(() => {
                statsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return statsContainer as HTMLElement;
            }

            // Fallback: Tìm phần stats cards (có 4 cards: Total, Pending, Approved, Rejected)
            const statsContainerFallback = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              // Tìm grid chứa stats cards
              if (className.includes('grid') && className.includes('grid-cols')) {
                const cards = el.querySelectorAll('[class*="card"], [class*="Card"]');
                if (cards.length >= 4) {
                  const text = el.textContent?.toLowerCase() || '';
                  return (
                    text.includes('total') ||
                    text.includes('pending') ||
                    text.includes('approved') ||
                    text.includes('rejected') ||
                    text.includes('tổng') ||
                    text.includes('đang chờ') ||
                    text.includes('đã duyệt') ||
                    text.includes('đã từ chối')
                  );
                }
              }
              return false;
            });
            if (statsContainerFallback) {
              // Scroll vào view
              setTimeout(() => {
                statsContainerFallback.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }
            return (statsContainerFallback as HTMLElement) || undefined;
          },
          popover: {
            title: t('timeoff.tour.stats_cards.title'),
            description: t('timeoff.tour.stats_cards.description'),
            side: 'right',
            align: 'start'
          }
        },
        // Bước 4: Giới thiệu nút tạo yêu cầu nghỉ phép
        {
          element: () => {
            // Tìm nút Create Time Off Request
            const createButton =
              document.querySelector('[data-tour="create-timeoff-button"]') ||
              Array.from(document.querySelectorAll('button')).find((btn) => {
                const text = btn.textContent?.toLowerCase() || '';
                return (
                  (text.includes('create') ||
                    text.includes('tạo') ||
                    text.includes('request') ||
                    text.includes('yêu cầu')) &&
                  !text.includes('hướng dẫn') &&
                  !text.includes('guide')
                );
              });
            return (createButton as HTMLElement) || undefined;
          },
          popover: {
            title: t('timeoff.tour.create_button.title'),
            description: t('timeoff.tour.create_button.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 5: Giới thiệu phần tìm kiếm
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const searchContainer = document.querySelector('[data-tour="timeoff-search-container"]');
            if (searchContainer) return searchContainer as HTMLElement;

            const searchInput = document.querySelector('[data-tour="timeoff-search-input"]');
            if (searchInput) return searchInput as HTMLElement;

            // Fallback: Tìm input search trong phần Time Off
            const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[placeholder]'));
            const timeOffSearchInput = allInputs.find((input) => {
              const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
              return (
                (placeholder.includes('search') || placeholder.includes('tìm kiếm')) &&
                !placeholder.includes('phone') &&
                !placeholder.includes('membership') &&
                !placeholder.includes('name, phone')
              );
            });
            return (timeOffSearchInput as HTMLElement) || undefined;
          },
          popover: {
            title: t('timeoff.tour.search.title'),
            description: t('timeoff.tour.search.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 6: Giới thiệu filter trạng thái
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const statusFilter = document.querySelector('[data-tour="timeoff-status-filter"]');
            if (statusFilter) return statusFilter as HTMLElement;

            // Fallback: Tìm select status filter
            const selects = Array.from(document.querySelectorAll('select, [role="combobox"]'));
            const statusSelect = selects.find((select) => {
              const placeholder = select.textContent?.toLowerCase() || '';
              const label = select.getAttribute('aria-label')?.toLowerCase() || '';
              return (
                (placeholder.includes('status') ||
                  placeholder.includes('trạng thái') ||
                  label.includes('status') ||
                  label.includes('trạng thái')) &&
                !placeholder.includes('type') &&
                !placeholder.includes('loại')
              );
            });
            return (statusSelect as HTMLElement) || undefined;
          },
          popover: {
            title: t('timeoff.tour.status_filter.title'),
            description: t('timeoff.tour.status_filter.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 7: Giới thiệu filter loại nghỉ phép
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const typeFilter = document.querySelector('[data-tour="timeoff-type-filter"]');
            if (typeFilter) return typeFilter as HTMLElement;

            // Fallback: Tìm select type filter
            const selects = Array.from(document.querySelectorAll('select, [role="combobox"]'));
            const typeSelect = selects.find((select) => {
              const placeholder = select.textContent?.toLowerCase() || '';
              const label = select.getAttribute('aria-label')?.toLowerCase() || '';
              return (
                (placeholder.includes('type') ||
                  placeholder.includes('loại') ||
                  label.includes('type') ||
                  label.includes('loại')) &&
                !placeholder.includes('status') &&
                !placeholder.includes('trạng thái')
              );
            });
            return (typeSelect as HTMLElement) || undefined;
          },
          popover: {
            title: t('timeoff.tour.type_filter.title'),
            description: t('timeoff.tour.type_filter.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 8: Giới thiệu date range filter
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const dateRangeFilter = document.querySelector('[data-tour="timeoff-date-range-filter"]');
            if (dateRangeFilter) return dateRangeFilter as HTMLElement;

            // Fallback: Tìm date range picker
            const dateRangePicker = Array.from(document.querySelectorAll('button, div')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              const placeholder = el.getAttribute('placeholder')?.toLowerCase() || '';
              return (
                (text.includes('select date range') ||
                  text.includes('chọn khoảng ngày') ||
                  placeholder.includes('select date range') ||
                  placeholder.includes('chọn khoảng ngày') ||
                  text.includes('date range') ||
                  text.includes('khoảng ngày')) &&
                !text.includes('start date') &&
                !text.includes('end date')
              );
            });
            return (dateRangePicker as HTMLElement) || undefined;
          },
          popover: {
            title: t('timeoff.tour.date_range_filter.title'),
            description: t('timeoff.tour.date_range_filter.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 9: Giới thiệu chế độ xem (Card/Table)
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const viewToggle = document.querySelector('[data-tour="timeoff-view-mode-toggle"]');
            if (viewToggle) return viewToggle as HTMLElement;

            // Fallback: Tìm phần view toggle buttons
            const viewToggleFallback = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              // Tìm div chứa buttons Grid3X3 và List
              if (className.includes('bg-gray-100') || className.includes('rounded-lg')) {
                const buttons = el.querySelectorAll('button');
                if (buttons.length >= 2) {
                  const hasGridIcon = Array.from(buttons).some((btn) =>
                    btn.querySelector('svg')?.innerHTML.includes('Grid3X3')
                  );
                  const hasListIcon = Array.from(buttons).some((btn) =>
                    btn.querySelector('svg')?.innerHTML.includes('List')
                  );
                  return hasGridIcon && hasListIcon;
                }
              }
              return false;
            });
            return (viewToggleFallback as HTMLElement) || undefined;
          },
          popover: {
            title: t('timeoff.tour.view_mode.title'),
            description: t('timeoff.tour.view_mode.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 10: Giới thiệu một card trong danh sách yêu cầu nghỉ phép
        {
          element: () => {
            // Ưu tiên tìm card đầu tiên bằng data-tour attribute
            const timeOffCard = document.querySelector('[data-tour="timeoff-card-item"]');
            if (timeOffCard) {
              setTimeout(() => {
                timeOffCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return timeOffCard as HTMLElement;
            }

            // Fallback: Tìm card đầu tiên trong list
            const listCards = document.querySelector('[data-tour="timeoff-list-cards"]');
            if (listCards) {
              const firstCard = listCards.querySelector('[class*="Card"]');
              if (firstCard) {
                setTimeout(() => {
                  firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return firstCard as HTMLElement;
              }
            }

            // Fallback: Tìm card đầu tiên trong grid
            const grid = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              return (
                className.includes('grid') &&
                className.includes('grid-cols') &&
                el.querySelectorAll('[class*="Card"]').length > 0
              );
            });
            if (grid) {
              const firstCard = grid.querySelector('[class*="Card"]');
              if (firstCard) {
                setTimeout(() => {
                  firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return firstCard as HTMLElement;
              }
            }

            return undefined;
          },
          popover: {
            title: t('timeoff.tour.timeoff_list.title'),
            description: t('timeoff.tour.timeoff_list.description'),
            side: 'top',
            align: 'start'
          }
        },
        // Bước 11: Giới thiệu menu actions (dấu 3 chấm)
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute - lấy button đầu tiên
            const actionsMenus = Array.from(document.querySelectorAll('[data-tour="timeoff-actions-menu"]'));
            if (actionsMenus.length > 0) {
              return actionsMenus[0] as HTMLElement;
            }

            // Fallback: Tìm button có icon MoreVertical trong time off list (button đầu tiên)
            const timeOffListContainer =
              document.querySelector('[data-tour="timeoff-list-table"]') ||
              document.querySelector('[data-tour="timeoff-list-cards"]') ||
              document.querySelector('table tbody') ||
              document.querySelector('div[class*="grid"][class*="grid-cols"]');

            if (timeOffListContainer) {
              const actionButton = Array.from(timeOffListContainer.querySelectorAll('button')).find((btn) => {
                const svg = btn.querySelector('svg');
                if (!svg) return false;
                // Kiểm tra icon MoreVertical
                const path = svg.querySelector('path');
                return path && (btn.closest('td') || btn.closest('[class*="card"]'));
              });
              if (actionButton) return actionButton as HTMLElement;
            }

            return undefined;
          },
          popover: {
            title: t('timeoff.tour.actions_menu.title'),
            description: t('timeoff.tour.actions_menu.description'),
            side: 'left',
            align: 'center'
          }
        },
        // Bước 12: Giới thiệu pagination
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const paginationContainer = document.querySelector('[data-tour="timeoff-pagination"]');
            if (paginationContainer) {
              // Scroll vào view để đảm bảo pagination hiển thị đầy đủ
              paginationContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return paginationContainer as HTMLElement;
            }

            // Fallback: Tìm phần pagination
            const pagination =
              document.querySelector('[class*="pagination"]') ||
              Array.from(document.querySelectorAll('div')).find((el) => {
                const className = el.className || '';
                const text = el.textContent || '';
                return (
                  className.includes('pagination') ||
                  text.includes('Previous') ||
                  text.includes('Next') ||
                  text.includes('Trước') ||
                  text.includes('Sau')
                );
              });
            if (pagination) {
              // Scroll vào view
              pagination.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return (pagination as HTMLElement) || undefined;
          },
          popover: {
            title: t('timeoff.tour.pagination.title'),
            description: t('timeoff.tour.pagination.description'),
            side: 'right',
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
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang Time Off.');
      }
    }, 800);
  };

  return {
    startTimeOffTour
  };
}
