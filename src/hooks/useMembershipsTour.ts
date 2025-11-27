import { useTourBase } from './useTourBase';
import {
  findElementByTourAttr,
  findButtonByText,
  findSidebarElementWithScroll,
  findSearchInput,
  findStatsCards,
  findFirstCardInGrid,
  scrollIntoView,
  isElementVisible
} from './tourUtils';

/**
 * Hook để tạo tour hướng dẫn sử dụng Membership Plans
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useMembershipsTour() {
  const { t, startTour } = useTourBase();

  /**
   * Khởi chạy tour hướng dẫn Membership Plans
   * Tour sẽ hướng dẫn từ sidebar đến trang Membership Plans và các tính năng chính
   */
  const startMembershipsTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Business Services trong sidebar
      {
        element: () =>
          findSidebarElementWithScroll(
            'business-services-menu',
            ['business services', 'dịch vụ kinh doanh'],
            ['pt services', 'class services', 'promotions', 'membership']
          ),
        popover: {
          title: t('membership.tour.sidebar_business_services.title'),
          description: t('membership.tour.sidebar_business_services.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 2: Hướng dẫn click vào Membership Plans
      {
        element: () =>
          findSidebarElementWithScroll('membership-plans-menu-item', [
            'membership plans',
            'gói thành viên',
            'membership'
          ]),
        popover: {
          title: t('membership.tour.sidebar_membership_plans.title'),
          description: t('membership.tour.sidebar_membership_plans.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 3: Giới thiệu nút Create Plan
      {
        element: () =>
          findElementByTourAttr('membership-create-plan-button', () => findButtonByText(['create plan', 'tạo gói'])),
        popover: {
          title: t('membership.tour.create_plan_button.title'),
          description: t('membership.tour.create_plan_button.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 4: Giới thiệu nút Refresh
      {
        element: () => {
          const element = findElementByTourAttr('membership-refresh-button');
          if (element) return element;

          return Array.from(document.querySelectorAll('button')).find((btn) => {
            const text = btn.textContent?.toLowerCase() || '';
            const icon = btn.querySelector('svg');
            return (
              text.includes('refresh') ||
              text.includes('làm mới') ||
              (icon && icon.classList.contains('lucide-refresh-ccw'))
            );
          }) as HTMLElement | undefined;
        },
        popover: {
          title: t('membership.tour.refresh_button.title'),
          description: t('membership.tour.refresh_button.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 5: Giới thiệu summary statistics
      {
        element: () => findStatsCards('membership-stats-cards', 3),
        popover: {
          title: t('membership.tour.stats_cards.title'),
          description: t('membership.tour.stats_cards.description'),
          side: 'right' as const,
          align: 'start' as const
        }
      },
      // Bước 6: Giới thiệu search input
      {
        element: () => findSearchInput('membership-search', ['search', 'tìm']),
        popover: {
          title: t('membership.tour.search.title'),
          description: t('membership.tour.search.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 7: Giới thiệu sort button
      {
        element: () => {
          const element = findElementByTourAttr('membership-sort-button');
          if (element) return element;

          return Array.from(document.querySelectorAll('button')).find((btn) => {
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
          }) as HTMLElement | undefined;
        },
        popover: {
          title: t('membership.tour.sort_button.title'),
          description: t('membership.tour.sort_button.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 8: Giới thiệu status filter
      {
        element: () => {
          const element = findElementByTourAttr('membership-status-filter');
          if (element) return element;

          return Array.from(document.querySelectorAll('button, [role="button"]')).find((el) => {
            const text = el.textContent?.toLowerCase() || '';
            return (
              text.includes('all status') ||
              text.includes('active') ||
              text.includes('inactive') ||
              text.includes('trạng thái')
            );
          }) as HTMLElement | undefined;
        },
        popover: {
          title: t('membership.tour.status_filter.title'),
          description: t('membership.tour.status_filter.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 9: Giới thiệu view mode tabs
      {
        element: () => {
          const element = findElementByTourAttr('membership-view-mode-tabs');
          if (element) return element;

          return Array.from(document.querySelectorAll('div, button')).find((el) => {
            const text = el.textContent?.toLowerCase() || '';
            return (
              text.includes('all plans') ||
              text.includes('base plans') ||
              text.includes('custom plans') ||
              text.includes('tất cả') ||
              text.includes('gói cơ bản') ||
              text.includes('gói tùy chỉnh')
            );
          }) as HTMLElement | undefined;
        },
        popover: {
          title: t('membership.tour.view_mode_tabs.title'),
          description: t('membership.tour.view_mode_tabs.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 10: Giới thiệu plans grid
      {
        element: () => findFirstCardInGrid('membership-plans-grid'),
        popover: {
          title: t('membership.tour.plans_grid.title'),
          description: t('membership.tour.plans_grid.description'),
          side: 'right' as const,
          align: 'start' as const
        }
      },
      // Bước 11: Giới thiệu actions menu (nếu có plan)
      {
        element: () => {
          const plansGrid = findElementByTourAttr('membership-plans-grid') as HTMLElement | undefined;
          let firstCard: HTMLElement | null = null;

          if (plansGrid) {
            firstCard = plansGrid.querySelector('[class*="Card"], [class*="card"]') as HTMLElement;
          } else {
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

          if (firstCard) {
            const actionsMenu = firstCard.querySelector('[data-tour="membership-actions-menu"]');
            if (actionsMenu && isElementVisible(actionsMenu as HTMLElement)) {
              scrollIntoView(actionsMenu as HTMLElement);
              return actionsMenu as HTMLElement;
            }

            const button = Array.from(firstCard.querySelectorAll('button')).find((btn) => {
              const icon = btn.querySelector('svg');
              return (
                icon &&
                (icon.classList.contains('lucide-more-horizontal') || icon.querySelector('path[d*="M"]') !== null)
              );
            });

            if (button && isElementVisible(button)) {
              scrollIntoView(button);
              return button as HTMLElement;
            }
          }

          const actionsMenus = document.querySelectorAll('[data-tour="membership-actions-menu"]');
          if (actionsMenus.length > 0) {
            const firstMenu = actionsMenus[0] as HTMLElement;
            if (isElementVisible(firstMenu)) {
              scrollIntoView(firstMenu);
              return firstMenu;
            }
          }

          return undefined;
        },
        popover: {
          title: t('membership.tour.actions_menu.title'),
          description: t('membership.tour.actions_menu.description'),
          side: 'left' as const,
          align: 'start' as const
        }
      }
    ];

    startTour(steps, 'Membership Plans');
  };

  return {
    startMembershipsTour
  };
}
