import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng Discounts
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useDiscountsTour() {
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
   * Khởi chạy tour hướng dẫn Discounts
   * Tour sẽ hướng dẫn từ sidebar đến trang Discounts và các tính năng chính
   */
  const startDiscountsTour = () => {
    // Đợi một chút để đảm bảo DOM đã render
    setTimeout(() => {
      const steps = [
        // Bước 1: Giới thiệu menu Business Services trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const businessServicesButton = document.querySelector('[data-tour="business-services-menu"]');
            if (businessServicesButton) return businessServicesButton as HTMLElement;

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
                !text.includes('promotions')
              );
            });

            return (businessServicesMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('discount.tour.sidebar_business_services.title'),
            description: t('discount.tour.sidebar_business_services.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Hướng dẫn click vào Promotions
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const promotionsButton = document.querySelector('[data-tour="promotions-menu-item"]');
            if (promotionsButton) return promotionsButton as HTMLElement;

            // Fallback: Tìm menu item Promotions trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Promotions" hoặc "Khuyến mãi"
            const promotionsMenu = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return text.includes('promotions') || text.includes('khuyến mãi') || text.includes('discounts');
            });

            return (promotionsMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('discount.tour.sidebar_promotions.title'),
            description: t('discount.tour.sidebar_promotions.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 3: Giới thiệu nút Add Campaign
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const addCampaignButton = document.querySelector('[data-tour="discount-add-campaign-button"]');
            if (addCampaignButton) return addCampaignButton as HTMLElement;

            // Fallback: Tìm nút "Add Campaign" hoặc "Thêm chiến dịch"
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              return (
                text.includes('add campaign') ||
                text.includes('thêm chiến dịch') ||
                (text.includes('add') && text.includes('campaign'))
              );
            });
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('discount.tour.add_campaign_button.title'),
            description: t('discount.tour.add_campaign_button.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 4: Giới thiệu stats cards
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const statsCards = document.querySelector('[data-tour="discount-stats-cards"]');
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
                Array.from(el.querySelectorAll('[class*="Card"]')).length >= 3
              );
            });
            return (cards as HTMLElement) || undefined;
          },
          popover: {
            title: t('discount.tour.stats_cards.title'),
            description: t('discount.tour.stats_cards.description'),
            side: 'right',
            align: 'start'
          }
        },
        // Bước 5: Giới thiệu search input
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const searchInput = document.querySelector('[data-tour="discount-search-input"]');
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
            title: t('discount.tour.search.title'),
            description: t('discount.tour.search.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 6: Giới thiệu status filter
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const statusFilter = document.querySelector('[data-tour="discount-status-filter"]');
            if (statusFilter) return statusFilter as HTMLElement;

            // Fallback: Tìm status filter select
            const selects = Array.from(document.querySelectorAll('select, [role="combobox"]')).find((select) => {
              const text = select.textContent?.toLowerCase() || '';
              const placeholder = select.getAttribute('placeholder')?.toLowerCase() || '';
              return (
                text.includes('status') ||
                text.includes('trạng thái') ||
                placeholder.includes('status') ||
                placeholder.includes('trạng thái')
              );
            });
            return (selects as HTMLElement) || undefined;
          },
          popover: {
            title: t('discount.tour.status_filter.title'),
            description: t('discount.tour.status_filter.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 7: Giới thiệu view mode toggle
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const viewToggle = document.querySelector('[data-tour="discount-view-mode-toggle"]');
            if (viewToggle) return viewToggle as HTMLElement;

            // Fallback: Tìm view toggle buttons
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const icon = btn.querySelector('svg');
              return icon && (icon.classList.contains('lucide-grid-3x3') || icon.classList.contains('lucide-list'));
            });
            return (buttons?.parentElement as HTMLElement) || undefined;
          },
          popover: {
            title: t('discount.tour.view_mode.title'),
            description: t('discount.tour.view_mode.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 8: Giới thiệu campaign list
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const campaignList = document.querySelector('[data-tour="discount-campaign-list"]');
            if (campaignList) {
              setTimeout(() => {
                campaignList.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return campaignList as HTMLElement;
            }

            // Fallback: Tìm campaign list (card hoặc table)
            const list = Array.from(document.querySelectorAll('div, table')).find((el) => {
              const className = el.className || '';
              return (
                (className.includes('grid') && className.includes('gap')) ||
                (el.tagName === 'TABLE' && el.querySelector('thead'))
              );
            });
            if (list) {
              setTimeout(() => {
                list.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }
            return (list as HTMLElement) || undefined;
          },
          popover: {
            title: t('discount.tour.campaign_list.title'),
            description: t('discount.tour.campaign_list.description'),
            side: 'top',
            align: 'start'
          }
        },
        // Bước 9: Giới thiệu actions menu (nếu có campaign)
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute - lấy cái đầu tiên
            const actionsMenus = document.querySelectorAll('[data-tour="discount-actions-menu"]');
            if (actionsMenus.length > 0) {
              const firstMenu = actionsMenus[0] as HTMLElement;
              setTimeout(() => {
                firstMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return firstMenu;
            }

            // Fallback: Tìm actions menu button đầu tiên
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const icon = btn.querySelector('svg');
              return (
                icon &&
                (icon.classList.contains('lucide-more-vertical') ||
                  icon.getAttribute('data-lucide') === 'more-vertical')
              );
            });
            if (buttons) {
              setTimeout(() => {
                buttons.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('discount.tour.actions_menu.title'),
            description: t('discount.tour.actions_menu.description'),
            side: 'left',
            align: 'start'
          }
        },
        // Bước 10: Giới thiệu pagination
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const pagination = document.querySelector('[data-tour="discount-pagination"]');
            if (pagination) {
              // Kiểm tra xem pagination có visible không
              const rect = pagination.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTimeout(() => {
                  pagination.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return pagination as HTMLElement;
              }
            }

            // Fallback: Tìm pagination
            const paginationEl = Array.from(document.querySelectorAll('nav, div')).find((el) => {
              const className = el.className || '';
              const text = el.textContent || '';
              const rect = el.getBoundingClientRect();
              return (
                rect.width > 0 &&
                rect.height > 0 &&
                (className.includes('pagination') || (text.includes('Previous') && text.includes('Next')))
              );
            });
            if (paginationEl) {
              setTimeout(() => {
                paginationEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }
            return (paginationEl as HTMLElement) || undefined;
          },
          popover: {
            title: t('discount.tour.pagination.title'),
            description: t('discount.tour.pagination.description'),
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
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang Discounts.');
      }
    }, 800);
  };

  return {
    startDiscountsTour
  };
}
