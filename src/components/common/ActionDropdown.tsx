import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Eye, Edit, Trash2, CheckCircle, XCircle, AlertCircle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/utils';

interface ActionItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  show?: boolean;
}

interface ActionDropdownProps {
  actions: ActionItem[];
  className?: string;
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({ actions, className }) => {
  const { t } = useTranslation();

  const visibleActions = actions.filter((action) => action.show !== false);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={
            className ||
            'inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500 flex-shrink-0'
          }
          title={t('common.more_actions')}
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {visibleActions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn('flex items-center gap-2', action.className)}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface ActionConfig {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  canEdit?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canCancel?: boolean;
  t?: (key: string) => string;
}

// Helper function to create common action items
export const createActionItems = (config: ActionConfig): ActionItem[] => {
  const {
    onView,
    onEdit,
    onDelete,
    onApprove,
    onReject,
    onCancel,
    canEdit = false,
    canApprove = false,
    canReject = false,
    canCancel = false,
    t
  } = config;

  const translate = t || ((key: string) => key);

  return [
    {
      key: 'view',
      label: translate('common.view'),
      icon: <Eye className="h-4 w-4" />,
      onClick: onView || (() => {}),
      show: !!onView
    },
    {
      key: 'edit',
      label: translate('common.edit'),
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit || (() => {}),
      show: !!onEdit && canEdit,
      className: 'text-blue-600'
    },
    {
      key: 'approve',
      label: translate('common.approve'),
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: onApprove || (() => {}),
      show: !!onApprove && canApprove,
      className: 'text-green-600'
    },
    {
      key: 'reject',
      label: translate('common.reject'),
      icon: <XCircle className="h-4 w-4" />,
      onClick: onReject || (() => {}),
      show: !!onReject && canReject,
      className: 'text-red-600'
    },
    {
      key: 'cancel',
      label: translate('common.cancel'),
      icon: <AlertCircle className="h-4 w-4" />,
      onClick: onCancel || (() => {}),
      show: !!onCancel && canCancel,
      className: 'text-orange-600'
    },
    {
      key: 'delete',
      label: translate('common.delete'),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete || (() => {}),
      show: !!onDelete,
      className: 'text-red-600'
    }
  ];
};

export default ActionDropdown;
