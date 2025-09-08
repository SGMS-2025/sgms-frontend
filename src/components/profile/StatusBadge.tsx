import { Badge } from '@/components/ui/badge';
import type { StatusBadgeProps } from '@/types/api/FormFieldCustomer';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  completedText = 'Hoàn thành',
  warningText = 'Đi muộn',
  missedText = 'Vắng mặt'
}) => {
  if (status === 'completed') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        {completedText}
      </Badge>
    );
  }
  if (status === 'warning') {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        {warningText}
      </Badge>
    );
  }
  if (status === 'missed') {
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        {missedText}
      </Badge>
    );
  }
  return null;
};
