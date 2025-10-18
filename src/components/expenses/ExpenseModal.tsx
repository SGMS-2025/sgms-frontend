import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, DollarSign, Calendar, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ExpenseDisplay } from '@/types/api/Expenses';
import { EXPENSE_CATEGORY_DISPLAY } from '@/types/api/Expenses';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseDisplay | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, expense }) => {
  const { t } = useTranslation();

  if (!isOpen || !expense) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{t('expenses.modal.title', 'Chi tiết chi phí')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Amount and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{formatCurrency(expense.amount)}</span>
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">{t('expenses.form.category', 'Danh mục')}:</span>
            <Badge variant="outline" className="text-sm">
              {t(`expenses.categories.${expense.category.toLowerCase()}`, EXPENSE_CATEGORY_DISPLAY[expense.category])}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">{t('expenses.form.description', 'Mô tả')}</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{expense.description}</p>
          </div>

          {/* Branch */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('expenses.form.branch', 'Chi nhánh')}:</span>
            <span className="text-sm font-medium">{expense.branchName}</span>
          </div>

          {/* Created By */}
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">{t('expenses.modal.created_by', 'Tạo bởi')}:</span>
            <span className="text-sm font-medium">{expense.createdByName}</span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <span className="text-sm text-gray-600 block">{t('expenses.modal.created_at', 'Ngày tạo')}</span>
                <span className="text-sm font-medium">{formatDate(expense.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <span className="text-sm text-gray-600 block">
                  {t('expenses.modal.updated_at', 'Cập nhật lần cuối')}
                </span>
                <span className="text-sm font-medium">{formatDate(expense.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('common.close', 'Đóng')}
          </Button>
        </div>
      </div>
    </div>
  );
};
