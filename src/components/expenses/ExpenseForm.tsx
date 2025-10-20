import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, DollarSign, FileText, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useBranch } from '@/contexts/BranchContext';
import type {
  ExpenseFormData,
  ExpenseCategory,
  CreateExpenseRequest,
  UpdateExpenseRequest
} from '@/types/api/Expenses';
import { EXPENSE_CATEGORY_DISPLAY } from '@/types/api/Expenses';

interface ExpenseFormProps {
  initialData?: ExpenseFormData;
  onSubmit: (data: CreateExpenseRequest | UpdateExpenseRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isEditMode?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  isEditMode = false
}) => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();

  const [formData, setFormData] = useState<ExpenseFormData>(() => {
    if (initialData) {
      return initialData;
    }
    return {
      category: 'EQUIPMENT',
      description: '',
      amount: ''
    };
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});

  // Reset form when switching between create/edit modes
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData(() => initialData);
    } else if (!isEditMode) {
      setFormData(() => ({
        category: 'EQUIPMENT',
        description: '',
        amount: ''
      }));
    }
  }, [isEditMode, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ExpenseFormData, string>> = {};

    if (!formData.category) {
      newErrors.category = t('expenses.form.category_required', 'Danh mục là bắt buộc');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('expenses.form.description_required', 'Mô tả là bắt buộc');
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = t('expenses.form.amount_required', 'Số tiền phải lớn hơn 0');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      category: formData.category,
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      branchId: currentBranch?._id || ''
    };

    await onSubmit(submitData);
  };

  const handleInputChange = (field: keyof ExpenseFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatAmount = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }

    return numericValue;
  };

  const categoryOptions = Object.entries(EXPENSE_CATEGORY_DISPLAY).map(([key, _]) => [
    key as ExpenseCategory,
    t(`expenses.categories.${key.toLowerCase()}`, EXPENSE_CATEGORY_DISPLAY[key as ExpenseCategory])
  ]) as [ExpenseCategory, string][];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {t('expenses.form.category', 'Danh mục')}
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleInputChange('category', value as ExpenseCategory)}
          >
            <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
              <SelectValue placeholder={t('expenses.form.select_category', 'Chọn danh mục')} />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {t('expenses.form.amount', 'Số tiền')}
          </Label>
          <Input
            id="amount"
            type="text"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', formatAmount(e.target.value))}
            placeholder={t('expenses.form.amount_placeholder', 'Nhập số tiền')}
            className={errors.amount ? 'border-red-500' : ''}
          />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {t('expenses.form.description', 'Mô tả')}
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder={t('expenses.form.description_placeholder', 'Nhập mô tả chi phí')}
          className={errors.description ? 'border-red-500' : ''}
          rows={3}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('common.cancel', 'Hủy')}
        </Button>
        <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? t('expenses.form.update', 'Cập nhật') : t('expenses.form.create', 'Tạo mới')}
        </Button>
      </div>
    </form>
  );
};
