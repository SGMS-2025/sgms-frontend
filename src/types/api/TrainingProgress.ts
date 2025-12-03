import type { ApiResponse } from '@/types/api/Api';

// Core types
export type TrainingProgressStatus = 'ACTIVE' | 'DELETED';

export interface TrainingProgressPhoto {
  publicId: string;
  url: string;
}

export interface TrainingProgress {
  _id: string;
  customerId: {
    _id: string;
    userId: {
      fullName: string;
      email: string;
      avatar?: { url: string; publicId: string };
    };
  };
  serviceContractId: string;
  trainerId: {
    _id: string;
    fullName: string;
  };
  branchId: string;
  trackingDate: string;
  weight: number;
  height: number;
  bmi: number;
  bodyFatPercentage?: number;
  // Body Measurements - Số đo cơ thể
  chest?: number; // Vòng ngực (cm)
  waist?: number; // Vòng eo (cm)
  hips?: number; // Vòng mông (cm)
  arms?: number; // Vòng tay (cm)
  thighs?: number; // Vòng đùi (cm)
  muscleMassPercentage?: number; // % cơ bắp
  bodyWaterPercentage?: number; // % nước trong cơ thể
  metabolicAge?: number; // Tuổi trao đổi chất
  strength: number;
  exercises: string[];
  notes: string;
  photos: TrainingProgressPhoto[];
  status: TrainingProgressStatus;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Display type for UI
export interface TrainingProgressDisplay {
  id: string;
  customerName: string;
  customerAvatar?: string;
  trainerName: string;
  date: string; // formatted date
  weight: number;
  height: number;
  bmi: number;
  bodyFatPercentage?: number;
  // Body Measurements - Số đo cơ thể
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  muscleMassPercentage?: number;
  bodyWaterPercentage?: number;
  metabolicAge?: number;
  strength: number;
  notes: string;
  photos: TrainingProgressPhoto[];
  exercises: string[];
  exerciseCount: number;
  photoCount: number;
  selected?: boolean;
}

// Statistics
export interface TrainingProgressStats {
  customerId: string;
  totalRecords: number;
  firstRecordDate: string;
  latestRecordDate: string;
  currentWeight: number;
  currentBMI: number;
  currentStrengthScore: number;
  startingWeight: number;
  avgWeight: number;
  avgBMI: number;
  avgStrengthScore: number;
  minWeight: number;
  maxWeight: number;
  weightChange: number;
  strengthChange: number;
}

// Trend data
export interface TrainingProgressTrend {
  date: string;
  weight: number;
  bmi: number;
  strength: number;
}

// API Request types
export interface TrainingProgressListParams {
  page?: number;
  limit?: number;
  sortBy?: 'trackingDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  customerId?: string;
  trainerId?: string;
  branchId?: string;
  serviceContractId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateTrainingProgressRequest {
  customerId: string;
  serviceContractId: string;
  trainerId: string;
  date: string; // Frontend uses 'date'
  weight: number;
  height: number;
  strength: number;
  notes?: string;
  exercises?: string[];
  photos?: TrainingProgressPhoto[];
  bodyFatPercentage?: number;
  // Body Measurements
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  muscleMassPercentage?: number;
  bodyWaterPercentage?: number;
  metabolicAge?: number;
}

export interface UpdateTrainingProgressRequest {
  date?: string;
  weight?: number;
  height?: number;
  strength?: number;
  notes?: string;
  exercises?: string[];
  photos?: TrainingProgressPhoto[];
  bodyFatPercentage?: number;
  // Body Measurements
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  muscleMassPercentage?: number;
  bodyWaterPercentage?: number;
  metabolicAge?: number;
}

export interface BackendPaginationResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Aggregation response type (flat structure from backend)
export interface TrainingProgressAggregated {
  _id: string;
  trackingDate: string;
  weight: number;
  height: number;
  bmi: number;
  bodyFatPercentage?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  muscleMassPercentage?: number;
  bodyWaterPercentage?: number;
  metabolicAge?: number;
  strength: number;
  notes: string;
  photos: TrainingProgressPhoto[];
  exercises: string[];
  customerName: string;
  customerAvatar?: string;
  trainerName: string;
  trainerId: string;
  photoCount: number;
  exerciseCount: number;
  createdAt: string;
}

export interface TrainingProgressListResponse {
  progressRecords: TrainingProgressAggregated[];
  pagination: BackendPaginationResponse;
}

// Hook return types
export interface UseTrainingProgressReturn {
  // List operations
  progressList: TrainingProgressDisplay[];
  loading: boolean;
  error: string | null;
  pagination: BackendPaginationResponse | null;
  refetch: () => Promise<void>;
  goToPage: (page: number) => void;

  // CRUD operations
  createProgress: (data: CreateTrainingProgressRequest) => Promise<ApiResponse<TrainingProgress>>;
  updateProgress: (progressId: string, data: UpdateTrainingProgressRequest) => Promise<ApiResponse<TrainingProgress>>;
  deleteProgress: (progressId: string) => Promise<ApiResponse<void>>;

  // Stats and Trend
  getCustomerStats: (customerId: string, params?: { days?: number }) => Promise<ApiResponse<TrainingProgressStats>>;
  getCustomerTrend: (customerId: string, days?: number) => Promise<ApiResponse<TrainingProgressTrend[]>>;

  // Photo operations
  addPhotos: (progressId: string, photos: TrainingProgressPhoto[]) => Promise<ApiResponse<TrainingProgress>>;
  uploadPhotos: (progressId: string, files: File[]) => Promise<ApiResponse<TrainingProgress>>;
  removePhoto: (progressId: string, photoIndex: number) => Promise<ApiResponse<TrainingProgress>>;

  // Operation states
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  photoLoading: boolean;
}
