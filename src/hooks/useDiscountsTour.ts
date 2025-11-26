import { useTourBase } from './useTourBase';
import {
  findElementByTourAttr,
  findButtonByText,
  findSelectByText,
  findSidebarElementWithScroll,
  findSearchInput,
  findStatsCards,
  findViewModeToggle,
  findPagination,
  scrollIntoView
} from './tourUtils';

/**
 * Hook để tạo tour hướng dẫn sử dụng Discounts
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useDiscountsTour() {
  const { t, startTour } = useTourBase();

  /**
   * Khởi chạy tour hướng dẫn Discounts
   * Tour sẽ hướng dẫn từ sidebar đến trang Discounts và các tính năng chính
   */
  const startDiscountsTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Business Services trong sidebar
      {
        element: () =>
          findSidebarElementWithScroll(
            'business-services-menu',
            ['business services', 'dịch vụ kinh doanh'],
            ['pt services', 'class services', 'promotions']
          ),
        popover: {
          title: t('discount.tour.sidebar_business_services.title'),
          description: t('discount.tour.sidebar_business_services.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 2: Hướng dẫn click vào Promotions
      {
        element: () => findSidebarElementWithScroll('promotions-menu-item', ['promotions', 'khuyến mãi', 'discounts']),
        popover: {
          title: t('discount.tour.sidebar_promotions.title'),
          description: t('discount.tour.sidebar_promotions.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 3: Giới thiệu nút Add Campaign
      {
        element: () =>
          findElementByTourAttr('discount-add-campaign-button', () =>
            findButtonByText(['add campaign', 'thêm chiến dịch'])
          ),
        popover: {
          title: t('discount.tour.add_campaign_button.title'),
          description: t('discount.tour.add_campaign_button.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 4: Giới thiệu stats cards
      {
        element: () => findStatsCards('discount-stats-cards', 3),
        popover: {
          title: t('discount.tour.stats_cards.title'),
          description: t('discount.tour.stats_cards.description'),
          side: 'right' as const,
          align: 'start' as const
        }
      },
      // Bước 5: Giới thiệu search input
      {
        element: () => findSearchInput('discount-search', ['search', 'tìm']),
        popover: {
          title: t('discount.tour.search.title'),
          description: t('discount.tour.search.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 6: Giới thiệu status filter
      {
        element: () =>
          findElementByTourAttr('discount-status-filter', () => findSelectByText(['status', 'trạng thái'])),
        popover: {
          title: t('discount.tour.status_filter.title'),
          description: t('discount.tour.status_filter.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 7: Giới thiệu view mode toggle
      {
        element: () => findViewModeToggle('discount-view-mode-toggle', 'grid-3x3', 'list'),
        popover: {
          title: t('discount.tour.view_mode.title'),
          description: t('discount.tour.view_mode.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 8: Giới thiệu campaign list
      {
        element: () => {
          const element = findElementByTourAttr('discount-campaign-list', () => {
            return Array.from(document.querySelectorAll('div, table')).find((el) => {
              const className = el.className || '';
              return (
                (className.includes('grid') && className.includes('gap')) ||
                (el.tagName === 'TABLE' && el.querySelector('thead'))
              );
            }) as HTMLElement | undefined;
          });
          if (element) scrollIntoView(element);
          return element;
        },
        popover: {
          title: t('discount.tour.campaign_list.title'),
          description: t('discount.tour.campaign_list.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      },
      // Bước 9: Giới thiệu actions menu (nếu có campaign)
      {
        element: () => {
          const actionsMenus = document.querySelectorAll('[data-tour="discount-actions-menu"]');
          if (actionsMenus.length > 0) {
            const firstMenu = actionsMenus[0] as HTMLElement;
            scrollIntoView(firstMenu);
            return firstMenu;
          }

          const button = Array.from(document.querySelectorAll('button')).find((btn) => {
            const icon = btn.querySelector('svg');
            return (
              icon &&
              (icon.classList.contains('lucide-more-vertical') || icon.getAttribute('data-lucide') === 'more-vertical')
            );
          });
          if (button) scrollIntoView(button as HTMLElement);
          return (button as HTMLElement) || undefined;
        },
        popover: {
          title: t('discount.tour.actions_menu.title'),
          description: t('discount.tour.actions_menu.description'),
          side: 'left' as const,
          align: 'start' as const
        }
      },
      // Bước 10: Giới thiệu pagination
      {
        element: () => findPagination('discount-pagination'),
        popover: {
          title: t('discount.tour.pagination.title'),
          description: t('discount.tour.pagination.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      }
    ];

    startTour(steps, 'Discounts');
  };

  return {
    startDiscountsTour
  };
}
