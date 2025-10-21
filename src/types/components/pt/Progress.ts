import type { TrainingProgressDisplay } from '@/types/api/TrainingProgress';

type TrainingLog = TrainingProgressDisplay;

export interface TrainingLogTableProps {
  logs: TrainingLog[];
  onEdit: (log: TrainingLog) => void;
  onDelete: (logId: string) => void;
}

export interface BMIDisplayProps {
  weight: string;
  height: string;
}

export interface CameraModalProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onCapture: () => void;
  onClose: () => void;
}

export interface PhotoUploadSectionProps {
  maxPhotos: number;
  existingPhotos: { url: string; publicId: string }[];
  newPhotos: string[];
  canAddMore: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenCamera: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  onUploadClick: () => void;
}

export interface UsePhotoManagerOptions {
  maxPhotos: number;
  existingPhotos?: { url: string; publicId: string }[];
}
