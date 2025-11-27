import { useTourBase } from './useTourBase';
import {
  findElementByTourAttr,
  findSidebarElementWithScroll,
  findSearchInput,
  findStatsCards,
  findPagination,
  scrollIntoView,
  isElementVisible
} from './tourUtils';

/**
 * Hook để tạo tour hướng dẫn sử dụng Equipment
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useEquipmentTour() {
  const { t, startTour } = useTourBase();

  /**
   * Khởi chạy tour hướng dẫn Equipment
   * Tour sẽ hướng dẫn từ sidebar đến trang Equipment và các tính năng chính
   */
  const startEquipmentTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Equipment trong sidebar
      {
        element: () => findSidebarElementWithScroll('equipment-menu-item', ['equipment', 'thiết bị']),
        popover: {
          title: t('equipment.tour.sidebar_equipment.title'),
          description: t('equipment.tour.sidebar_equipment.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 2: Giới thiệu stats cards
      {
        element: () => findStatsCards('equipment-stats-cards', 1, ['Total', 'STRENGTH', 'CARDIO', 'Tổng', 'Sức mạnh']),
        popover: {
          title: t('equipment.tour.stats_cards.title'),
          description: t('equipment.tour.stats_cards.description'),
          side: 'right' as const,
          align: 'start' as const
        }
      },
      // Bước 3: Giới thiệu tabs
      {
        element: () => {
          const element = findElementByTourAttr('equipment-tabs');
          if (element) return element;

          return Array.from(document.querySelectorAll('div')).find((el) => {
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
          }) as HTMLElement | undefined;
        },
        popover: {
          title: t('equipment.tour.tabs.title'),
          description: t('equipment.tour.tabs.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 4: Giới thiệu nút Add Equipment
      {
        element: () => {
          let element = findElementByTourAttr('equipment-add-button') as HTMLElement | undefined;
          if (element) {
            scrollIntoView(element);
            return element;
          }

          element = Array.from(document.querySelectorAll('button')).find((btn) => {
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

          if (element) {
            scrollIntoView(element);
            return element;
          }

          return undefined;
        },
        popover: {
          title: t('equipment.tour.add_button.title'),
          description: t('equipment.tour.add_button.description'),
          side: 'left' as const,
          align: 'start' as const
        }
      },
      // Bước 5: Giới thiệu search input
      {
        element: () => findSearchInput('equipment-search', ['equipment', 'thiết bị', 'search', 'tìm']),
        popover: {
          title: t('equipment.tour.search.title'),
          description: t('equipment.tour.search.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 6: Giới thiệu filters (Category và Status)
      {
        element: () => {
          const element = findElementByTourAttr('equipment-filters');
          if (element) return element;

          return Array.from(document.querySelectorAll('div')).find((el) => {
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
          }) as HTMLElement | undefined;
        },
        popover: {
          title: t('equipment.tour.filters.title'),
          description: t('equipment.tour.filters.description'),
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      // Bước 7: Giới thiệu equipment list
      {
        element: () => {
          let element = findElementByTourAttr('equipment-list') as HTMLElement | undefined;
          if (element && isElementVisible(element)) {
            scrollIntoView(element);
            return element;
          }

          const table = document.querySelector('table');
          if (table && isElementVisible(table)) {
            scrollIntoView(table);
            return table as HTMLElement;
          }

          element = Array.from(document.querySelectorAll('div')).find((el) => {
            const className = el.className || '';
            return (
              (className.includes('space-y') || className.includes('lg:hidden')) &&
              Array.from(el.querySelectorAll('[class*="rounded-lg"], [class*="border"]')).length > 0
            );
          }) as HTMLElement | undefined;

          if (element && isElementVisible(element)) {
            scrollIntoView(element);
            return element;
          }

          return undefined;
        },
        popover: {
          title: t('equipment.tour.equipment_list.title'),
          description: t('equipment.tour.equipment_list.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      },
      // Bước 8: Giới thiệu actions buttons (View, QR Code, Edit, Delete)
      {
        element: () => {
          const equipmentList = findElementByTourAttr('equipment-list') as HTMLElement | undefined;
          let firstRow: HTMLElement | null = null;

          if (equipmentList) {
            const table = equipmentList.querySelector('table');
            if (table) {
              firstRow = table.querySelector('tbody tr') as HTMLElement;
            } else {
              firstRow = equipmentList.querySelector('[class*="rounded-lg"], [class*="border"]') as HTMLElement;
            }
          } else {
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

          if (firstRow) {
            const actionsContainer = Array.from(firstRow.querySelectorAll('div')).find((el) => {
              const buttons = el.querySelectorAll('button');
              return buttons.length >= 3;
            });

            if (actionsContainer && isElementVisible(actionsContainer)) {
              scrollIntoView(actionsContainer);
              return actionsContainer as HTMLElement;
            }

            const viewButton = Array.from(firstRow.querySelectorAll('button')).find((btn) => {
              const icon = btn.querySelector('svg');
              return icon && icon.querySelector('path[d*="M"]') !== null;
            });

            if (viewButton && isElementVisible(viewButton)) {
              scrollIntoView(viewButton);
              return viewButton as HTMLElement;
            }
          }

          return undefined;
        },
        popover: {
          title: t('equipment.tour.actions_buttons.title'),
          description: t('equipment.tour.actions_buttons.description'),
          side: 'left' as const,
          align: 'start' as const
        }
      },
      // Bước 9: Giới thiệu pagination
      {
        element: () => findPagination('equipment-pagination'),
        popover: {
          title: t('equipment.tour.pagination.title'),
          description: t('equipment.tour.pagination.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      }
    ];

    startTour(steps, 'Equipment');
  };

  return {
    startEquipmentTour
  };
}
