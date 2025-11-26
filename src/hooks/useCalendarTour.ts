import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng Calendar (Work Schedule)
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useCalendarTour() {
  const { t } = useTranslation();
  const { startTour } = useDriver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    allowClose: true,
    overlayOpacity: 0.5,
    smoothScroll: true,
    stagePadding: 4,
    stageRadius: 5,
    popoverOffset: 2,
    allowKeyboardControl: true,
    disableActiveInteraction: false
  });

  /**
   * Khởi chạy tour hướng dẫn Calendar
   * Tour sẽ hướng dẫn từ sidebar đến trang Calendar và các tính năng chính
   */
  const startCalendarTour = () => {
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
            title: t('calendar.tour.sidebar_schedule.title'),
            description: t('calendar.tour.sidebar_schedule.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Hướng dẫn click vào Work Schedule
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const workScheduleButton = document.querySelector('[data-tour="work-schedule-menu-item"]');
            if (workScheduleButton) return workScheduleButton as HTMLElement;

            // Fallback: Tìm menu item Work Schedule trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Work Schedule" hoặc "Lịch làm việc"
            const workScheduleMenu = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return (
                (text.includes('work schedule') || text.includes('lịch làm việc')) &&
                !text.includes('time off') &&
                !text.includes('schedule template')
              );
            });

            return (workScheduleMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('calendar.tour.sidebar_work_schedule.title'),
            description: t('calendar.tour.sidebar_work_schedule.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 3: Giới thiệu điều hướng tháng/tuần
        {
          element: () => {
            // Tìm container chứa cả 3 nút (Previous, Today, Next)
            const todayButton = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              return text.includes('today') || text.includes('hôm nay');
            });

            if (todayButton && todayButton.parentElement) {
              // Tìm container chứa cả 3 nút
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
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 4: Giới thiệu bộ lọc nhân viên
        {
          element: () => {
            // Tìm phần chọn nhân viên
            const staffSelector =
              document.querySelector('[data-tour="staff-selector"]') ||
              Array.from(document.querySelectorAll('button, [role="combobox"]')).find((el) => {
                const text = el.textContent?.toLowerCase() || '';
                return (
                  text.includes('all staff') ||
                  text.includes('tất cả nhân viên') ||
                  text.includes('select staff') ||
                  text.includes('chọn nhân viên')
                );
              });
            return (staffSelector as HTMLElement) || undefined;
          },
          popover: {
            title: t('calendar.tour.staff_filter.title'),
            description: t('calendar.tour.staff_filter.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 5: Giới thiệu thiết lập cấu hình làm việc cho nhân viên
        {
          element: () => {
            // Tìm nút Create (nút này mở dropdown có option thiết lập cấu hình)
            const createButton =
              document.querySelector('[data-tour="create-workshift-button"]') ||
              Array.from(document.querySelectorAll('button')).find((btn) => {
                const text = btn.textContent?.toLowerCase() || '';
                return (
                  (text.includes('tạo') || text.includes('create')) &&
                  !text.includes('hướng dẫn') &&
                  !text.includes('guide')
                );
              });
            return (createButton as HTMLElement) || undefined;
          },
          popover: {
            title: t('calendar.tour.work_config.title'),
            description: t('calendar.tour.work_config.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 6: Giới thiệu chú giải màu sắc
        {
          element: () => {
            // Tìm phần legend (color indicators) trong header
            // Tìm div container chứa legend với class "flex items-center gap-3"
            const legendContainer = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              const text = el.textContent?.toLowerCase() || '';
              // Tìm div có class chứa "flex" và "items-center" và "gap-3" và có text về legend
              const hasLegendText =
                text.includes('scheduled') ||
                text.includes('pending') ||
                text.includes('cancelled') ||
                text.includes('past') ||
                text.includes('đã lên lịch') ||
                text.includes('đang chờ') ||
                text.includes('đã hủy') ||
                text.includes('quá khứ');
              // Kiểm tra có chứa các div con với màu sắc (border-l-4)
              const hasColorIndicators = el.querySelectorAll('div[class*="border-l-4"]').length >= 4;
              return (
                className.includes('flex') &&
                className.includes('items-center') &&
                className.includes('gap-3') &&
                hasLegendText &&
                hasColorIndicators
              );
            });

            // Nếu tìm thấy container, trả về container đó (chỉ highlight phần legend)
            if (legendContainer) {
              return legendContainer as HTMLElement;
            }

            return undefined;
          },
          popover: {
            title: t('calendar.tour.legend.title'),
            description: t('calendar.tour.legend.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 7: Giới thiệu lưới lịch
        {
          element: () => {
            // Tìm phần calendar grid - phần chứa các ô ca làm việc
            // Tìm phần có class "flex-1 overflow-hidden bg-white" chứa calendar grid
            const calendarGrid = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              // Tìm phần chứa calendar grid (có class flex-1 và overflow-hidden)
              if (className.includes('flex-1') && className.includes('overflow-hidden')) {
                // Kiểm tra xem có chứa các ô shift không
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

            // Fallback: Tìm phần chứa các ngày trong tuần
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
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang Calendar.');
      }
    }, 500);
  };

  return {
    startCalendarTour
  };
}
