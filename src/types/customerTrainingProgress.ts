export type ContractStatus = 'active' | 'past' | 'all';
export type TrendInterval = 'day' | 'week' | 'month';

// Contract related types
export interface PTContract {
  id: string;
  packageName: string;
  trainer: {
    id: string;
    name: string;
    avatarUrl?: string;
  } | null;
  sessionsRemaining: number;
  sessionsTotal: number;
  status: string;
  isCompleted: boolean;
  startDate: string;
  endDate: string;
}

// Progress entry types
export interface TrainingProgressEntry {
  id: string;
  date: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  strengthScore: number;
  note?: string;
  photos?: string[];
  sourceContractId?: string;
}

export interface TrainingProgressListResponse {
  items: TrainingProgressEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  contractsMeta: {
    activeCount: number;
    pastCount: number;
  };
}

// Statistics types
export interface TrainingProgressStats {
  scope: 'aggregate' | 'single';
  minWeight: number | null;
  maxWeight: number | null;
  avgWeight: number | null;
  minBMI: number | null;
  maxBMI: number | null;
  avgBMI: number | null;
  sessionsDone: number;
  sessionsTotal: number;
}

// Trend data types
export interface TrendDataPoint {
  date: string;
  weightKg: number | null;
  bmi: number | null;
  strengthScore: number | null;
  sourceContractId?: string;
  recordCount: number;
}

// Query parameters
export interface GetContractsParams {
  status?: ContractStatus;
}

export interface ListProgressParams {
  contractId?: string;
  status?: ContractStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface GetStatsParams {
  contractId?: string;
  status?: ContractStatus;
}

export interface GetTrendParams {
  contractId?: string;
  status?: ContractStatus;
  from?: string;
  to?: string;
  interval?: TrendInterval;
}
