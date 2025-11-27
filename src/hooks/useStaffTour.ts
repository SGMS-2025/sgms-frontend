import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng Staff
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useStaffTour() {
  const { t } = useTranslation();
  const { startTour } = useDriver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    allowClose: true,
    overlayOpacity: 0.5,
    smoothScroll: false, // Tắt smoothScroll của driver.js để tự handle scroll
    stagePadding: 4,
    stageRadius: 5,
    popoverOffset: 10,
    allowKeyboardControl: true,
    disableActiveInteraction: false
  });

  /**
   * Khởi chạy tour hướng dẫn Staff
   * Tour sẽ hướng dẫn từ sidebar đến trang Staff và các tính năng chính
   */
  // Helper function để scroll trong container thay vì body
  const scrollInContainer = (element: HTMLElement) => {
    // Tìm container scroll cha (có overflow-y-auto)
    let scrollContainer = element.parentElement;
    while (scrollContainer) {
      const style = globalThis.getComputedStyle(scrollContainer);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        const elementTop = element.offsetTop;
        const containerRect = scrollContainer.getBoundingClientRect();
        const containerHeight = containerRect.height;
        const elementHeight = element.getBoundingClientRect().height;

        // Tính toán vị trí scroll để center element
        const targetScroll = elementTop - containerHeight / 2 + elementHeight / 2;

        scrollContainer.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
        return true; // Đã scroll trong container
      }
      scrollContainer = scrollContainer.parentElement;
    }
    return false; // Không tìm thấy container scroll
  };

  const startStaffTour = () => {
    // Ngăn scroll body khi tour đang chạy
    const originalScrollTo = window.scrollTo;
    const originalScroll = window.scroll;
    const originalScrollBy = window.scrollBy;

    // Lưu giá trị scroll hiện tại để giữ nguyên
    const savedScrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
    const savedScrollLeft = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft;

    // Override window scroll methods để ngăn scroll body
    window.scrollTo = function () {
      // Không làm gì - ngăn scroll body
    };
    window.scroll = function () {
      // Không làm gì - ngăn scroll body
    };
    window.scrollBy = function () {
      // Không làm gì - ngăn scroll body
    };

    // Ngăn scroll bằng cách set scrollTop/scrollLeft trực tiếp
    const preventDirectScroll = () => {
      if (document.documentElement.scrollTop !== savedScrollTop) {
        document.documentElement.scrollTop = savedScrollTop;
      }
      if (document.documentElement.scrollLeft !== savedScrollLeft) {
        document.documentElement.scrollLeft = savedScrollLeft;
      }
      if (document.body.scrollTop !== savedScrollTop) {
        document.body.scrollTop = savedScrollTop;
      }
      if (document.body.scrollLeft !== savedScrollLeft) {
        document.body.scrollLeft = savedScrollLeft;
      }
    };

    // Monitor và ngăn scroll liên tục
    const scrollMonitor = setInterval(preventDirectScroll, 10);

    // Ngăn scroll event
    const preventScrollEvent = (e: Event) => {
      if (e.target === document || e.target === document.body || e.target === document.documentElement) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('scroll', preventScrollEvent, { capture: true, passive: false });
    window.addEventListener('scroll', preventScrollEvent, { capture: true, passive: false });

    // Restore các methods sau khi tour kết thúc
    const restoreScrollMethods = () => {
      clearInterval(scrollMonitor);
      document.removeEventListener('scroll', preventScrollEvent, { capture: true });
      window.removeEventListener('scroll', preventScrollEvent, { capture: true });
      window.scrollTo = originalScrollTo;
      window.scroll = originalScroll;
      window.scrollBy = originalScrollBy;
    };

    // Restore sau 30 giây (đủ thời gian cho tour)
    const restoreTimeout = setTimeout(restoreScrollMethods, 30000);

    // Đợi một chút để đảm bảo DOM đã render, đặc biệt là các buttons và table
    setTimeout(() => {
      const steps = [
        // Bước 1: Giới thiệu menu Staff trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const staffButton = document.querySelector('[data-tour="staff-menu-item"]');
            let targetElement: HTMLElement | undefined = staffButton ? (staffButton as HTMLElement) : undefined;

            if (!targetElement) {
              // Fallback: Tìm menu Staff trong sidebar
              const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
              if (!sidebar) return undefined;

              // Tìm button chứa text "Staff" hoặc "Nhân viên"
              targetElement = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
                const text = el.textContent?.toLowerCase() || '';
                return text.includes('staff') || text.includes('nhân viên');
              }) as HTMLElement | undefined;
            }

            if (targetElement) {
              // Override scrollIntoView để scroll trong container thay vì body
              const originalScrollIntoView = targetElement.scrollIntoView.bind(targetElement);
              const elementRef = targetElement; // Lưu reference để dùng trong closure
              targetElement.scrollIntoView = function () {
                // Scroll trong container thay vì body
                scrollInContainer(elementRef);
                // Không gọi originalScrollIntoView để ngăn scroll body
              };

              // Scroll trong container ngay lập tức
              setTimeout(() => {
                scrollInContainer(elementRef);
              }, 50);

              // Restore scrollIntoView sau khi driver.js đã highlight (sau 1 giây)
              setTimeout(() => {
                if (elementRef) {
                  elementRef.scrollIntoView = originalScrollIntoView;
                }
              }, 1000);
            }

            return targetElement || undefined;
          },
          popover: {
            title: t('staff.tour.sidebar_staff.title'),
            description: t('staff.tour.sidebar_staff.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Giới thiệu stats cards
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const statsCards = document.querySelector('[data-tour="staff-stats-cards"]');
            if (statsCards) {
              setTimeout(() => {
                statsCards.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return statsCards as HTMLElement;
            }

            // Fallback: Tìm stats cards container - tìm grid chứa các cards
            const stats = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              return (
                className.includes('grid') &&
                (className.includes('sm:grid-cols-2') || className.includes('xl:grid-cols-4')) &&
                Array.from(el.querySelectorAll('[class*="rounded-2xl"], [class*="border"]')).length >= 4
              );
            });
            if (stats) {
              setTimeout(() => {
                stats.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }
            return (stats as HTMLElement) || undefined;
          },
          popover: {
            title: t('staff.tour.stats_cards.title'),
            description: t('staff.tour.stats_cards.description'),
            side: 'right',
            align: 'start'
          }
        },
        // Bước 3: Giới thiệu action buttons (Import Excel, Add Staff)
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const actionButtons = document.querySelector('[data-tour="staff-action-buttons"]');
            if (actionButtons) {
              setTimeout(() => {
                actionButtons.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return actionButtons as HTMLElement;
            }

            // Fallback: Tìm buttons container - tìm div chứa Import Excel và Add Staff buttons
            const buttonsContainer = Array.from(document.querySelectorAll('div')).find((el) => {
              const buttons = Array.from(el.querySelectorAll('button'));
              return buttons.some((btn) => {
                const text = btn.textContent?.toLowerCase() || '';
                return (
                  text.includes('import excel') ||
                  text.includes('import') ||
                  text.includes('add staff') ||
                  text.includes('thêm nhân viên')
                );
              });
            });
            if (buttonsContainer) {
              setTimeout(() => {
                buttonsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }
            return (buttonsContainer as HTMLElement) || undefined;
          },
          popover: {
            title: t('staff.tour.action_buttons.title'),
            description: t('staff.tour.action_buttons.description'),
            side: 'left',
            align: 'start'
          }
        },
        // Bước 4: Giới thiệu search input
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const searchInput = document.querySelector('[data-tour="staff-search-input"]');
            if (searchInput) return searchInput as HTMLElement;

            // Fallback: Tìm search input
            const inputs = Array.from(document.querySelectorAll('input[type="text"]')).find((input) => {
              const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
              return (
                placeholder.includes('staff') ||
                placeholder.includes('nhân viên') ||
                placeholder.includes('name') ||
                placeholder.includes('tên') ||
                placeholder.includes('search') ||
                placeholder.includes('tìm')
              );
            });
            return (inputs as HTMLElement) || undefined;
          },
          popover: {
            title: t('staff.tour.search.title'),
            description: t('staff.tour.search.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 5: Giới thiệu Select All button
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const selectAllButton = document.querySelector('[data-tour="staff-select-all"]');
            if (selectAllButton) return selectAllButton as HTMLElement;

            // Fallback: Tìm Select All button
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              return text.includes('select all') || text.includes('chọn tất cả');
            });
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('staff.tour.select_all.title'),
            description: t('staff.tour.select_all.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 6: Giới thiệu staff table
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const staffTable = document.querySelector('[data-tour="staff-table"]');
            if (staffTable) {
              const rect = staffTable.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTimeout(() => {
                  staffTable.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return staffTable as HTMLElement;
              }
            }

            // Fallback: Tìm table
            const table = document.querySelector('table');
            if (table) {
              setTimeout(() => {
                table.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return table as HTMLElement;
            }

            return undefined;
          },
          popover: {
            title: t('staff.tour.staff_table.title'),
            description: t('staff.tour.staff_table.description'),
            side: 'top',
            align: 'start'
          }
        },
        // Bước 7: Giới thiệu actions menu (View, Edit, Manage Permissions, Toggle Status)
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const actionsMenuButton = document.querySelector('[data-tour="staff-actions-menu"]') as HTMLElement;
            if (actionsMenuButton) {
              const rect = actionsMenuButton.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTimeout(() => {
                  actionsMenuButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return actionsMenuButton;
              }
            }

            // Fallback: Tìm table row đầu tiên
            const table = document.querySelector('[data-tour="staff-table"]') || document.querySelector('table');
            if (table) {
              const firstRow = table.querySelector('tbody tr');
              if (firstRow) {
                // Tìm actions menu button (MoreVertical icon) trong row đầu tiên
                const actionsMenu = Array.from(firstRow.querySelectorAll('button')).find((btn) => {
                  const icon = btn.querySelector('svg');
                  if (icon) {
                    // Tìm MoreVertical icon - có 3 paths trong SVG
                    const paths = icon.querySelectorAll('path');
                    return paths.length >= 2; // MoreVertical thường có 2-3 paths
                  }
                  return false;
                });
                if (actionsMenu) {
                  setTimeout(() => {
                    actionsMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                  return actionsMenu as HTMLElement;
                }
              }
            }

            return undefined;
          },
          popover: {
            title: t('staff.tour.actions_menu.title'),
            description: t('staff.tour.actions_menu.description'),
            side: 'left',
            align: 'start'
          }
        },
        // Bước 8: Giới thiệu pagination
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const pagination = document.querySelector('[data-tour="staff-pagination"]') as HTMLElement;
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
            title: t('staff.tour.pagination.title'),
            description: t('staff.tour.pagination.description'),
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

        // Lắng nghe khi tour kết thúc để restore scroll methods
        // Kiểm tra định kỳ xem tour còn active không
        const checkTourActive = setInterval(() => {
          // Kiểm tra xem có driver overlay không
          const driverOverlay = document.querySelector('.driver-overlay');
          if (!driverOverlay) {
            // Tour đã kết thúc, restore methods
            clearInterval(checkTourActive);
            clearTimeout(restoreTimeout);
            restoreScrollMethods();
          }
        }, 100);

        // Cleanup sau 30 giây nếu vẫn chưa restore
        setTimeout(() => {
          clearInterval(checkTourActive);
        }, 30000);
      } else {
        // Nếu không tìm thấy elements, restore ngay và hiển thị thông báo
        clearTimeout(restoreTimeout);
        restoreScrollMethods();
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang Staff.');
      }
    }, 800);
  };

  return {
    startStaffTour
  };
}
