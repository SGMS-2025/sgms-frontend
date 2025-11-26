import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng PT Services
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function usePTServicesTour() {
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
   * Khởi chạy tour hướng dẫn PT Services
   * Tour sẽ hướng dẫn từ sidebar đến trang PT Services và các tính năng chính
   */
  const startPTServicesTour = () => {
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
                !text.includes('class services')
              );
            });

            return (businessServicesMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('pt_service.tour.sidebar_business_services.title'),
            description: t('pt_service.tour.sidebar_business_services.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Hướng dẫn click vào PT Services
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const ptServicesButton = document.querySelector('[data-tour="pt-services-menu-item"]');
            if (ptServicesButton) return ptServicesButton as HTMLElement;

            // Fallback: Tìm menu item PT Services trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "PT Services" hoặc "Dịch vụ PT"
            const ptServicesMenu = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return (
                (text.includes('pt services') ||
                  text.includes('dịch vụ pt') ||
                  text.includes('pt / personal training')) &&
                !text.includes('class services')
              );
            });

            return (ptServicesMenu as HTMLElement) || undefined;
          },
          popover: {
            title: t('pt_service.tour.sidebar_pt_services.title'),
            description: t('pt_service.tour.sidebar_pt_services.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 3: Giới thiệu nút Add Feature
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const addFeatureButton = document.querySelector('[data-tour="pt-add-feature-button"]');
            if (addFeatureButton) return addFeatureButton as HTMLElement;

            // Fallback: Tìm nút "Add Feature" hoặc "Thêm Quyền Lợi"
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              return (
                (text.includes('add feature') ||
                  text.includes('thêm quyền lợi') ||
                  (text.includes('add') && text.includes('feature'))) &&
                !text.includes('package') &&
                !text.includes('gói')
              );
            });
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('pt_service.tour.add_feature_button.title'),
            description: t('pt_service.tour.add_feature_button.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 4: Giới thiệu nút Add Package
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const addPackageButton = document.querySelector('[data-tour="pt-add-package-button"]');
            if (addPackageButton) return addPackageButton as HTMLElement;

            // Fallback: Tìm nút "Add Package" hoặc "Thêm gói"
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              return (
                (text.includes('add package') ||
                  text.includes('thêm gói') ||
                  (text.includes('add') && text.includes('package'))) &&
                !text.includes('feature')
              );
            });
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('pt_service.tour.add_package_button.title'),
            description: t('pt_service.tour.add_package_button.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 5: Giới thiệu nút Preview/Edit toggle
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const previewEditButton = document.querySelector('[data-tour="pt-preview-edit-toggle"]');
            if (previewEditButton) return previewEditButton as HTMLElement;

            // Fallback: Tìm nút Preview hoặc Edit
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              return (
                (text.includes('preview') ||
                  text.includes('xem trước') ||
                  text.includes('edit') ||
                  text.includes('chỉnh sửa')) &&
                !text.includes('save') &&
                !text.includes('lưu')
              );
            });
            return (buttons as HTMLElement) || undefined;
          },
          popover: {
            title: t('pt_service.tour.preview_edit_toggle.title'),
            description: t('pt_service.tour.preview_edit_toggle.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 6: Giới thiệu nút Save Changes (chỉ khi ở edit mode)
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const saveButton = document.querySelector('[data-tour="pt-save-changes-button"]');
            if (saveButton) {
              // Kiểm tra xem button có visible không
              const isVisible = saveButton.getBoundingClientRect().width > 0;
              if (isVisible) return saveButton as HTMLElement;
            }

            // Fallback: Tìm nút Save Changes
            const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
              const text = btn.textContent?.toLowerCase() || '';
              return (
                (text.includes('save changes') || text.includes('lưu thay đổi')) &&
                !text.includes('preview') &&
                !text.includes('edit')
              );
            });
            // Chỉ trả về nếu button visible
            if (buttons) {
              const isVisible = buttons.getBoundingClientRect().width > 0;
              if (isVisible) return buttons as HTMLElement;
            }
            return undefined;
          },
          popover: {
            title: t('pt_service.tour.save_changes_button.title'),
            description: t('pt_service.tour.save_changes_button.description'),
            side: 'bottom',
            align: 'end'
          }
        },
        // Bước 7: Giới thiệu bảng matrix
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const matrixTable = document.querySelector('[data-tour="pt-matrix-table"]');
            if (matrixTable) return matrixTable as HTMLElement;

            // Fallback: Tìm phần matrix table
            const matrix = Array.from(document.querySelectorAll('div')).find((el) => {
              const className = el.className || '';
              const text = el.textContent?.toLowerCase() || '';
              return (
                (className.includes('grid') || className.includes('border')) &&
                (text.includes('features') ||
                  text.includes('packages') ||
                  text.includes('quyền lợi') ||
                  text.includes('gói'))
              );
            });
            return (matrix as HTMLElement) || undefined;
          },
          popover: {
            title: t('pt_service.tour.matrix_table.title'),
            description: t('pt_service.tour.matrix_table.description'),
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
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang PT Services.');
      }
    }, 800);
  };

  return {
    startPTServicesTour
  };
}
