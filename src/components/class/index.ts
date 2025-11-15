/**
 * ============================================
 * Class Management Components Barrel Export
 * ============================================
 *
 * Central export point for all class management components.
 * Makes importing easier: import { ClassInfoCard, ClassFormModal } from '@/components/class'
 */

export { ClassInfoCard } from './ClassInfoCard';
export { ClassCalendarTab } from './ClassCalendarTab';
export { ClassQuickViewModal } from './ClassQuickViewModal';
export { ClassFormModal } from './ClassFormModal';
export { EnrollStudentsModal } from './EnrollStudentsModal';
export { ClassListView } from './ClassListView';
export { EnrolledStudentsList } from './EnrolledStudentsList';

// Types re-exports (from Class.ts)
export type {
  Class,
  EnrolledStudent,
  SchedulePattern,
  PendingCustomer,
  CreateClassDTO,
  UpdateClassDTO,
  EnrollStudentsDTO,
  RemoveStudentDTO,
  ClassListResponse,
  PendingCustomersResponse,
  EnrollmentResult
} from '@/types/Class';

export {
  CLASS_STATUS,
  DAYS_OF_WEEK,
  DAY_LABELS,
  DEFAULT_PAGE_SIZE,
  createClassSchema,
  updateClassSchema,
  enrollStudentsSchema
} from '@/types/Class';
