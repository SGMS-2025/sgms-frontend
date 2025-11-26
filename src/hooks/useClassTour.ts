import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng Classes
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useClassTour() {
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
   * Khởi chạy tour hướng dẫn Classes
   * Tour sẽ hướng dẫn từ sidebar đến trang Classes và các tính năng chính
   */
  const startClassTour = () => {
    // Đợi một chút để đảm bảo DOM đã render
    setTimeout(() => {
      const steps = [
        // Bước 1: Giới thiệu menu Schedule trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const scheduleButton = document.querySelector('[data-tour="schedule-menu"]');
            if (scheduleButton) return scheduleButton as HTMLElement;

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

            return (scheduleMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('class.tour.sidebar_schedule.title'),
            description: t('class.tour.sidebar_schedule.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Hướng dẫn click vào Classes
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const classButton = document.querySelector('[data-tour="classes-menu-item"]');
            if (classButton) return classButton as HTMLElement;

            // Fallback: Tìm menu item Classes trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Classes" hoặc "Lớp học"
            const classMenu = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return (
                (text.includes('classes') || text.includes('lớp học')) &&
                !text.includes('work schedule') &&
                !text.includes('time off')
              );
            });

            return (classMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('class.tour.sidebar_classes.title'),
            description: t('class.tour.sidebar_classes.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 3: Giới thiệu nút tạo lớp học mới
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const createButton = document.querySelector('[data-tour="create-class-button"]');
            if (createButton) return createButton as HTMLElement;

            // Fallback: Tìm nút "New Class" hoặc "Tạo lớp học"
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              return (
                (text.includes('new class') ||
                  text.includes('tạo lớp') ||
                  text.includes('create') ||
                  text.includes('tạo')) &&
                !text.includes('hướng dẫn') &&
                !text.includes('guide')
              );
            });
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('class.tour.create_button.title'),
            description: t('class.tour.create_button.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 4: Giới thiệu phần tìm kiếm
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const searchContainer = document.querySelector('[data-tour="class-search-container"]');
            if (searchContainer) return searchContainer as HTMLElement;

            const searchInput = document.querySelector('[data-tour="class-search-input"]');
            if (searchInput) return searchInput as HTMLElement;

            // Fallback: Tìm input search trong phần Classes
            const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[placeholder]'));
            const classSearchInput = allInputs.find((input) => {
              const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
              return (
                (placeholder.includes('search classes') || placeholder.includes('tìm kiếm lớp')) &&
                !placeholder.includes('phone') &&
                !placeholder.includes('membership') &&
                !placeholder.includes('name, phone')
              );
            });
            return (classSearchInput as HTMLElement) || undefined;
          },
          popover: {
            title: t('class.tour.search.title'),
            description: t('class.tour.search.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 5: Giới thiệu filter trạng thái
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const statusFilter = document.querySelector('[data-tour="class-status-filter"]');
            if (statusFilter) return statusFilter as HTMLElement;

            // Fallback: Tìm select status filter
            const selects = Array.from(document.querySelectorAll('select, [role="combobox"]'));
            const statusSelect = selects.find((select) => {
              const text = select.textContent?.toLowerCase() || '';
              const label = select.getAttribute('aria-label')?.toLowerCase() || '';
              return (
                text.includes('active') ||
                text.includes('inactive') ||
                label.includes('status') ||
                label.includes('trạng thái')
              );
            });
            return (statusSelect as HTMLElement) || undefined;
          },
          popover: {
            title: t('class.tour.status_filter.title'),
            description: t('class.tour.status_filter.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 6: Giới thiệu chế độ xem (Card/Table)
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const viewToggle = document.querySelector('[data-tour="class-view-mode-toggle"]');
            if (viewToggle) return viewToggle as HTMLElement;

            // Fallback: Tìm phần view toggle buttons
            const viewToggleFallback = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              // Tìm div chứa buttons LayoutGrid và List
              if (className.includes('flex') && className.includes('gap')) {
                const buttons = el.querySelectorAll('button');
                if (buttons.length >= 2) {
                  const hasGridIcon = Array.from(buttons).some((btn) =>
                    btn.querySelector('svg')?.innerHTML.includes('LayoutGrid')
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
            title: t('class.tour.view_mode.title'),
            description: t('class.tour.view_mode.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 7: Giới thiệu danh sách lớp học
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const listTable = document.querySelector('[data-tour="class-list-table"]');
            if (listTable) return listTable as HTMLElement;

            const listCards = document.querySelector('[data-tour="class-list-cards"]');
            if (listCards) return listCards as HTMLElement;

            // Fallback: Tìm phần danh sách classes (grid cards hoặc table)
            const classList = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              // Tìm grid chứa cards hoặc table
              if (className.includes('grid') && className.includes('grid-cols')) {
                return el.querySelectorAll('[class*="card"], [class*="Card"]').length > 0;
              }
              if (className.includes('overflow-x-auto') && el.querySelector('table')) {
                return el.querySelector('tbody') !== null;
              }
              return false;
            });

            if (classList) {
              return classList as HTMLElement;
            }

            // Fallback: Tìm table
            const table = document.querySelector('table');
            return (table as HTMLElement) || undefined;
          },
          popover: {
            title: t('class.tour.class_list.title'),
            description: t('class.tour.class_list.description'),
            side: 'top',
            align: 'start'
          }
        },
        // Bước 8: Giới thiệu menu actions
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute - lấy button đầu tiên
            const actionsMenus = Array.from(document.querySelectorAll('[data-tour="class-actions-menu"]'));
            if (actionsMenus.length > 0) {
              return actionsMenus[0] as HTMLElement;
            }

            // Fallback: Tìm button có icon MoreVertical trong class list (button đầu tiên)
            const classListContainer =
              document.querySelector('[data-tour="class-list-table"]') ||
              document.querySelector('[data-tour="class-list-cards"]') ||
              document.querySelector('table tbody') ||
              document.querySelector('div[class*="grid"][class*="grid-cols"]');

            if (classListContainer) {
              const actionButton = Array.from(classListContainer.querySelectorAll('button')).find((btn) => {
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
            title: t('class.tour.actions_menu.title'),
            description: t('class.tour.actions_menu.description'),
            side: 'left',
            align: 'center'
          }
        },
        // Bước 9: Giới thiệu pagination
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const paginationContainer = document.querySelector('[data-tour="class-pagination"]');
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
                  className.includes('border-t') ||
                  text.includes('Previous') ||
                  text.includes('Next') ||
                  text.includes('Trước') ||
                  text.includes('Sau') ||
                  text.includes('Page')
                );
              });
            if (pagination) {
              // Scroll vào view
              pagination.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return (pagination as HTMLElement) || undefined;
          },
          popover: {
            title: t('class.tour.pagination.title'),
            description: t('class.tour.pagination.description'),
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
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang Classes.');
      }
    }, 800);
  };

  return {
    startClassTour
  };
}
