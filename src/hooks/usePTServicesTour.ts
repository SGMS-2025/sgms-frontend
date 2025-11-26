import { useTourBase } from './useTourBase';
import { findElementByTourAttr, findSidebarElementByText, findButtonByText, isElementVisible } from './tourUtils';

/**
 * Hook để tạo tour hướng dẫn sử dụng PT Services
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function usePTServicesTour() {
  const { t, startTour } = useTourBase();

  /**
   * Khởi chạy tour hướng dẫn PT Services
   * Tour sẽ hướng dẫn từ sidebar đến trang PT Services và các tính năng chính
   */
  const startPTServicesTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Business Services trong sidebar
      {
        element: () =>
          findElementByTourAttr('business-services-menu', () =>
            findSidebarElementByText(['business services', 'dịch vụ kinh doanh'], ['pt services', 'class services'])
          ),
        popover: {
          title: t('pt_service.tour.sidebar_business_services.title'),
          description: t('pt_service.tour.sidebar_business_services.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 2: Hướng dẫn click vào PT Services
      {
        element: () =>
          findElementByTourAttr('pt-services-menu-item', () =>
            findSidebarElementByText(['pt services', 'dịch vụ pt', 'pt / personal training'], ['class services'])
          ),
        popover: {
          title: t('pt_service.tour.sidebar_pt_services.title'),
          description: t('pt_service.tour.sidebar_pt_services.description'),
          side: 'right' as const,
          align: 'center' as const
        }
      },
      // Bước 3: Giới thiệu nút Add Feature
      {
        element: () =>
          findElementByTourAttr('pt-add-feature-button', () =>
            findButtonByText(['add feature', 'thêm quyền lợi'], ['package', 'gói'])
          ),
        popover: {
          title: t('pt_service.tour.add_feature_button.title'),
          description: t('pt_service.tour.add_feature_button.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 4: Giới thiệu nút Add Package
      {
        element: () =>
          findElementByTourAttr('pt-add-package-button', () =>
            findButtonByText(['add package', 'thêm gói'], ['feature'])
          ),
        popover: {
          title: t('pt_service.tour.add_package_button.title'),
          description: t('pt_service.tour.add_package_button.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 5: Giới thiệu nút Preview/Edit toggle
      {
        element: () =>
          findElementByTourAttr('pt-preview-edit-toggle', () =>
            findButtonByText(['preview', 'xem trước', 'edit', 'chỉnh sửa'], ['save', 'lưu'])
          ),
        popover: {
          title: t('pt_service.tour.preview_edit_toggle.title'),
          description: t('pt_service.tour.preview_edit_toggle.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 6: Giới thiệu nút Save Changes (chỉ khi ở edit mode)
      {
        element: () => {
          const element =
            findElementByTourAttr('pt-save-changes-button') ||
            findButtonByText(['save changes', 'lưu thay đổi'], ['preview', 'edit']);
          return element && isElementVisible(element) ? element : undefined;
        },
        popover: {
          title: t('pt_service.tour.save_changes_button.title'),
          description: t('pt_service.tour.save_changes_button.description'),
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      // Bước 7: Giới thiệu bảng matrix
      {
        element: () => {
          const element = findElementByTourAttr('pt-matrix-table');
          if (element) return element;

          return Array.from(document.querySelectorAll('div')).find((el) => {
            const className = el.className || '';
            const text = el.textContent?.toLowerCase() || '';
            return (
              (className.includes('grid') || className.includes('border')) &&
              (text.includes('features') ||
                text.includes('packages') ||
                text.includes('quyền lợi') ||
                text.includes('gói'))
            );
          }) as HTMLElement | undefined;
        },
        popover: {
          title: t('pt_service.tour.matrix_table.title'),
          description: t('pt_service.tour.matrix_table.description'),
          side: 'top' as const,
          align: 'start' as const
        }
      }
    ];

    startTour(steps, 'PT Services');
  };

  return {
    startPTServicesTour
  };
}
