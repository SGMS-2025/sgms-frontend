export interface ProgressFormData {
  date: string;
  weight: number;
  height: number;
  bmi: number;
  strength: number;
  notes: string;
  photos: string[];
  exercises: string[];
}

export interface AddProgressFormProps {
  customerId: string;
  serviceContractId: string;
  trainerId: string;
  onSubmit: (data: ProgressFormData) => void;
  onCancel: () => void;
}

export interface TrainingLog {
  id: string;
  date: string;
  weight: number;
  height: number;
  bmi: number;
  strength: number;
  notes: string;
  photos: { url: string; publicId: string }[];
  exercises: string[];
}

export interface EditProgressFormData {
  date: string;
  weight: number;
  height: number;
  bmi: number;
  strength: number;
  notes: string;
  photos: string[];
  exercises: string[];
}

export interface EditProgressFormProps {
  progressId: string;
  initialData: TrainingLog;
  onSubmit: (data: EditProgressFormData) => void;
  onCancel: () => void;
}

export interface CustomerStats {
  totalRecords: number;
  currentWeight: number;
  currentBMI: number;
  currentStrengthScore: number;
  weightChange: number;
  strengthChange: number;
}

export interface TrainingProgressChartProps {
  data: Array<{
    date: string;
    weight: number;
    strength: number;
  }>;
}

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}
