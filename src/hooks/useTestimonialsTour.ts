import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng Testimonials
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useTestimonialsTour() {
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
   * Khởi chạy tour hướng dẫn Testimonials
   * Tour sẽ hướng dẫn từ sidebar đến trang Testimonials và các tính năng chính
   */
  const startTestimonialsTour = () => {
    // Đợi một chút để đảm bảo DOM đã render, đặc biệt là các buttons
    setTimeout(() => {
      const steps = [
        // Bước 1: Giới thiệu menu Testimonials trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const testimonialsButton = document.querySelector('[data-tour="testimonials-menu-item"]');
            if (testimonialsButton) {
              setTimeout(() => {
                testimonialsButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return testimonialsButton as HTMLElement;
            }

            // Fallback: Tìm menu Testimonials trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Testimonials" hoặc "Đánh giá"
            const testimonialsMenu = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return text.includes('testimonial') || text.includes('đánh giá');
            });

            if (testimonialsMenu) {
              setTimeout(() => {
                testimonialsMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }

            return (testimonialsMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('testimonial.tour.sidebar_testimonials.title'),
            description: t('testimonial.tour.sidebar_testimonials.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Giới thiệu nút Add Testimonial
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute - thử nhiều lần để đảm bảo element đã render
            let addButton = document.querySelector('[data-tour="testimonials-add-button"]') as HTMLElement;

            // Nếu không tìm thấy ngay, thử tìm lại (có thể element chưa render)
            if (!addButton) {
              // Tìm trong tất cả buttons có class orange
              const orangeButtons = Array.from(document.querySelectorAll('button')).filter((btn) => {
                const className = btn.className || '';
                return className.includes('orange') || className.includes('bg-orange-600');
              });

              // Tìm button có Plus icon và text phù hợp
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
                addButton = foundButton as HTMLElement;
              }
            }

            if (addButton) {
              // Scroll vào view để đảm bảo element visible
              setTimeout(() => {
                addButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return addButton;
            }

            return undefined;
          },
          popover: {
            title: t('testimonial.tour.add_button.title'),
            description: t('testimonial.tour.add_button.description'),
            side: 'left',
            align: 'start'
          }
        },
        // Bước 3: Giới thiệu stats cards
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const statsCards = document.querySelector('[data-tour="testimonials-stats-cards"]');
            if (statsCards) {
              setTimeout(() => {
                statsCards.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return statsCards as HTMLElement;
            }

            // Fallback: Tìm stats cards container
            const stats = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              return (
                className.includes('grid') &&
                className.includes('grid-cols') &&
                Array.from(el.querySelectorAll('div')).some((child) => {
                  const childText = child.textContent || '';
                  return (
                    childText.includes('Total') ||
                    childText.includes('Active') ||
                    childText.includes('Inactive') ||
                    childText.includes('With Images') ||
                    childText.includes('Tổng') ||
                    childText.includes('Hoạt động')
                  );
                })
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
            title: t('testimonial.tour.stats_cards.title'),
            description: t('testimonial.tour.stats_cards.description'),
            side: 'right',
            align: 'start'
          }
        },
        // Bước 4: Giới thiệu search input
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const searchInput = document.querySelector('[data-tour="testimonials-search-input"]');
            if (searchInput) return searchInput as HTMLElement;

            // Fallback: Tìm search input
            const inputs = Array.from(document.querySelectorAll('input[type="text"]')).find((input) => {
              const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
              return (
                placeholder.includes('testimonial') ||
                placeholder.includes('đánh giá') ||
                placeholder.includes('search') ||
                placeholder.includes('tìm')
              );
            });
            return (inputs as HTMLElement) || undefined;
          },
          popover: {
            title: t('testimonial.tour.search.title'),
            description: t('testimonial.tour.search.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 5: Giới thiệu testimonials list
        {
          element: () => {
            // Tìm testimonial card đầu tiên để highlight
            const testimonialsList = document.querySelector('[data-tour="testimonials-list"]');
            let firstCard: HTMLElement | null = null;

            if (testimonialsList) {
              // Tìm card đầu tiên trong list - tìm div có class chứa rounded-lg và shadow-sm
              firstCard = Array.from(testimonialsList.querySelectorAll('div')).find((el) => {
                const className = el.className || '';
                return (
                  className.includes('rounded-lg') &&
                  (className.includes('shadow') || className.includes('border')) &&
                  className.includes('bg-white')
                );
              }) as HTMLElement | null;
            }

            // Nếu không tìm thấy trong list có data-tour, tìm trong toàn bộ document
            if (!firstCard) {
              firstCard = Array.from(document.querySelectorAll('div')).find((el) => {
                const className = el.className || '';
                const rect = el.getBoundingClientRect();
                return (
                  rect.width > 0 &&
                  rect.height > 0 &&
                  className.includes('rounded-lg') &&
                  (className.includes('shadow') || className.includes('border')) &&
                  className.includes('bg-white') &&
                  el.querySelector('[class*="User"], [class*="Calendar"]') !== null
                ); // Có icon User hoặc Calendar
              }) as HTMLElement | null;
            }

            if (firstCard) {
              const rect = firstCard.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTimeout(() => {
                  firstCard!.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return firstCard;
              }
            }

            // Fallback cuối cùng: Trả về list container nếu có
            if (testimonialsList) {
              const rect = testimonialsList.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTimeout(() => {
                  testimonialsList.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return testimonialsList as HTMLElement;
              }
            }

            return undefined;
          },
          popover: {
            title: t('testimonial.tour.testimonials_list.title'),
            description: t('testimonial.tour.testimonials_list.description'),
            side: 'right',
            align: 'start'
          }
        },
        // Bước 6: Giới thiệu actions menu
        {
          element: () => {
            // Ưu tiên: Tìm tất cả actions menu buttons và lấy cái đầu tiên
            const actionsMenus = document.querySelectorAll('[data-tour="testimonials-actions-menu"]');
            if (actionsMenus.length > 0) {
              const firstMenu = actionsMenus[0] as HTMLElement;
              const rect = firstMenu.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTimeout(() => {
                  firstMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return firstMenu;
              }
            }

            // Tìm testimonial card đầu tiên
            const testimonialsList = document.querySelector('[data-tour="testimonials-list"]');
            let firstTestimonial: HTMLElement | null = null;

            if (testimonialsList) {
              firstTestimonial = Array.from(testimonialsList.querySelectorAll('div')).find((el) => {
                const className = el.className || '';
                return (
                  className.includes('rounded-lg') &&
                  (className.includes('shadow') || className.includes('border')) &&
                  className.includes('bg-white')
                );
              }) as HTMLElement | null;
            }

            // Nếu không tìm thấy, tìm trong toàn bộ document
            if (!firstTestimonial) {
              firstTestimonial = Array.from(document.querySelectorAll('div')).find((el) => {
                const className = el.className || '';
                const rect = el.getBoundingClientRect();
                return (
                  rect.width > 0 &&
                  rect.height > 0 &&
                  className.includes('rounded-lg') &&
                  (className.includes('shadow') || className.includes('border')) &&
                  className.includes('bg-white') &&
                  el.querySelector('[class*="User"]') !== null
                );
              }) as HTMLElement | null;
            }

            // Tìm actions menu button trong testimonial đầu tiên
            if (firstTestimonial) {
              // Tìm button có data-tour attribute trước
              const actionsMenu = firstTestimonial.querySelector('[data-tour="testimonials-actions-menu"]');
              if (actionsMenu) {
                const rect = actionsMenu.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  setTimeout(() => {
                    actionsMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                  return actionsMenu as HTMLElement;
                }
              }

              // Tìm button có MoreHorizontal icon trong testimonial này
              const buttons = Array.from(firstTestimonial.querySelectorAll('button')).find((btn) => {
                const className = btn.className || '';
                const icon = btn.querySelector('svg');
                if (icon) {
                  // Kiểm tra xem có phải MoreHorizontal icon không - có 3 paths
                  const paths = icon.querySelectorAll('path');
                  return paths.length >= 3 && className.includes('hover:bg-gray-100');
                }
                return false;
              });
              if (buttons) {
                const rect = buttons.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  setTimeout(() => {
                    buttons.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                  return buttons as HTMLElement;
                }
              }
            }

            return undefined;
          },
          popover: {
            title: t('testimonial.tour.actions_menu.title'),
            description: t('testimonial.tour.actions_menu.description'),
            side: 'left',
            align: 'start'
          }
        },
        // Bước 7: Giới thiệu pagination
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const pagination = document.querySelector('[data-tour="testimonials-pagination"]') as HTMLElement;
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

            // Fallback: Tìm div chứa pagination - tìm div có chứa nav Pagination hoặc có pagination buttons
            const paginationContainer = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              const rect = el.getBoundingClientRect();
              // Kiểm tra xem có chứa nav Pagination không
              const hasPaginationNav = el.querySelector('nav[class*="Pagination"]') !== null;
              // Hoặc có pagination buttons
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
              return (
                rect.width > 0 &&
                rect.height > 0 &&
                (hasPaginationNav || hasPaginationButtons || className.includes('Pagination'))
              );
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
            title: t('testimonial.tour.pagination.title'),
            description: t('testimonial.tour.pagination.description'),
            side: 'bottom',
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
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang Testimonials.');
      }
    }, 800);
  };

  return {
    startTestimonialsTour
  };
}
