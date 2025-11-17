/**
 * ClassQuickViewModal Component Props
 * Used in: sgms-frontend/src/components/class/ClassQuickViewModal.tsx
 */
export interface ClassQuickViewModalProps {
  classId: string;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onEditClick?: (classId: string) => void;
  onEnrollClick?: (classId: string) => void;
}
