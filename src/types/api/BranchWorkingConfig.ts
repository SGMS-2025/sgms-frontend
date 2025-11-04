export interface ShiftConfig {
  type: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'CUSTOM';
  startTime: string;
  endTime: string;
  customName?: string;
}

export interface OvertimeConfig {
  enabled: boolean;
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  overtimeRate: number;
}

export interface BreakConfig {
  enabled: boolean;
  breakDuration: number;
  breakAfterHours: number;
}

export interface RoleConfig {
  role: 'PT' | 'TECHNICIAN' | 'MANAGER';
  workingDays: number[];
  shifts: string[];
  salaryType: 'HOURLY' | 'FIXED' | 'COMMISSION';
  hourlyRate?: number;
  fixedSalary?: number;
}

export interface BranchWorkingConfig {
  branchId: string;
  defaultWorkingDays: number[];
  defaultDayOff: number[];
  defaultShifts: ShiftConfig[];
  restPattern: '6-1' | '12-1' | 'CUSTOM' | string;
  customRestPattern?: string;
  overtimeConfig: OvertimeConfig;
  breakConfig: BreakConfig;
  roleConfigs: RoleConfig[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Request cũng cho phép tất cả field tùy chọn + customRestPattern
export type BranchWorkingConfigRequest = Partial<BranchWorkingConfig> & {
  branchId?: string;
  customRestPattern?: string;
};
