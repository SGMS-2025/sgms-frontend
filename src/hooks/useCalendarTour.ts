import { useTourBase } from './useTourBase';
import { findElementByTourAttr, findButtonByText, findSidebarElementWithScroll } from './tourUtils';

/**
 * Hook để tạo tour hướng dẫn sử dụng Calendar (Work Schedule)
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useCalendarTour() {
  const { t, startTour } = useTourBase({ popoverOffset: 2 });

  /**
   * Khởi chạy tour hướng dẫn Calendar
   * Tour sẽ hướng dẫn từ sidebar đến trang Calendar và các tính năng chính
   */
  const startCalendarTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Schedule trong sidebar
      {
        element: () =>
          findSidebarElementWithScroll('schedule-menu', ['schedule', 'lịch trình'], ['work schedule', 'time off']),
        popover: {
          title: t('calendar.tour.sidebar_schedule.title'),
          description: t('calendar.tour.sidebar_schedule.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 2: Hướng dẫn click vào Work Schedule
      {
        element: () =>
          findSidebarElementWithScroll(
            'work-schedule-menu-item',
            ['work schedule', 'lịch làm việc'],
            ['time off', 'schedule template']
          ),
        popover: {
          title: t('calendar.tour.sidebar_work_schedule.title'),
          description: t('calendar.tour.sidebar_work_schedule.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 3: Giới thiệu điều hướng tháng/tuần
      {
        element: () => {
          const todayButton = Array.from(document.querySelectorAll('button')).find((btn) => {
            const text = btn.textContent?.toLowerCase() || '';
            return text.includes('today') || text.includes('hôm nay');
          });

          if (todayButton?.parentElement) {
            const container = todayButton.parentElement;
            if (container.querySelectorAll('button').length >= 3) {
              return container as HTMLElement;
            }
          }

          return (todayButton as HTMLElement) || undefined;
        },
        popover: {
          title: t('calendar.tour.navigation.title'),
          description: t('calendar.tour.navigation.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 4: Giới thiệu bộ lọc nhân viên
      {
        element: () => {
          const element = findElementByTourAttr('staff-selector');
          if (element) return element;

          return Array.from(document.querySelectorAll('button, [role="combobox"]')).find((el) => {
            const text = el.textContent?.toLowerCase() || '';
            return (
              text.includes('all staff') ||
              text.includes('tất cả nhân viên') ||
              text.includes('select staff') ||
              text.includes('chọn nhân viên')
            );
          }) as HTMLElement | undefined;
        },
        popover: {
          title: t('calendar.tour.staff_filter.title'),
          description: t('calendar.tour.staff_filter.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 5: Giới thiệu thiết lập cấu hình làm việc cho nhân viên
      {
        element: () =>
          findElementByTourAttr('create-workshift-button', () =>
            findButtonByText(['tạo', 'create'], ['hướng dẫn', 'guide'])
          ),
        popover: {
          title: t('calendar.tour.work_config.title'),
          description: t('calendar.tour.work_config.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 6: Giới thiệu chú giải màu sắc
      {
        element: () => {
          const legendContainer = Array.from(document.querySelectorAll('div')).find((el) => {
            const className = el.className || '';
            const text = el.textContent?.toLowerCase() || '';
            const hasLegendText =
              text.includes('scheduled') ||
              text.includes('pending') ||
              text.includes('cancelled') ||
              text.includes('past') ||
              text.includes('đã lên lịch') ||
              text.includes('đang chờ') ||
              text.includes('đã hủy') ||
              text.includes('quá khứ');
            const hasColorIndicators = el.querySelectorAll('div[class*="border-l-4"]').length >= 4;
            return (
              className.includes('flex') &&
              className.includes('items-center') &&
              className.includes('gap-3') &&
              hasLegendText &&
              hasColorIndicators
            );
          });

          return (legendContainer as HTMLElement) || undefined;
        },
        popover: {
          title: t('calendar.tour.legend.title'),
          description: t('calendar.tour.legend.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 7: Giới thiệu lưới lịch
      {
        element: () => {
          const calendarGrid = Array.from(document.querySelectorAll('div')).find((el) => {
            const className = el.className || '';
            if (className.includes('flex-1') && className.includes('overflow-hidden')) {
              const hasShiftCells = el.querySelectorAll('button').length > 0;
              const hasTimeSlots =
                el.textContent?.includes('5am') ||
                el.textContent?.includes('1pm') ||
                el.textContent?.includes('5:30pm') ||
                el.textContent?.includes('Sáng') ||
                el.textContent?.includes('Chiều') ||
                el.textContent?.includes('Tối');
              return hasShiftCells || hasTimeSlots;
            }
            return false;
          });

          if (calendarGrid) {
            return calendarGrid as HTMLElement;
          }

          const weekGrid = Array.from(document.querySelectorAll('div')).find((el) => {
            const text = el.textContent || '';
            const className = el.className || '';
            return (
              (text.includes('Thứ 2') || text.includes('Monday') || text.includes('Thứ 3')) &&
              (className.includes('grid') || className.includes('flex')) &&
              el.querySelectorAll('button').length > 0
            );
          });

          return (weekGrid as HTMLElement) || undefined;
        },
        popover: {
          title: t('calendar.tour.calendar_grid.title'),
          description: t('calendar.tour.calendar_grid.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      }
    ];

    startTour(steps, 'Calendar', 500);
  };

  return {
    startCalendarTour
  };
}
