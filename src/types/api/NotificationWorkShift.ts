export interface NotificationWorkShiftData {
  workShiftId?: string;
  startTime?: string;
  endTime?: string;
  formattedStartTime?: string;
  formattedEndTime?: string;
  dayOfTheWeek?: string;
  branchName?: string;
  assignedBy?: string;
}

export interface NotificationWorkShift {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: NotificationWorkShiftData;
  read: boolean;
  timestamp: Date;
}

export interface NotificationData {
  workShiftId?: string;
  startTime?: string;
  endTime?: string;
  formattedStartTime?: string;
  formattedEndTime?: string;
  dayOfTheWeek?: string;
  branchName?: string;
  assignedBy?: string;
}

export type WorkShiftNotificationData = NotificationData;
