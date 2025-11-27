import { useTourBase } from './useTourBase';

/**
 * Hook để tạo tour hướng dẫn sử dụng Expenses trong sidebar
 *
 * @returns Object chứa hàm startTour để khởi chạy tour
 */
export function useExpensesTour() {
  const { t, startTour } = useTourBase({ popoverOffset: 2 });

  /**
   * Khởi chạy tour hướng dẫn Expenses
   * Tour sẽ hướng dẫn từ sidebar đến trang Expenses và các tính năng chính
   */
  const startExpensesTour = () => {
    const steps = [
      // Bước 1: Giới thiệu menu Finance trong sidebar
      {
        element: () => {
          // Ưu tiên tìm bằng data-tour attribute
          const financeButton = document.querySelector('[data-tour="finance-menu"]');
          if (financeButton) return financeButton as HTMLElement;

          // Fallback: Tìm menu Finance trong sidebar
          const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
          if (!sidebar) return undefined;

          // Tìm button chứa text "Finance" hoặc "Tài chính"
          const financeMenu = Array.from(sidebar.querySelectorAll('button')).find((el) => {
            const text = el.textContent?.toLowerCase() || '';
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
            return (
              (text.includes('finance') ||
                text.includes('tài chính') ||
                ariaLabel.includes('finance') ||
                ariaLabel.includes('tài chính')) &&
              !text.includes('expenses') &&
              !text.includes('kpi')
            );
          });

          return (financeMenu as HTMLElement) || undefined;
        },
        popover: {
          title: t('expenses.tour.sidebar_finance.title'),
          description: t('expenses.tour.sidebar_finance.description'),
          side: 'right',
          align: 'center'
        }
      },
      // Bước 2: Hướng dẫn click vào Expenses
      {
        element: () => {
          // Ưu tiên tìm bằng data-tour attribute
          const expensesButton = document.querySelector('[data-tour="expenses-menu-item"]');
          if (expensesButton) {
            setTimeout(() => {
              expensesButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return expensesButton as HTMLElement;
          }

          // Fallback: Tìm menu item Expenses trong sidebar
          const sidebar = document.querySelector('[class*="sidebar"]') || document.querySelector('nav');
          if (!sidebar) return undefined;

          // Tìm button chứa text "Expenses" hoặc "Chi phí"
          const expensesMenu = Array.from(sidebar.querySelectorAll('button')).find((el) => {
            const text = el.textContent?.toLowerCase() || '';
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
            return (
              (text.includes('expenses') ||
                text.includes('chi phí') ||
                ariaLabel.includes('expenses') ||
                ariaLabel.includes('chi phí')) &&
              !text.includes('kpi') &&
              !text.includes('finance')
            );
          });

          if (expensesMenu) {
            setTimeout(() => {
              expensesMenu.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }

          return (expensesMenu as HTMLElement) || undefined;
        },
        popover: {
          title: t('expenses.tour.sidebar_expenses.title'),
          description: t('expenses.tour.sidebar_expenses.description'),
          side: 'right',
          align: 'center'
        }
      },
      // Bước 3: Giới thiệu header và nút tạo mới (chỉ khi đã ở trang Expenses)
      {
        element: () => {
          // Ưu tiên tìm bằng data-tour attribute
          const tourButton = document.querySelector('[data-tour="create-expense-button"]');
          if (tourButton) return tourButton as HTMLElement;

          // Fallback: Tìm nút "Tạo chi phí mới" hoặc "Create new expense"
          const buttons = Array.from(document.querySelectorAll('button')).find((btn) => {
            const text = btn.textContent?.toLowerCase() || '';
            return (
              (text.includes('tạo') || text.includes('create') || text.includes('new')) &&
              !text.includes('hướng dẫn') &&
              !text.includes('guide')
            );
          });
          return (buttons as HTMLElement) || undefined;
        },
        popover: {
          title: t('expenses.tour.create_button.title'),
          description: t('expenses.tour.create_button.description'),
          side: 'bottom',
          align: 'end'
        }
      },
      // Bước 4: Giới thiệu phần tìm kiếm
      {
        element: () => {
          // Ưu tiên tìm bằng data-tour attribute
          const searchContainer = document.querySelector('[data-tour="expense-search-container"]');
          if (searchContainer) return searchContainer as HTMLElement;

          const searchInput = document.querySelector('[data-tour="expense-search-input"]');
          if (searchInput) return searchInput as HTMLElement;

          // Fallback: Tìm input search trong phần Expenses (có placeholder "Tìm kiếm chi phí...")
          const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[placeholder]'));
          const expenseSearchInput = allInputs.find((input) => {
            const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
            // Tìm input có placeholder chứa "tìm kiếm chi phí" - đây là search bar trong Expenses
            return (
              (placeholder.includes('tìm kiếm chi phí') || placeholder.includes('search expense')) &&
              !placeholder.includes('phone') && // Loại trừ search bar ở header
              !placeholder.includes('membership') &&
              !placeholder.includes('name, phone')
            );
          });
          return (expenseSearchInput as HTMLElement) || undefined;
        },
        popover: {
          title: t('expenses.tour.search.title'),
          description: t('expenses.tour.search.description'),
          side: 'bottom',
          align: 'start'
        }
      },
      // Bước 5: Giới thiệu filter danh mục
      {
        element: () => {
          // Ưu tiên tìm bằng data-tour attribute
          const categoryFilter = document.querySelector('[data-tour="expense-category-filter"]');
          if (categoryFilter) return categoryFilter as HTMLElement;

          // Fallback: Tìm select category
          const selects = Array.from(document.querySelectorAll('select, [role="combobox"]')).find((select) => {
            const label = select.getAttribute('aria-label') || '';
            const placeholder = select.textContent || '';
            return (
              label.toLowerCase().includes('category') ||
              label.toLowerCase().includes('danh mục') ||
              placeholder.toLowerCase().includes('category') ||
              placeholder.toLowerCase().includes('danh mục') ||
              placeholder.toLowerCase().includes('tất cả')
            );
          });
          return (selects as HTMLElement) || undefined;
        },
        popover: {
          title: t('expenses.tour.category_filter.title'),
          description: t('expenses.tour.category_filter.description'),
          side: 'bottom',
          align: 'start'
        }
      },
      // Bước 6: Giới thiệu danh sách chi phí
      {
        element: () => {
          // Tìm phần danh sách expenses (div chứa các expense items)
          const expenseList = Array.from(document.querySelectorAll('div[class*="divide-y"]')).find((el) => {
            // Tìm div chứa danh sách expenses (có class divide-y và chứa các expense items)
            const hasExpenseItems = el.querySelectorAll('[class*="flex"], [class*="items-center"]').length > 0;
            const text = el.textContent?.toLowerCase() || '';
            return (
              hasExpenseItems &&
              (text.includes('₫') || text.includes('đ') || text.includes('equipment') || text.includes('thiết bị'))
            );
          });

          if (expenseList) {
            return expenseList as HTMLElement;
          }

          // Fallback: Tìm card chứa danh sách
          const cards = Array.from(document.querySelectorAll('[class*="card"]')).find((el) => {
            const text = el.textContent?.toLowerCase() || '';
            return (
              (text.includes('expense') || text.includes('chi phí') || text.includes('₫')) &&
              el.querySelector('div[class*="divide-y"]')
            );
          });
          return (cards as HTMLElement) || undefined;
        },
        popover: {
          title: t('expenses.tour.expense_list.title'),
          description: t('expenses.tour.expense_list.description'),
          side: 'top',
          align: 'start'
        }
      },
      // Bước 7: Giới thiệu menu actions (Xem, Chỉnh sửa, Xóa)
      {
        element: () => {
          // Ưu tiên tìm bằng data-tour attribute
          const actionsMenu = document.querySelector('[data-tour="expense-actions-menu"]');
          if (actionsMenu) return actionsMenu as HTMLElement;

          // Fallback: Tìm button có icon MoreHorizontal (3 chấm) trong expense list
          const actionButton = Array.from(document.querySelectorAll('button')).find((btn) => {
            const svg = btn.querySelector('svg');
            const hasMoreHorizontal =
              svg &&
              (svg.innerHTML.includes('MoreHorizontal') || svg.getAttribute('class')?.includes('MoreHorizontal'));
            // Kiểm tra button nằm trong expense list (có text chứa ₫ hoặc đ)
            const parent = btn.closest('div[class*="divide-y"], div[class*="card"]');
            const parentText = parent?.textContent?.toLowerCase() || '';
            return (
              hasMoreHorizontal &&
              (parentText.includes('₫') || parentText.includes('đ') || parentText.includes('equipment'))
            );
          });

          return (actionButton as HTMLElement) || undefined;
        },
        popover: {
          title: t('expenses.tour.actions_menu.title'),
          description: t('expenses.tour.actions_menu.description'),
          side: 'left',
          align: 'center'
        }
      }
    ];

    startTour(steps, 'Expenses', 500);
  };

  return {
    startExpensesTour
  };
}
