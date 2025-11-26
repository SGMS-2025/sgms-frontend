import { useTourBase } from './useTourBase';
import {
  findElementByTourAttr,
  findButtonByText,
  findSelectByText,
  findSidebarElementWithScroll,
  findSearchInput,
  findViewModeToggle,
  findPagination,
  findActionsMenu
} from './tourUtils';

/**
 * Hook để tạo tour hướng dẫn sử dụng Classes
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useClassTour() {
  const { t, startTour } = useTourBase();

  /**
   * Khởi chạy tour hướng dẫn Classes
   * Tour sẽ hướng dẫn từ sidebar đến trang Classes và các tính năng chính
   */
  const startClassTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Schedule trong sidebar
      {
        element: () =>
          findSidebarElementWithScroll('schedule-menu', ['schedule', 'lịch trình'], ['work schedule', 'time off']),
        popover: {
          title: t('class.tour.sidebar_schedule.title'),
          description: t('class.tour.sidebar_schedule.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 2: Hướng dẫn click vào Classes
      {
        element: () =>
          findSidebarElementWithScroll('classes-menu-item', ['classes', 'lớp học'], ['work schedule', 'time off']),
        popover: {
          title: t('class.tour.sidebar_classes.title'),
          description: t('class.tour.sidebar_classes.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 3: Giới thiệu nút tạo lớp học mới
      {
        element: () =>
          findElementByTourAttr('create-class-button', () =>
            findButtonByText(['new class', 'tạo lớp', 'create', 'tạo'], ['hướng dẫn', 'guide'])
          ),
        popover: {
          title: t('class.tour.create_button.title'),
          description: t('class.tour.create_button.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 4: Giới thiệu phần tìm kiếm
      {
        element: () =>
          findSearchInput('class-search', ['search classes', 'tìm kiếm lớp'], ['phone', 'membership', 'name, phone']),
        popover: {
          title: t('class.tour.search.title'),
          description: t('class.tour.search.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 5: Giới thiệu filter trạng thái
      {
        element: () =>
          findElementByTourAttr('class-status-filter', () =>
            findSelectByText(['active', 'inactive', 'status', 'trạng thái'])
          ),
        popover: {
          title: t('class.tour.status_filter.title'),
          description: t('class.tour.status_filter.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 6: Giới thiệu chế độ xem (Card/Table)
      {
        element: () => findViewModeToggle('class-view-mode-toggle'),
        popover: {
          title: t('class.tour.view_mode.title'),
          description: t('class.tour.view_mode.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 7: Giới thiệu danh sách lớp học
      {
        element: () => {
          const table = findElementByTourAttr('class-list-table');
          if (table) return table;

          const cards = findElementByTourAttr('class-list-cards');
          if (cards) return cards;

          const classList = Array.from(document.querySelectorAll('div')).find((el) => {
            const className = el.className || '';
            if (className.includes('grid') && className.includes('grid-cols')) {
              return el.querySelectorAll('[class*="card"], [class*="Card"]').length > 0;
            }
            if (className.includes('overflow-x-auto') && el.querySelector('table')) {
              return el.querySelector('tbody') !== null;
            }
            return false;
          });

          return (classList as HTMLElement) || (document.querySelector('table') as HTMLElement) || undefined;
        },
        popover: {
          title: t('class.tour.class_list.title'),
          description: t('class.tour.class_list.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      },
      // Bước 8: Giới thiệu menu actions
      {
        element: () =>
          findActionsMenu('class-actions-menu', '[data-tour="class-list-table"], [data-tour="class-list-cards"]'),
        popover: {
          title: t('class.tour.actions_menu.title'),
          description: t('class.tour.actions_menu.description'),
          side: 'left' as const,
          align: 'center' as const
        }
      },
      // Bước 9: Giới thiệu pagination
      {
        element: () => findPagination('class-pagination'),
        popover: {
          title: t('class.tour.pagination.title'),
          description: t('class.tour.pagination.description'),
          side: 'right' as const,
          align: 'start' as const
        }
      }
    ];

    startTour(steps, 'Classes');
  };

  return {
    startClassTour
  };
}
