import { useTourBase } from './useTourBase';
import {
  findElementByTourAttr,
  findButtonByText,
  findSelectByText,
  findSidebarElementWithScroll,
  findSearchInput,
  findViewModeToggle,
  findPagination,
  findActionsMenu,
  findStatsCards,
  findFirstCardInGrid,
  scrollIntoView
} from './tourUtils';

/**
 * Hook để tạo tour hướng dẫn sử dụng Time Off
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useTimeOffTour() {
  const { t, startTour } = useTourBase();

  /**
   * Khởi chạy tour hướng dẫn Time Off
   * Tour sẽ hướng dẫn từ sidebar đến trang Time Off và các tính năng chính
   */
  const startTimeOffTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Schedule trong sidebar
      {
        element: () =>
          findSidebarElementWithScroll('schedule-menu', ['schedule', 'lịch trình'], ['work schedule', 'time off']),
        popover: {
          title: t('timeoff.tour.sidebar_schedule.title'),
          description: t('timeoff.tour.sidebar_schedule.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 2: Giới thiệu menu Time Off trong sidebar
      {
        element: () => findSidebarElementWithScroll('timeoff-menu-item', ['time off', 'nghỉ phép'], ['work schedule']),
        popover: {
          title: t('timeoff.tour.sidebar_timeoff.title'),
          description: t('timeoff.tour.sidebar_timeoff.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 3: Giới thiệu thống kê Time Off
      {
        element: () =>
          findStatsCards('timeoff-stats-cards', 4, [
            'total',
            'pending',
            'approved',
            'rejected',
            'tổng',
            'đang chờ',
            'đã duyệt',
            'đã từ chối'
          ]),
        popover: {
          title: t('timeoff.tour.stats_cards.title'),
          description: t('timeoff.tour.stats_cards.description'),
          side: 'right' as const,
          align: 'start' as const
        }
      },
      // Bước 4: Giới thiệu nút tạo yêu cầu nghỉ phép
      {
        element: () =>
          findElementByTourAttr('create-timeoff-button', () =>
            findButtonByText(['create', 'tạo', 'request', 'yêu cầu'], ['hướng dẫn', 'guide'])
          ),
        popover: {
          title: t('timeoff.tour.create_button.title'),
          description: t('timeoff.tour.create_button.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 5: Giới thiệu phần tìm kiếm
      {
        element: () =>
          findSearchInput('timeoff-search', ['search', 'tìm kiếm'], ['phone', 'membership', 'name, phone']),
        popover: {
          title: t('timeoff.tour.search.title'),
          description: t('timeoff.tour.search.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 6: Giới thiệu filter trạng thái
      {
        element: () =>
          findElementByTourAttr('timeoff-status-filter', () =>
            findSelectByText(['status', 'trạng thái'], ['type', 'loại'])
          ),
        popover: {
          title: t('timeoff.tour.status_filter.title'),
          description: t('timeoff.tour.status_filter.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 7: Giới thiệu filter loại nghỉ phép
      {
        element: () =>
          findElementByTourAttr('timeoff-type-filter', () =>
            findSelectByText(['type', 'loại'], ['status', 'trạng thái'])
          ),
        popover: {
          title: t('timeoff.tour.type_filter.title'),
          description: t('timeoff.tour.type_filter.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 8: Giới thiệu date range filter
      {
        element: () => {
          const element = findElementByTourAttr('timeoff-date-range-filter');
          if (element) return element;

          return Array.from(document.querySelectorAll('button, div')).find((el) => {
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
          }) as HTMLElement | undefined;
        },
        popover: {
          title: t('timeoff.tour.date_range_filter.title'),
          description: t('timeoff.tour.date_range_filter.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 9: Giới thiệu chế độ xem (Card/Table)
      {
        element: () => findViewModeToggle('timeoff-view-mode-toggle', 'Grid3X3', 'List'),
        popover: {
          title: t('timeoff.tour.view_mode.title'),
          description: t('timeoff.tour.view_mode.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 10: Giới thiệu một card trong danh sách yêu cầu nghỉ phép
      {
        element: () => {
          const element = findElementByTourAttr('timeoff-card-item');
          if (element) {
            scrollIntoView(element);
            return element;
          }
          return findFirstCardInGrid('timeoff-list-cards');
        },
        popover: {
          title: t('timeoff.tour.timeoff_list.title'),
          description: t('timeoff.tour.timeoff_list.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      },
      // Bước 11: Giới thiệu menu actions (dấu 3 chấm)
      {
        element: () =>
          findActionsMenu('timeoff-actions-menu', '[data-tour="timeoff-list-table"], [data-tour="timeoff-list-cards"]'),
        popover: {
          title: t('timeoff.tour.actions_menu.title'),
          description: t('timeoff.tour.actions_menu.description'),
          side: 'left' as const,
          align: 'center' as const
        }
      },
      // Bước 12: Giới thiệu pagination
      {
        element: () => findPagination('timeoff-pagination'),
        popover: {
          title: t('timeoff.tour.pagination.title'),
          description: t('timeoff.tour.pagination.description'),
          side: 'right' as const,
          align: 'start' as const
        }
      }
    ];

    startTour(steps, 'Time Off');
  };

  return {
    startTimeOffTour
  };
}
