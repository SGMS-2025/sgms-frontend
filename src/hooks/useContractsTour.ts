import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng Contracts
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useContractsTour() {
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
   * Khởi chạy tour hướng dẫn Contracts
   * Tour sẽ hướng dẫn từ sidebar đến trang Contracts và các tính năng chính
   */
  const startContractsTour = () => {
    // Đợi một chút để đảm bảo DOM đã render
    setTimeout(() => {
      const steps = [
        // Bước 1: Giới thiệu menu Contracts trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const contractsButton = document.querySelector('[data-tour="contracts-menu-item"]');
            if (contractsButton) {
              setTimeout(() => {
                contractsButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return contractsButton as HTMLElement;
            }

            // Fallback: Tìm menu Contracts trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Contracts" hoặc "Hợp đồng"
            const contractsMenu = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return text.includes('contracts') || text.includes('hợp đồng');
            });

            if (contractsMenu) {
              setTimeout(() => {
                contractsMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }

            return (contractsMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('contracts.tour.sidebar_contracts.title'),
            description: t('contracts.tour.sidebar_contracts.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Giới thiệu nút Upload Document
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const uploadButton = document.querySelector('[data-tour="contracts-upload-button"]');
            if (uploadButton) return uploadButton as HTMLElement;

            // Fallback: Tìm nút "Upload Document" hoặc "Tải lên tài liệu"
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              return (
                text.includes('upload document') ||
                text.includes('tải lên') ||
                (text.includes('upload') && text.includes('document'))
              );
            });
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('contracts.tour.upload_button.title'),
            description: t('contracts.tour.upload_button.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 3: Giới thiệu tabs (Templates/Customer Contracts)
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const tabs = document.querySelector('[data-tour="contracts-tabs"]');
            if (tabs) return tabs as HTMLElement;

            // Fallback: Tìm tabs
            const tabsEl = Array.from(document.querySelectorAll('[role="tablist"], [class*="TabsList"]')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return (
                text.includes('templates') ||
                text.includes('customer contracts') ||
                text.includes('mẫu') ||
                text.includes('hợp đồng khách hàng')
              );
            });
            return (tabsEl as HTMLElement) || undefined;
          },
          popover: {
            title: t('contracts.tour.tabs.title'),
            description: t('contracts.tour.tabs.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 4: Giới thiệu search input
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const searchInput = document.querySelector('[data-tour="contracts-search-input"]');
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
            title: t('contracts.tour.search.title'),
            description: t('contracts.tour.search.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 5: Giới thiệu status filter
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const statusFilter = document.querySelector('[data-tour="contracts-status-filter"]');
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
            title: t('contracts.tour.status_filter.title'),
            description: t('contracts.tour.status_filter.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 6: Giới thiệu documents list
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const documentsList = document.querySelector('[data-tour="contracts-documents-list"]');
            if (documentsList) {
              setTimeout(() => {
                documentsList.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return documentsList as HTMLElement;
            }

            // Fallback: Tìm documents list container
            const list = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              return (
                (className.includes('divide-y') || className.includes('border')) &&
                Array.from(el.querySelectorAll('[class*="FileText"], [class*="file"]')).length > 0
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
            title: t('contracts.tour.documents_list.title'),
            description: t('contracts.tour.documents_list.description'),
            side: 'top',
            align: 'start'
          }
        },
        // Bước 7: Giới thiệu actions buttons (View, Edit, Send, Delete)
        {
          element: () => {
            // Tìm document item đầu tiên trong list
            const documentsList = document.querySelector('[data-tour="contracts-documents-list"]');
            let firstDocument: HTMLElement | null = null;

            if (documentsList) {
              firstDocument = documentsList.querySelector(
                'div[class*="hover:bg-gray-50"], div[class*="p-4"]'
              ) as HTMLElement;
            } else {
              // Fallback: Tìm list container
              const list = Array.from(document.querySelectorAll('div')).find((el) => {
                const className = el.className || '';
                return (
                  (className.includes('divide-y') || className.includes('border')) &&
                  Array.from(el.querySelectorAll('[class*="FileText"]')).length > 0
                );
              });
              if (list) {
                firstDocument = list.querySelector('div[class*="hover:bg-gray-50"], div[class*="p-4"]') as HTMLElement;
              }
            }

            // Tìm actions buttons container trong document đầu tiên
            if (firstDocument) {
              const actionsContainer = firstDocument.querySelector('[data-tour="contracts-actions-buttons"]');
              if (actionsContainer) {
                setTimeout(() => {
                  actionsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return actionsContainer as HTMLElement;
              }

              // Fallback: Tìm buttons container trong document
              const buttonsContainer = Array.from(firstDocument.querySelectorAll('div')).find((el) => {
                const className = el.className || '';
                return (
                  className.includes('flex') &&
                  className.includes('gap') &&
                  Array.from(el.querySelectorAll('button')).length >= 2
                );
              });
              if (buttonsContainer) {
                setTimeout(() => {
                  buttonsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return buttonsContainer as HTMLElement;
              }
            }

            return undefined;
          },
          popover: {
            title: t('contracts.tour.actions_buttons.title'),
            description: t('contracts.tour.actions_buttons.description'),
            side: 'left',
            align: 'start'
          }
        },
        // Bước 8: Giới thiệu pagination
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const pagination = document.querySelector('[data-tour="contracts-pagination"]');
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
            const paginationEl = Array.from(document.querySelectorAll('div')).find((el) => {
              const text = el.textContent || '';
              const rect = el.getBoundingClientRect();
              return (
                rect.width > 0 &&
                rect.height > 0 &&
                ((text.includes('Previous') && text.includes('Next')) ||
                  (text.includes('Trước') && text.includes('Sau')))
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
            title: t('contracts.tour.pagination.title'),
            description: t('contracts.tour.pagination.description'),
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
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang Contracts.');
      }
    }, 800);
  };

  return {
    startContractsTour
  };
}
