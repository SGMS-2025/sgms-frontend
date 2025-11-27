import { useTourBase } from './useTourBase';
import {
  findElementByTourAttr,
  findSidebarElementWithScroll,
  findSearchInput,
  findStatsCards,
  findPagination,
  findActionsMenu,
  scrollIntoView,
  isElementVisible
} from './tourUtils';

/**
 * Hook để tạo tour hướng dẫn sử dụng Testimonials
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useTestimonialsTour() {
  const { t, startTour } = useTourBase();

  /**
   * Khởi chạy tour hướng dẫn Testimonials
   * Tour sẽ hướng dẫn từ sidebar đến trang Testimonials và các tính năng chính
   */
  const startTestimonialsTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Testimonials trong sidebar
      {
        element: () => findSidebarElementWithScroll('testimonials-menu-item', ['testimonial', 'đánh giá']),
        popover: {
          title: t('testimonial.tour.sidebar_testimonials.title'),
          description: t('testimonial.tour.sidebar_testimonials.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 2: Giới thiệu nút Add Testimonial
      {
        element: () => {
          let element = findElementByTourAttr('testimonials-add-button') as HTMLElement | undefined;

          if (!element) {
            const orangeButtons = Array.from(document.querySelectorAll('button')).filter((btn) => {
              const className = btn.className || '';
              return className.includes('orange') || className.includes('bg-orange-600');
            });

            const foundButton = orangeButtons.find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              const hasPlusIcon = btn.querySelector('svg') !== null;
              return (
                hasPlusIcon &&
                (text.includes('add testimonial') ||
                  text.includes('thêm đánh giá') ||
                  (text.includes('add') && text.includes('testimonial')))
              );
            });

            if (foundButton) {
              element = foundButton as HTMLElement;
            }
          }

          if (element) {
            scrollIntoView(element);
            return element;
          }

          return undefined;
        },
        popover: {
          title: t('testimonial.tour.add_button.title'),
          description: t('testimonial.tour.add_button.description'),
          side: 'left' as const,
          align: 'start' as const
        }
      },
      // Bước 3: Giới thiệu stats cards
      {
        element: () =>
          findStatsCards('testimonials-stats-cards', 1, [
            'Total',
            'Active',
            'Inactive',
            'With Images',
            'Tổng',
            'Hoạt động'
          ]),
        popover: {
          title: t('testimonial.tour.stats_cards.title'),
          description: t('testimonial.tour.stats_cards.description'),
          side: 'right' as const,
          align: 'start' as const
        }
      },
      // Bước 4: Giới thiệu search input
      {
        element: () => findSearchInput('testimonials-search', ['testimonial', 'đánh giá', 'search', 'tìm']),
        popover: {
          title: t('testimonial.tour.search.title'),
          description: t('testimonial.tour.search.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 5: Giới thiệu testimonials list
      {
        element: () => {
          const testimonialsList = findElementByTourAttr('testimonials-list') as HTMLElement | undefined;
          let firstCard: HTMLElement | null = null;

          if (testimonialsList) {
            firstCard = Array.from(testimonialsList.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              return (
                className.includes('rounded-lg') &&
                (className.includes('shadow') || className.includes('border')) &&
                className.includes('bg-white')
              );
            }) as HTMLElement | null;
          }

          if (!firstCard) {
            firstCard = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              return (
                isElementVisible(el) &&
                className.includes('rounded-lg') &&
                (className.includes('shadow') || className.includes('border')) &&
                className.includes('bg-white') &&
                el.querySelector('[class*="User"], [class*="Calendar"]') !== null
              );
            }) as HTMLElement | null;
          }

          if (firstCard && isElementVisible(firstCard)) {
            scrollIntoView(firstCard);
            return firstCard;
          }

          if (testimonialsList && isElementVisible(testimonialsList)) {
            scrollIntoView(testimonialsList);
            return testimonialsList;
          }

          return undefined;
        },
        popover: {
          title: t('testimonial.tour.testimonials_list.title'),
          description: t('testimonial.tour.testimonials_list.description'),
          side: 'right' as const,
          align: 'start' as const
        }
      },
      // Bước 6: Giới thiệu actions menu
      {
        element: () => {
          const actionsMenus = document.querySelectorAll('[data-tour="testimonials-actions-menu"]');
          if (actionsMenus.length > 0) {
            const firstMenu = actionsMenus[0] as HTMLElement;
            if (isElementVisible(firstMenu)) {
              scrollIntoView(firstMenu);
              return firstMenu;
            }
          }
          return findActionsMenu('testimonials-actions-menu', '[data-tour="testimonials-list"]');
        },
        popover: {
          title: t('testimonial.tour.actions_menu.title'),
          description: t('testimonial.tour.actions_menu.description'),
          side: 'left' as const,
          align: 'start' as const
        }
      },
      // Bước 7: Giới thiệu pagination
      {
        element: () => findPagination('testimonials-pagination'),
        popover: {
          title: t('testimonial.tour.pagination.title'),
          description: t('testimonial.tour.pagination.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      }
    ];

    startTour(steps, 'Testimonials');
  };

  return {
    startTestimonialsTour
  };
}
