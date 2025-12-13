import { useState, useRef, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { ExpenseList, type ExpenseListRef } from '@/components/expenses/ExpenseList';
import { ExpenseModal } from '@/components/expenses/ExpenseModal';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { useExpenseOperations } from '@/hooks/useExpenses';
import { useExpensesTour } from '@/hooks/useExpensesTour';
import type { Expense, ExpenseDisplay, CreateExpenseRequest, UpdateExpenseRequest } from '@/types/api/Expenses';

export default function ExpensesPage() {
  const { t } = useTranslation();

  // State management
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDisplay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // API hooks
  const { createExpense, updateExpense, disableExpense, loading: operationLoading } = useExpenseOperations();

  // Tour hook
  const { startExpensesTour } = useExpensesTour();

  // Ref for ExpenseList
  const expenseListRef = useRef<ExpenseListRef>(null);

  // Memoized initial data for ExpenseForm
  const initialDataMemo = useMemo(() => {
    if (!editingExpense) return undefined;
    const data = {
      category: editingExpense.category,
      description: editingExpense.description,
      amount: editingExpense.amount.toString()
    };
    return data;
  }, [editingExpense]);

  // Handlers
  const handleCreateExpense = () => {
    setEditingExpense(null);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleViewExpense = (expense: Expense) => {
    // Convert Expense to ExpenseDisplay format
    const expenseDisplay: ExpenseDisplay = {
      id: expense._id,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      branchId: typeof expense.branchId === 'string' ? expense.branchId : expense.branchId._id,
      branchName: typeof expense.branchId === 'string' ? '' : expense.branchId.branchName,
      createdBy: typeof expense.createdBy === 'string' ? expense.createdBy : expense.createdBy._id,
      createdByName:
        typeof expense.createdBy === 'string'
          ? ''
          : expense.createdBy.fullName || expense.createdBy.username || expense.createdBy.email || 'Unknown',
      status: expense.status,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt
    };

    setSelectedExpense(expenseDisplay);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;

    console.log('🗑️ Deleting expense directly:', expenseToDelete._id);

    const success = await disableExpense(expenseToDelete._id);

    if (success) {
      // Refetch the expense list after delete
      if (expenseListRef.current) {
        await expenseListRef.current.refetch();
        await expenseListRef.current.refetchStats();
      }
    }

    // Close dialog and reset state
    setIsDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };

  const handleFormSubmit = async (data: CreateExpenseRequest | UpdateExpenseRequest) => {
    if (isEditMode && editingExpense) {
      const result = await updateExpense(editingExpense._id, data as UpdateExpenseRequest);
      if (result) {
        // Refetch the expense list after update
        if (expenseListRef.current) {
          await expenseListRef.current.refetch();
          await expenseListRef.current.refetchStats();
        }
        // Close form only on success
        setIsFormOpen(false);
        setEditingExpense(null);
        setIsEditMode(false);
      }
    } else {
      const result = await createExpense(data as CreateExpenseRequest);
      if (result) {
        // Refetch the expense list after create
        if (expenseListRef.current) {
          await expenseListRef.current.refetch();
          await expenseListRef.current.refetchStats();
        }
        // Close form only on success
        setIsFormOpen(false);
        setEditingExpense(null);
        setIsEditMode(false);
      }
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
    setIsEditMode(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExpense(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <ExpenseList
        ref={expenseListRef}
        onExpenseSelect={handleViewExpense}
        onExpenseEdit={handleEditExpense}
        onExpenseDelete={handleDeleteExpense}
        onCreateExpense={handleCreateExpense}
        onStartTour={startExpensesTour}
      />

      {/* Expense Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {isEditMode
                  ? t('expenses.form.edit_title', 'Chỉnh sửa chi phí')
                  : t('expenses.form.create_title', 'Tạo chi phí mới')}
              </h2>
              <button onClick={handleFormCancel} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ExpenseForm
              key={editingExpense?._id || 'create'}
              initialData={initialDataMemo}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={operationLoading}
              isEditMode={isEditMode}
            />
          </div>
        </div>
      )}

      {/* Expense Detail/Edit Modal */}
      <ExpenseModal isOpen={isModalOpen} onClose={handleModalClose} expense={selectedExpense} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('expenses.delete_title', 'Xác nhận xóa chi phí')}</AlertDialogTitle>
            <AlertDialogDescription>
              {expenseToDelete && (
                <>
                  {t('expenses.delete_message', 'Bạn có chắc chắn muốn xóa chi phí này?')}
                  <br />
                  <strong>"{expenseToDelete.description}"</strong>
                  <br />
                  <span className="text-sm text-gray-500">
                    {t('expenses.delete_warning', 'Hành động này không thể hoàn tác.')}
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>{t('common.cancel', 'Hủy')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              {t('common.delete', 'Xóa')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
