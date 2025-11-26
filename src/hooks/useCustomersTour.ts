import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng Customers
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useCustomersTour() {
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
   * Khởi chạy tour hướng dẫn Customers
   * Tour sẽ hướng dẫn từ sidebar đến trang Customers và các tính năng chính
   */
  const startCustomersTour = () => {
    // Đợi một chút để đảm bảo DOM đã render, đặc biệt là các buttons và table
    setTimeout(() => {
      const steps = [
        // Bước 1: Giới thiệu menu Customers trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const customersButton = document.querySelector('[data-tour="customers-menu-item"]');
            if (customersButton) {
              setTimeout(() => {
                customersButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return customersButton as HTMLElement;
            }

            // Fallback: Tìm menu Customers trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Customers" hoặc "Khách hàng"
            const customersMenu = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return text.includes('customer') || text.includes('khách hàng');
            });

            if (customersMenu) {
              setTimeout(() => {
                customersMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }

            return (customersMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('customer.tour.sidebar_customers.title'),
            description: t('customer.tour.sidebar_customers.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Giới thiệu action buttons (Add Customer, Import Excel, Column Selector)
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const actionButtons = document.querySelector('[data-tour="customers-action-buttons"]');
            if (actionButtons) {
              setTimeout(() => {
                actionButtons.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return actionButtons as HTMLElement;
            }

            // Fallback: Tìm buttons container - tìm div chứa Add Customer, Import Excel buttons
            const buttonsContainer = Array.from(document.querySelectorAll('div')).find((el) => {
              const buttons = Array.from(el.querySelectorAll('button'));
              return buttons.some((btn) => {
                const text = btn.textContent?.toLowerCase() || '';
                return (
                  text.includes('add customer') ||
                  text.includes('thêm khách hàng') ||
                  text.includes('import excel') ||
                  text.includes('import') ||
                  text.includes('columns') ||
                  text.includes('cột')
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
            title: t('customer.tour.action_buttons.title'),
            description: t('customer.tour.action_buttons.description'),
            side: 'left',
            align: 'start'
          }
        },
        // Bước 3: Giới thiệu search input
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const searchInput = document.querySelector('[data-tour="customers-search-input"]');
            if (searchInput) return searchInput as HTMLElement;

            // Fallback: Tìm search input
            const inputs = Array.from(document.querySelectorAll('input[type="text"]')).find((input) => {
              const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
              return (
                placeholder.includes('customer') ||
                placeholder.includes('khách hàng') ||
                placeholder.includes('name') ||
                placeholder.includes('tên') ||
                placeholder.includes('search') ||
                placeholder.includes('tìm')
              );
            });
            return (inputs as HTMLElement) || undefined;
          },
          popover: {
            title: t('customer.tour.search.title'),
            description: t('customer.tour.search.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 4: Giới thiệu Select All button
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const selectAllButton = document.querySelector('[data-tour="customers-select-all"]');
            if (selectAllButton) return selectAllButton as HTMLElement;

            // Fallback: Tìm Select All button
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              return text.includes('select all') || text.includes('chọn tất cả');
            });
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('customer.tour.select_all.title'),
            description: t('customer.tour.select_all.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 5: Giới thiệu customer table
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const customerTable = document.querySelector('[data-tour="customers-table"]');
            if (customerTable) {
              const rect = customerTable.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTimeout(() => {
                  customerTable.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return customerTable as HTMLElement;
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
            title: t('customer.tour.customer_table.title'),
            description: t('customer.tour.customer_table.description'),
            side: 'top',
            align: 'start'
          }
        },
        // Bước 6: Giới thiệu actions buttons (View, Edit, Toggle Status)
        {
          element: () => {
            // Tìm table row đầu tiên
            const table = document.querySelector('[data-tour="customers-table"]') || document.querySelector('table');
            if (table) {
              const firstRow = table.querySelector('tbody tr');
              if (firstRow) {
                // Tìm actions container trong row đầu tiên
                const actionsContainer = Array.from(firstRow.querySelectorAll('td')).find((td) => {
                  const buttons = td.querySelectorAll('button');
                  return buttons.length >= 2; // Có ít nhất 2 buttons (View, Edit, hoặc Toggle Status)
                });
                if (actionsContainer) {
                  setTimeout(() => {
                    actionsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                  return actionsContainer as HTMLElement;
                }

                // Fallback: Tìm button đầu tiên (View button)
                const viewButton = Array.from(firstRow.querySelectorAll('button')).find((btn) => {
                  const icon = btn.querySelector('svg');
                  return icon && icon.querySelector('path[d*="M"]') !== null;
                });
                if (viewButton) {
                  setTimeout(() => {
                    viewButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                  return viewButton as HTMLElement;
                }
              }
            }

            return undefined;
          },
          popover: {
            title: t('customer.tour.actions_buttons.title'),
            description: t('customer.tour.actions_buttons.description'),
            side: 'left',
            align: 'start'
          }
        },
        // Bước 7: Giới thiệu pagination
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const pagination = document.querySelector('[data-tour="customers-pagination"]') as HTMLElement;
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
            title: t('customer.tour.pagination.title'),
            description: t('customer.tour.pagination.description'),
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
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang Customers.');
      }
    }, 800);
  };

  return {
    startCustomersTour
  };
}
