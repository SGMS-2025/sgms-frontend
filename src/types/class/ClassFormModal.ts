/**
 * ClassFormModal Component Props
 * Used in: sgms-frontend/src/components/class/ClassFormModal.tsx
 */
export interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: string;
  branchId: string;
  onSuccess?: () => void;
}
