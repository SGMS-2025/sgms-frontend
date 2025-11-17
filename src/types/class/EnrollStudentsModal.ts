/**
 * EnrollStudentsModal Component Props
 * Used in: sgms-frontend/src/components/class/EnrollStudentsModal.tsx
 */
export interface EnrollStudentsModalProps {
  classId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
