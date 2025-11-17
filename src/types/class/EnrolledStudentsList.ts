/**
 * EnrolledStudentsList Component Props and Helper Types
 * Used in: sgms-frontend/src/components/class/EnrolledStudentsList.tsx
 */

/**
 * EnrolledStudentsList Props
 */
export interface EnrolledStudentsListProps {
  classId: string;
  onRemoveStudent?: (enrollmentId: string) => void;
  showHeader?: boolean;
  compact?: boolean;
}

/**
 * Helper interface for populated customer data
 */
export interface PopulatedCustomer {
  _id: string;
  userId: {
    fullName: string;
    email: string;
  };
}

/**
 * Helper interface for populated contract data
 */
export interface PopulatedContract {
  _id: string;
  servicePackageId:
    | {
        _id: string;
        name: string;
      }
    | string;
  sessionsTotal?: number;
  sessionsUsed?: number;
  sessionsRemaining?: number;
}
