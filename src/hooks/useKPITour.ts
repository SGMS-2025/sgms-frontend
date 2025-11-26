import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng KPI trong sidebar
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useKPITour() {
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
   * Khởi chạy tour hướng dẫn KPI
   * Tour sẽ hướng dẫn từ sidebar đến trang KPI và các tính năng chính
   */
  const startKPITour = () => {
    // Đợi một chút để đảm bảo DOM đã render
    setTimeout(() => {
      const steps = [
        // Bước 1: Giới thiệu menu Finance trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const financeButton = document.querySelector('[data-tour="finance-menu"]');
            if (financeButton) return financeButton as HTMLElement;

            // Fallback: Tìm menu Finance trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Finance" hoặc "Tài chính"
            const financeMenu = Array.from(sidebar.querySelectorAll('button')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
              return (
                (text.includes('finance') ||
                  text.includes('tài chính') ||
                  ariaLabel.includes('finance') ||
                  ariaLabel.includes('tài chính')) &&
                !text.includes('expenses') &&
                !text.includes('kpi')
              );
            });

            return (financeMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('kpi.tour.sidebar_finance.title'),
            description: t('kpi.tour.sidebar_finance.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Hướng dẫn click vào KPI Management
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const kpiButton = document.querySelector('[data-tour="kpi-menu-item"]');
            if (kpiButton) {
              setTimeout(() => {
                kpiButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return kpiButton as HTMLElement;
            }

            // Fallback: Tìm menu item KPI trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "KPI" hoặc "Quản lý KPI"
            const kpiMenu = Array.from(sidebar.querySelectorAll('button')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
              return (
                (text.includes('kpi') ||
                  text.includes('quản lý kpi') ||
                  ariaLabel.includes('kpi') ||
                  ariaLabel.includes('quản lý kpi')) &&
                !text.includes('expenses') &&
                !text.includes('finance')
              );
            });

            if (kpiMenu) {
              setTimeout(() => {
                kpiMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }

            return (kpiMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('kpi.tour.sidebar_kpi.title'),
            description: t('kpi.tour.sidebar_kpi.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 3: Giới thiệu 3 thẻ thống kê KPI
        {
          element: () => {
            // Tìm phần grid chứa 3 stats cards
            const statsGrid = document.querySelector('[class*="grid"]')?.querySelectorAll('[class*="rounded-2xl"]');
            if (statsGrid && statsGrid.length > 0) {
              // Highlight card đầu tiên (Total KPIs)
              return (statsGrid[0] as HTMLElement) || undefined;
            }
            return undefined;
          },
          popover: {
            title: t('kpi.tour.stats_cards.title'),
            description: t('kpi.tour.stats_cards.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 4: Giới thiệu nút tạo KPI
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const tourButton = document.querySelector('[data-tour="create-kpi-button"]');
            if (tourButton) return tourButton as HTMLElement;

            // Fallback: Tìm nút "Tạo KPI"
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              return (
                (text.includes('tạo kpi') || text.includes('create kpi')) &&
                !text.includes('hướng dẫn') &&
                !text.includes('guide')
              );
            });
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('kpi.tour.create_button.title'),
            description: t('kpi.tour.create_button.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 5: Giới thiệu phần tìm kiếm
        {
          element: () => {
            // Tìm input search trong phần KPI (có placeholder "Search by name, branch..." hoặc "Tìm kiếm theo tên, chi nhánh...")
            const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[placeholder]'));
            const kpiSearchInput = allInputs.find((input) => {
              const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
              // Tìm input có placeholder chứa "name, branch" hoặc "tên, chi nhánh" - đây là search bar trong KPI
              return (
                (placeholder.includes('name, branch') ||
                  placeholder.includes('tên, chi nhánh') ||
                  placeholder.includes('search by name, branch')) &&
                !placeholder.includes('phone') && // Loại trừ search bar ở header
                !placeholder.includes('membership')
              );
            });
            return (kpiSearchInput as HTMLElement) || undefined;
          },
          popover: {
            title: t('kpi.tour.search.title'),
            description: t('kpi.tour.search.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 6: Giới thiệu filter trạng thái
        {
          element: () => {
            // Tìm select status filter
            const selects = Array.from(document.querySelectorAll('select, [role="combobox"]')).find((select) => {
              const label = select.getAttribute('aria-label') || '';
              const placeholder = select.textContent || '';
              return (
                label.toLowerCase().includes('status') ||
                label.toLowerCase().includes('trạng thái') ||
                placeholder.toLowerCase().includes('status') ||
                placeholder.toLowerCase().includes('trạng thái')
              );
            });
            return (selects as HTMLElement) || undefined;
          },
          popover: {
            title: t('kpi.tour.status_filter.title'),
            description: t('kpi.tour.status_filter.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 7: Giới thiệu bảng danh sách KPI
        {
          element: () => {
            // Tìm phần tbody chứa danh sách KPI
            const table = document.querySelector('table');
            if (!table) return undefined;

            // Tìm phần tbody
            const tbody = table.querySelector('tbody');
            if (tbody && tbody.children.length > 0) {
              return tbody as HTMLElement;
            }

            // Fallback: trả về table
            return (table as HTMLElement) || undefined;
          },
          popover: {
            title: t('kpi.tour.kpi_list.title'),
            description: t('kpi.tour.kpi_list.description'),
            side: 'right',
            align: 'start'
          }
        },
        // Bước 8: Giới thiệu nút xem chi tiết (Detail)
        {
          element: () => {
            // Tìm nút xem chi tiết đầu tiên (icon BarChart3)
            const viewButton = Array.from(document.querySelectorAll('button')).find((btn) => {
              const title = btn.getAttribute('title')?.toLowerCase() || '';
              const svg = btn.querySelector('svg');
              const hasBarChart = svg?.innerHTML.includes('BarChart') || false;
              return (title.includes('xem') || title.includes('view') || title.includes('chi tiết')) && hasBarChart;
            });
            return (viewButton as HTMLElement) || undefined;
          },
          popover: {
            title: t('kpi.tour.view_detail.title'),
            description: t('kpi.tour.view_detail.description'),
            side: 'left',
            align: 'center'
          }
        },
        // Bước 9: Giới thiệu nút chỉnh sửa (Edit)
        {
          element: () => {
            // Tìm nút chỉnh sửa đầu tiên (icon FileText)
            const editButton = Array.from(document.querySelectorAll('button')).find((btn) => {
              const title = btn.getAttribute('title')?.toLowerCase() || '';
              const svg = btn.querySelector('svg');
              const hasFileText = svg?.innerHTML.includes('FileText') || false;
              return (title.includes('chỉnh sửa') || title.includes('edit')) && hasFileText;
            });
            return (editButton as HTMLElement) || undefined;
          },
          popover: {
            title: t('kpi.tour.edit.title'),
            description: t('kpi.tour.edit.description'),
            side: 'left',
            align: 'center'
          }
        },
        // Bước 10: Giới thiệu nút vô hiệu hóa (Disable)
        {
          element: () => {
            // Tìm nút vô hiệu hóa đầu tiên (icon XCircle với border orange)
            const disableButton = Array.from(document.querySelectorAll('button')).find((btn) => {
              const title = btn.getAttribute('title')?.toLowerCase() || '';
              const svg = btn.querySelector('svg');
              const hasXCircle = svg?.innerHTML.includes('XCircle') || false;
              const hasOrangeBorder = btn.className.includes('orange');
              return (title.includes('vô hiệu') || title.includes('disable')) && hasXCircle && hasOrangeBorder;
            });
            return (disableButton as HTMLElement) || undefined;
          },
          popover: {
            title: t('kpi.tour.disable.title'),
            description: t('kpi.tour.disable.description'),
            side: 'left',
            align: 'center'
          }
        },
        // Bước 11: Giới thiệu pagination
        {
          element: () => {
            // Tìm phần pagination
            const pagination =
              document.querySelector('[class*="pagination"]') ||
              document.querySelector('nav[aria-label*="pagination"]') ||
              Array.from(document.querySelectorAll('nav, div')).find((el) => {
                const text = el.textContent?.toLowerCase() || '';
                return (
                  (text.includes('previous') ||
                    text.includes('next') ||
                    text.includes('trước') ||
                    text.includes('tiếp')) &&
                  el.querySelector('button, a')
                );
              });
            return (pagination as HTMLElement) || undefined;
          },
          popover: {
            title: t('kpi.tour.pagination.title'),
            description: t('kpi.tour.pagination.description'),
            side: 'top',
            align: 'center'
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
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang KPI.');
      }
    }, 500);
  };

  return {
    startKPITour
  };
}
