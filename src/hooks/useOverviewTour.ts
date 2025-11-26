import { useTranslation } from 'react-i18next';
import { useDriver } from './useDriver';
import type { Config } from 'driver.js';

/**
 * Hook để tạo tour hướng dẫn sử dụng Overview/Dashboard
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useOverviewTour() {
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
   * Khởi chạy tour hướng dẫn Overview
   * Tour sẽ hướng dẫn các phần chính của dashboard
   */
  const startOverviewTour = () => {
    // Đợi một chút để đảm bảo DOM đã render
    setTimeout(() => {
      const steps = [
        // Bước 1: Giới thiệu menu Dashboard trong sidebar
        {
          element: () => {
            // Ưu tiên tìm bằng data-tour attribute
            const dashboardMenu = document.querySelector('[data-tour="dashboard-menu"]');
            if (dashboardMenu) return dashboardMenu as HTMLElement;

            // Fallback: Tìm menu Dashboard trong sidebar
            const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
            if (!sidebar) return undefined;

            // Tìm button chứa text "Dashboard" hoặc "Tổng quan"
            const dashboardButton = Array.from(sidebar.querySelectorAll('button, a')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
              return (
                (text.includes('dashboard') ||
                  text.includes('tổng quan') ||
                  ariaLabel.includes('dashboard') ||
                  ariaLabel.includes('tổng quan')) &&
                !text.includes('staff') &&
                !text.includes('customer')
              );
            });

            return (dashboardButton as HTMLElement) || undefined;
          },
          popover: {
            title: t('overview.tour.welcome.title'),
            description: t('overview.tour.welcome.description'),
            side: 'right',
            align: 'center'
          }
        },
        // Bước 2: Giới thiệu Total Revenue Card
        {
          element: () => {
            const revenueCard = document.querySelector('[data-tour="overview-revenue-card"]');
            if (revenueCard) return revenueCard as HTMLElement;

            // Fallback: Tìm card đầu tiên trong grid
            const cards = document.querySelectorAll('[class*="rounded-xl"][class*="shadow"]');
            return (cards[0] as HTMLElement) || undefined;
          },
          popover: {
            title: t('overview.tour.revenue_card.title'),
            description: t('overview.tour.revenue_card.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 3: Giới thiệu New Customers Card
        {
          element: () => {
            const customersCard = document.querySelector('[data-tour="overview-customers-card"]');
            if (customersCard) return customersCard as HTMLElement;

            // Fallback: Tìm card thứ 2 trong grid
            const cards = document.querySelectorAll('[class*="rounded-xl"][class*="shadow"]');
            return (cards[1] as HTMLElement) || undefined;
          },
          popover: {
            title: t('overview.tour.customers_card.title'),
            description: t('overview.tour.customers_card.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 4: Giới thiệu Active Accounts Chart (Roles)
        {
          element: () => {
            const rolesCard = document.querySelector('[data-tour="overview-roles-card"]');
            if (rolesCard) return rolesCard as HTMLElement;

            // Fallback: Tìm card có PieChart
            const pieChart = document.querySelector('[class*="PieChart"]')?.closest('[class*="rounded-xl"]');
            return (pieChart as HTMLElement) || undefined;
          },
          popover: {
            title: t('overview.tour.roles_card.title'),
            description: t('overview.tour.roles_card.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        // Bước 5: Giới thiệu Revenue Chart
        {
          element: () => {
            const revenueChart = document.querySelector('[data-tour="overview-revenue-chart"]');
            if (revenueChart) return revenueChart as HTMLElement;

            // Fallback: Tìm card có BarChart
            const barChart = document.querySelector('[class*="BarChart"]')?.closest('[class*="Card"]');
            return (barChart as HTMLElement) || undefined;
          },
          popover: {
            title: t('overview.tour.revenue_chart.title'),
            description: t('overview.tour.revenue_chart.description'),
            side: 'right',
            align: 'start'
          }
        },
        // Bước 6: Giới thiệu Stats Sidebar
        {
          element: () => {
            const statsSidebar = document.querySelector('[data-tour="overview-stats-sidebar"]');
            if (statsSidebar) return statsSidebar as HTMLElement;

            // Fallback: Tìm sidebar stats
            const sidebar = document.querySelector('[class*="col-span-4"]')?.querySelector('[class*="rounded"]');
            return (sidebar as HTMLElement) || undefined;
          },
          popover: {
            title: t('overview.tour.stats_sidebar.title'),
            description: t('overview.tour.stats_sidebar.description'),
            side: 'left',
            align: 'start'
          }
        },
        // Bước 7: Giới thiệu Branch List
        {
          element: () => {
            const branchList = document.querySelector('[data-tour="overview-branch-list"]');
            if (branchList) return branchList as HTMLElement;

            // Fallback: Tìm phần branch list
            const branchSection = Array.from(document.querySelectorAll('div')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return (text.includes('branch') || text.includes('chi nhánh')) && el.querySelector('[class*="grid"]');
            });
            return (branchSection as HTMLElement) || undefined;
          },
          popover: {
            title: t('overview.tour.branch_list.title'),
            description: t('overview.tour.branch_list.description'),
            side: 'right',
            align: 'start'
          }
        },
        // Bước 8: Giới thiệu KPI Leaderboard
        {
          element: () => {
            const kpiLeaderboard = document.querySelector('[data-tour="overview-kpi-leaderboard"]');
            if (kpiLeaderboard) return kpiLeaderboard as HTMLElement;

            // Fallback: Tìm phần có text "KPI LEADERBOARD" hoặc "BẢNG XẾP HẠNG KPI"
            const leaderboard = Array.from(document.querySelectorAll('div')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              return (
                (text.includes('kpi leaderboard') || text.includes('bảng xếp hạng kpi')) &&
                el.querySelector('[class*="Trophy"]')
              );
            });
            return (leaderboard as HTMLElement) || undefined;
          },
          popover: {
            title: t('overview.tour.kpi_leaderboard.title'),
            description: t('overview.tour.kpi_leaderboard.description'),
            side: 'left',
            align: 'start'
          }
        },
        // Bước 9: Giới thiệu Equipment Management List
        {
          element: () => {
            // Ưu tiên tìm phần table/list thiết bị
            const equipmentList = document.querySelector('[data-tour="overview-equipment-list"]');
            if (equipmentList) return equipmentList as HTMLElement;

            // Fallback: Tìm phần table có grid với các cột Machine code, Machine name, etc.
            const equipmentTable = Array.from(document.querySelectorAll('div')).find((el) => {
              const text = el.textContent?.toLowerCase() || '';
              const hasGrid = el.className.includes('grid') && el.className.includes('grid-cols-5');
              const hasMachineCode = text.includes('machine code') || text.includes('mã máy');
              const hasMachineName = text.includes('machine name') || text.includes('tên máy');
              return hasGrid && (hasMachineCode || hasMachineName);
            });

            if (equipmentTable) return equipmentTable as HTMLElement;

            // Fallback cuối cùng: Tìm phần có border-orange-200 và grid
            const fallbackTable = document.querySelector('[class*="border-orange-200"][class*="grid"]');
            return (fallbackTable as HTMLElement) || undefined;
          },
          popover: {
            title: t('overview.tour.equipment.title'),
            description: t('overview.tour.equipment.description'),
            side: 'top',
            align: 'center'
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
        console.warn('Không tìm thấy các elements để hiển thị tour. Vui lòng đảm bảo bạn đang ở trang Overview.');
      }
    }, 500);
  };

  return {
    startOverviewTour
  };
}
