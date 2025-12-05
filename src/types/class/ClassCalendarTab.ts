/**
 * ClassCalendarTab Component Props
 * Used in: sgms-frontend/src/components/class/ClassCalendarTab.tsx
 */
export interface ClassCalendarTabProps {
  branchId: string;
  date: Date;
  timeSlot: { startTime: string; endTime: string };
  staffId?: string; // Optional: If provided, only show classes assigned to this trainer
}
