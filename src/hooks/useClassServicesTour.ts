import { useTourBase } from './useTourBase';
import {
  findElementByTourAttr,
  findButtonByText,
  findSidebarElementWithScroll,
  scrollIntoView,
  isElementVisible
} from './tourUtils';

/**
 * Hook để tạo tour hướng dẫn sử dụng Class Services
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useClassServicesTour() {
  const { t, startTour } = useTourBase();

  /**
   * Khởi chạy tour hướng dẫn Class Services
   * Tour sẽ hướng dẫn từ sidebar đến trang Class Services và các tính năng chính
   */
  const startClassServicesTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Business Services trong sidebar
      {
        element: () =>
          findSidebarElementWithScroll(
            'business-services-menu',
            ['business services', 'dịch vụ kinh doanh'],
            ['pt services', 'class services']
          ),
        popover: {
          title: t('class_service.tour.sidebar_business_services.title'),
          description: t('class_service.tour.sidebar_business_services.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 2: Hướng dẫn click vào Class Services
      {
        element: () =>
          findSidebarElementWithScroll(
            'class-services-menu-item',
            ['class services', 'lớp học', 'class service'],
            ['pt services']
          ),
        popover: {
          title: t('class_service.tour.sidebar_class_services.title'),
          description: t('class_service.tour.sidebar_class_services.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 3: Giới thiệu nút Add Feature
      {
        element: () =>
          findElementByTourAttr('class-add-feature-button', () =>
            findButtonByText(['add feature', 'thêm quyền lợi'], ['package', 'gói', 'class'])
          ),
        popover: {
          title: t('class_service.tour.add_feature_button.title'),
          description: t('class_service.tour.add_feature_button.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 4: Giới thiệu nút Add Class
      {
        element: () =>
          findElementByTourAttr('class-add-class-button', () =>
            findButtonByText(['add class', 'thêm lớp'], ['feature'])
          ),
        popover: {
          title: t('class_service.tour.add_class_button.title'),
          description: t('class_service.tour.add_class_button.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 5: Giới thiệu nút Preview/Edit toggle
      {
        element: () =>
          findElementByTourAttr('class-preview-edit-toggle', () =>
            findButtonByText(['preview', 'xem trước', 'edit', 'chỉnh sửa'], ['save', 'lưu'])
          ),
        popover: {
          title: t('class_service.tour.preview_edit_toggle.title'),
          description: t('class_service.tour.preview_edit_toggle.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 6: Giới thiệu nút Save Changes (chỉ khi ở edit mode)
      {
        element: () => {
          const element =
            findElementByTourAttr('class-save-changes-button') ||
            findButtonByText(['save changes', 'lưu thay đổi'], ['preview', 'edit']);
          return element && isElementVisible(element) ? element : undefined;
        },
        popover: {
          title: t('class_service.tour.save_changes_button.title'),
          description: t('class_service.tour.save_changes_button.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 7: Giới thiệu bảng matrix
      {
        element: () => {
          let element = findElementByTourAttr('class-matrix-table');
          if (element && isElementVisible(element)) {
            scrollIntoView(element);
            return element;
          }

          element = Array.from(document.querySelectorAll('div')).find((el) => {
            const className = el.className || '';
            const hasBorder = className.includes('border-orange-200') || className.includes('border-orange');
            const hasGrid = el.querySelector('[class*="grid"]') !== null;
            const text = el.textContent?.toLowerCase() || '';
            return (
              hasBorder &&
              hasGrid &&
              (text.includes('features') ||
                text.includes('packages') ||
                text.includes('quyền lợi') ||
                text.includes('gói') ||
                text.includes('class'))
            );
          }) as HTMLElement | undefined;

          if (element && isElementVisible(element)) {
            scrollIntoView(element);
            return element;
          }

          return undefined;
        },
        popover: {
          title: t('class_service.tour.matrix_table.title'),
          description: t('class_service.tour.matrix_table.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      }
    ];

    startTour(steps, 'Class Services');
  };

  return {
    startClassServicesTour
  };
}
