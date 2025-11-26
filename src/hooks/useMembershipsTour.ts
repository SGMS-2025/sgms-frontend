import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng Membership Plans
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useMembershipsTour() {
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
   * Khởi chạy tour hướng dẫn Membership Plans
   * Tour sẽ hướng dẫn từ sidebar đến trang Membership Plans và các tính năng chính
   */
  const startMembershipsTour = () => {
    // Đợi một chút để đảm bảo DOM đã render
    setTimeout(() => {
      const steps = [
        // Bước 1: Giới thiệu menu Business Services trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const businessServicesButton = document.querySelector('[data-tour="business-services-menu"]');
            if (businessServicesButton) {
              setTimeout(() => {
                businessServicesButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return businessServicesButton as HTMLElement;
            }

            // Fallback: Tìm menu Business Services trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Business Services" hoặc "Dịch vụ kinh doanh"
            const businessServicesMenu = Array.from(sidebar.querySelectorAll('button')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
              return (
                (text.includes('business services') ||
                  text.includes('dịch vụ kinh doanh') ||
                  ariaLabel.includes('business services') ||
                  ariaLabel.includes('dịch vụ kinh doanh')) &&
                !text.includes('pt services') &&
                !text.includes('class services') &&
                !text.includes('promotions') &&
                !text.includes('membership')
              );
            });

            if (businessServicesMenu) {
              setTimeout(() => {
                businessServicesMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }

            return (businessServicesMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('membership.tour.sidebar_business_services.title'),
            description: t('membership.tour.sidebar_business_services.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Hướng dẫn click vào Membership Plans
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const membershipPlansButton = document.querySelector('[data-tour="membership-plans-menu-item"]');
            if (membershipPlansButton) {
              setTimeout(() => {
                membershipPlansButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return membershipPlansButton as HTMLElement;
            }

            // Fallback: Tìm menu item Membership Plans trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Membership Plans" hoặc "Gói thành viên"
            const membershipPlansMenu = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return (
                text.includes('membership plans') || text.includes('gói thành viên') || text.includes('membership')
              );
            });

            if (membershipPlansMenu) {
              setTimeout(() => {
                membershipPlansMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }

            return (membershipPlansMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('membership.tour.sidebar_membership_plans.title'),
            description: t('membership.tour.sidebar_membership_plans.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 3: Giới thiệu nút Create Plan
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const createPlanButton = document.querySelector('[data-tour="membership-create-plan-button"]');
            if (createPlanButton) return createPlanButton as HTMLElement;

            // Fallback: Tìm nút "Create Plan" hoặc "Tạo gói"
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              return (
                text.includes('create plan') ||
                text.includes('tạo gói') ||
                (text.includes('create') && text.includes('plan'))
              );
            });
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('membership.tour.create_plan_button.title'),
            description: t('membership.tour.create_plan_button.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 4: Giới thiệu nút Refresh
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const refreshButton = document.querySelector('[data-tour="membership-refresh-button"]');
            if (refreshButton) return refreshButton as HTMLElement;

            // Fallback: Tìm nút Refresh
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              const icon = btn.querySelector('svg');
              return (
                text.includes('refresh') ||
                text.includes('làm mới') ||
                (icon && icon.classList.contains('lucide-refresh-ccw'))
              );
            });
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('membership.tour.refresh_button.title'),
            description: t('membership.tour.refresh_button.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 5: Giới thiệu summary statistics
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const statsCards = document.querySelector('[data-tour="membership-stats-cards"]');
            if (statsCards) {
              setTimeout(() => {
                statsCards.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return statsCards as HTMLElement;
            }

            // Fallback: Tìm stats cards container
            const cards = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              return (
                className.includes('grid') &&
                className.includes('gap') &&
                Array.from(el.querySelectorAll('[class*="rounded"]')).length >= 3
              );
            });
            if (cards) {
              setTimeout(() => {
                cards.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }
            return (cards as HTMLElement) || undefined;
          },
          popover: {
            title: t('membership.tour.stats_cards.title'),
            description: t('membership.tour.stats_cards.description'),
            side: 'right',
            align: 'start'
          }
        },
        // Bước 6: Giới thiệu search input
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const searchInput = document.querySelector('[data-tour="membership-search-input"]');
            if (searchInput) return searchInput as HTMLElement;

            // Fallback: Tìm search input
            const inputs = Array.from(
              document.querySelectorAll(
                'input[type="text"], input[placeholder*="search" i], input[placeholder*="tìm" i]'
              )
            ).find((input) => {
              const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
              return placeholder.includes('search') || placeholder.includes('tìm');
            });
            return (inputs as HTMLElement) || undefined;
          },
          popover: {
            title: t('membership.tour.search.title'),
            description: t('membership.tour.search.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 7: Giới thiệu sort button
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const sortButton = document.querySelector('[data-tour="membership-sort-button"]');
            if (sortButton) return sortButton as HTMLElement;

            // Fallback: Tìm sort button
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              const icon = btn.querySelector('svg');
              return (
                text.includes('sort') ||
                text.includes('sắp xếp') ||
                (icon &&
                  (icon.classList.contains('lucide-arrow-up-down') ||
                    icon.classList.contains('lucide-arrow-up') ||
                    icon.classList.contains('lucide-arrow-down')))
              );
            });
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('membership.tour.sort_button.title'),
            description: t('membership.tour.sort_button.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 8: Giới thiệu status filter
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const statusFilter = document.querySelector('[data-tour="membership-status-filter"]');
            if (statusFilter) return statusFilter as HTMLElement;

            // Fallback: Tìm status filter
            const filters = Array.from(document.querySelectorAll('button, [role="button"]')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return (
                text.includes('all status') ||
                text.includes('active') ||
                text.includes('inactive') ||
                text.includes('trạng thái')
              );
            });
            return (filters as HTMLElement) || undefined;
          },
          popover: {
            title: t('membership.tour.status_filter.title'),
            description: t('membership.tour.status_filter.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 9: Giới thiệu view mode tabs
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const viewModeTabs = document.querySelector('[data-tour="membership-view-mode-tabs"]');
            if (viewModeTabs) return viewModeTabs as HTMLElement;

            // Fallback: Tìm view mode tabs
            const tabs = Array.from(document.querySelectorAll('div, button')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return (
                text.includes('all plans') ||
                text.includes('base plans') ||
                text.includes('custom plans') ||
                text.includes('tất cả') ||
                text.includes('gói cơ bản') ||
                text.includes('gói tùy chỉnh')
              );
            });
            return (tabs as HTMLElement) || undefined;
          },
          popover: {
            title: t('membership.tour.view_mode_tabs.title'),
            description: t('membership.tour.view_mode_tabs.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 10: Giới thiệu plans grid
        {
          element: () => {
            // Ưu tiên tìm card đầu tiên trong grid để highlight rõ ràng hơn
            const plansGrid = document.querySelector('[data-tour="membership-plans-grid"]');
            if (plansGrid) {
              // Tìm card đầu tiên trong grid
              const firstCard = plansGrid.querySelector('[class*="Card"], [class*="card"]');
              if (firstCard) {
                setTimeout(() => {
                  firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return firstCard as HTMLElement;
              }

              // Nếu không có card, highlight grid container
              setTimeout(() => {
                plansGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
              return plansGrid as HTMLElement;
            }

            // Fallback: Tìm card đầu tiên trong plans grid
            const grid = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              return (
                className.includes('grid') &&
                className.includes('gap') &&
                Array.from(el.querySelectorAll('[class*="Card"]')).length > 0
              );
            });

            if (grid) {
              const firstCard = grid.querySelector('[class*="Card"], [class*="card"]');
              if (firstCard) {
                setTimeout(() => {
                  firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return firstCard as HTMLElement;
              }

              setTimeout(() => {
                grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }
            return (grid as HTMLElement) || undefined;
          },
          popover: {
            title: t('membership.tour.plans_grid.title'),
            description: t('membership.tour.plans_grid.description'),
            side: 'right',
            align: 'start'
          }
        },
        // Bước 11: Giới thiệu actions menu (nếu có plan)
        {
          element: () => {
            // Tìm card đầu tiên trong plans grid
            const plansGrid = document.querySelector('[data-tour="membership-plans-grid"]');
            let firstCard: HTMLElement | null = null;

            if (plansGrid) {
              firstCard = plansGrid.querySelector('[class*="Card"], [class*="card"]') as HTMLElement;
            } else {
              // Fallback: Tìm grid và card đầu tiên
              const grid = Array.from(document.querySelectorAll('div')).find((el) => {
                const className = el.className || '';
                return (
                  className.includes('grid') &&
                  className.includes('gap') &&
                  Array.from(el.querySelectorAll('[class*="Card"]')).length > 0
                );
              });
              if (grid) {
                firstCard = grid.querySelector('[class*="Card"], [class*="card"]') as HTMLElement;
              }
            }

            // Tìm actions menu button trong card đầu tiên
            if (firstCard) {
              // Ưu tiên tìm bằng data-tour attribute trong card này
              const actionsMenu = firstCard.querySelector('[data-tour="membership-actions-menu"]');
              if (actionsMenu) {
                setTimeout(() => {
                  actionsMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return actionsMenu as HTMLElement;
              }

              // Fallback: Tìm button có MoreHorizontal icon trong card này
              const buttons = Array.from(firstCard.querySelectorAll('button')).find((btn) => {
                const icon = btn.querySelector('svg');
                return (
                  icon &&
                  (icon.classList.contains('lucide-more-horizontal') || icon.querySelector('path[d*="M"]') !== null)
                );
              });
              if (buttons) {
                setTimeout(() => {
                  buttons.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return buttons as HTMLElement;
              }
            }

            // Nếu không tìm thấy trong card đầu tiên, tìm trong toàn bộ document
            const actionsMenus = document.querySelectorAll('[data-tour="membership-actions-menu"]');
            if (actionsMenus.length > 0) {
              const firstMenu = actionsMenus[0] as HTMLElement;
              setTimeout(() => {
                firstMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return firstMenu;
            }

            return undefined;
          },
          popover: {
            title: t('membership.tour.actions_menu.title'),
            description: t('membership.tour.actions_menu.description'),
            side: 'left',
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
        console.warn(
          'Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang Membership Plans.'
        );
      }
    }, 800);
  };

  return {
    startMembershipsTour
  };
}
