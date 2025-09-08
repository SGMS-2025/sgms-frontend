import { Label } from '@/components/ui/label';
import type { InfoCardProps } from '@/types/api/FormFieldCustomer';

export const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
    <Label className="font-semibold text-gray-600 mb-3 block flex items-center">
      <Icon className="w-5 h-5 mr-2 text-orange-500" />
      {title}
    </Label>
    {children}
  </div>
);
