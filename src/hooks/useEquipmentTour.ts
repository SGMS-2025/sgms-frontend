import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng Equipment
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useEquipmentTour() {
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
   * Khởi chạy tour hướng dẫn Equipment
   * Tour sẽ hướng dẫn từ sidebar đến trang Equipment và các tính năng chính
   */
  const startEquipmentTour = () => {
    // Đợi một chút để đảm bảo DOM đã render, đặc biệt là các buttons và stats
    setTimeout(() => {
      const steps = [
        // Bước 1: Giới thiệu menu Equipment trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const equipmentButton = document.querySelector('[data-tour="equipment-menu-item"]');
            if (equipmentButton) {
              setTimeout(() => {
                equipmentButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return equipmentButton as HTMLElement;
            }

            // Fallback: Tìm menu Equipment trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Equipment" hoặc "Thiết bị"
            const equipmentMenu = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return text.includes('equipment') || text.includes('thiết bị');
            });

            if (equipmentMenu) {
              setTimeout(() => {
                equipmentMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }

            return (equipmentMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('equipment.tour.sidebar_equipment.title'),
            description: t('equipment.tour.sidebar_equipment.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Giới thiệu stats cards
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const statsCards = document.querySelector('[data-tour="equipment-stats-cards"]');
            if (statsCards) {
              setTimeout(() => {
                statsCards.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return statsCards as HTMLElement;
            }

            // Fallback: Tìm stats cards container - tìm div có chứa "Total Equipment" hoặc category stats
            const stats = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              const text = el.textContent || '';
              return (
                (className.includes('rounded-xl') || className.includes('rounded-lg')) &&
                (className.includes('border') || className.includes('bg-')) &&
                (text.includes('Total') ||
                  text.includes('STRENGTH') ||
                  text.includes('CARDIO') ||
                  text.includes('Tổng') ||
                  text.includes('Sức mạnh'))
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
            title: t('equipment.tour.stats_cards.title'),
            description: t('equipment.tour.stats_cards.description'),
            side: 'right',
            align: 'start'
          }
        },
        // Bước 3: Giới thiệu tabs
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const tabs = document.querySelector('[data-tour="equipment-tabs"]');
            if (tabs) return tabs as HTMLElement;

            // Fallback: Tìm tabs container - tìm div chứa các button tabs
            const tabsContainer = Array.from(document.querySelectorAll('div')).find((el) => {
              const buttons = Array.from(el.querySelectorAll('button'));
              return (
                buttons.length >= 3 &&
                buttons.some((btn) => {
                  const text = btn.textContent?.toLowerCase() || '';
                  return (
                    text.includes('equipment') ||
                    text.includes('repair') ||
                    text.includes('maintenance') ||
                    text.includes('thiết bị')
                  );
                })
              );
            });
            return (tabsContainer as HTMLElement) || undefined;
          },
          popover: {
            title: t('equipment.tour.tabs.title'),
            description: t('equipment.tour.tabs.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 4: Giới thiệu nút Add Equipment
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const addButton = document.querySelector('[data-tour="equipment-add-button"]') as HTMLElement;

            if (addButton) {
              setTimeout(() => {
                addButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return addButton;
            }

            // Fallback: Tìm nút "Add Equipment" hoặc "Thêm thiết bị"
            const allButtons = Array.from(document.querySelectorAll('button'));
            const buttons = allButtons.find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              const hasPlusIcon = btn.querySelector('svg') !== null;
              const className = btn.className || '';
              return (
                hasPlusIcon &&
                (text.includes('add equipment') ||
                  text.includes('thêm thiết bị') ||
                  (text.includes('add') && text.includes('equipment'))) &&
                (className.includes('orange') || className.includes('bg-orange'))
              );
            }) as HTMLElement | undefined;

            if (buttons) {
              setTimeout(() => {
                buttons.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return buttons;
            }

            return undefined;
          },
          popover: {
            title: t('equipment.tour.add_button.title'),
            description: t('equipment.tour.add_button.description'),
            side: 'left',
            align: 'start'
          }
        },
        // Bước 5: Giới thiệu search input
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const searchInput = document.querySelector('[data-tour="equipment-search-input"]');
            if (searchInput) return searchInput as HTMLElement;

            // Fallback: Tìm search input
            const inputs = Array.from(document.querySelectorAll('input[type="text"]')).find((input) => {
              const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
              return (
                placeholder.includes('equipment') ||
                placeholder.includes('thiết bị') ||
                placeholder.includes('search') ||
                placeholder.includes('tìm')
              );
            });
            return (inputs as HTMLElement) || undefined;
          },
          popover: {
            title: t('equipment.tour.search.title'),
            description: t('equipment.tour.search.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 6: Giới thiệu filters (Category và Status)
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const filters = document.querySelector('[data-tour="equipment-filters"]');
            if (filters) return filters as HTMLElement;

            // Fallback: Tìm filters container - tìm div chứa category và status dropdowns
            const filtersContainer = Array.from(document.querySelectorAll('div')).find((el) => {
              const buttons = Array.from(el.querySelectorAll('button'));
              return buttons.some((btn) => {
                const text = btn.textContent?.toLowerCase() || '';
                return (
                  text.includes('category') ||
                  text.includes('status') ||
                  text.includes('loại') ||
                  text.includes('trạng thái') ||
                  text.includes('all categories') ||
                  text.includes('all statuses')
                );
              });
            });
            return (filtersContainer as HTMLElement) || undefined;
          },
          popover: {
            title: t('equipment.tour.filters.title'),
            description: t('equipment.tour.filters.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 7: Giới thiệu equipment list
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const equipmentList = document.querySelector('[data-tour="equipment-list"]');
            if (equipmentList) {
              const rect = equipmentList.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTimeout(() => {
                  equipmentList.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return equipmentList as HTMLElement;
              }
            }

            // Fallback: Tìm table hoặc cards container
            const table = document.querySelector('table');
            if (table) {
              setTimeout(() => {
                table.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return table as HTMLElement;
            }

            // Fallback: Tìm cards container
            const cardsContainer = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              return (
                (className.includes('space-y') || className.includes('lg:hidden')) &&
                Array.from(el.querySelectorAll('[class*="rounded-lg"], [class*="border"]')).length > 0
              );
            });
            if (cardsContainer) {
              setTimeout(() => {
                cardsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              return cardsContainer as HTMLElement;
            }

            return undefined;
          },
          popover: {
            title: t('equipment.tour.equipment_list.title'),
            description: t('equipment.tour.equipment_list.description'),
            side: 'top',
            align: 'start'
          }
        },
        // Bước 8: Giới thiệu actions buttons (View, QR Code, Edit, Delete)
        {
          element: () => {
            // Ưu tiên: Tìm actions buttons trong table hoặc card đầu tiên
            const equipmentList = document.querySelector('[data-tour="equipment-list"]');
            let firstRow: HTMLElement | null = null;

            if (equipmentList) {
              // Tìm trong table
              const table = equipmentList.querySelector('table');
              if (table) {
                firstRow = table.querySelector('tbody tr') as HTMLElement;
              } else {
                // Tìm trong cards
                firstRow = equipmentList.querySelector('[class*="rounded-lg"], [class*="border"]') as HTMLElement;
              }
            } else {
              // Fallback: Tìm table hoặc card đầu tiên
              const table = document.querySelector('table tbody tr');
              if (table) {
                firstRow = table as HTMLElement;
              } else {
                const card = Array.from(document.querySelectorAll('div')).find((el) => {
                  const className = el.className || '';
                  return (
                    className.includes('rounded-lg') &&
                    className.includes('border') &&
                    el.querySelector('button') !== null
                  );
                });
                if (card) {
                  firstRow = card as HTMLElement;
                }
              }
            }

            // Tìm actions buttons container trong row/card đầu tiên
            if (firstRow) {
              // Tìm div chứa các action buttons
              const actionsContainer = Array.from(firstRow.querySelectorAll('div')).find((el) => {
                const buttons = el.querySelectorAll('button');
                return buttons.length >= 3; // Có ít nhất 3 buttons (View, Edit, Delete)
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

            return undefined;
          },
          popover: {
            title: t('equipment.tour.actions_buttons.title'),
            description: t('equipment.tour.actions_buttons.description'),
            side: 'left',
            align: 'start'
          }
        },
        // Bước 9: Giới thiệu pagination
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const pagination = document.querySelector('[data-tour="equipment-pagination"]') as HTMLElement;
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
            title: t('equipment.tour.pagination.title'),
            description: t('equipment.tour.pagination.description'),
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
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang Equipment.');
      }
    }, 800);
  };

  return {
    startEquipmentTour
  };
}
