/**
 * ClassInfoCard Component Props
 * Used in: sgms-frontend/src/components/class/ClassInfoCard.tsx
 */
import type { Class } from '../Class';

export interface ClassInfoCardProps {
  classData: Class;
  onClick?: () => void;
  isCompact?: boolean;
  onEdit?: () => void;
  onEnroll?: () => void;
  onDelete?: () => void;
}
