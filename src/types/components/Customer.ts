import type { PTCustomer } from '@/types/api/Customer';

export interface PTCustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: PTCustomer | null;
}

export interface PTCustomerListProps {
  trainerId?: string;
}
