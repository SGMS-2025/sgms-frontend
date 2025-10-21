import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { UsePhotoManagerOptions } from '@/types/components/pt/Progress';

export const usePhotoManager = ({ maxPhotos, existingPhotos = [] }: UsePhotoManagerOptions) => {
  const { t } = useTranslation();
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [existingPhotosState, setExistingPhotosState] = useState<{ url: string; publicId: string }[]>(existingPhotos);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Store initial existingPhotos to avoid infinite loop
  const initialExistingPhotos = useRef(existingPhotos);

  // Only update when existingPhotos prop actually changes (one time sync on mount or when prop updates)
  useEffect(() => {
    // Use JSON stringify for deep comparison to avoid reference issues
    if (JSON.stringify(existingPhotos) !== JSON.stringify(initialExistingPhotos.current)) {
      setExistingPhotosState(existingPhotos);
      initialExistingPhotos.current = existingPhotos;
    }
  }, [existingPhotos]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      newPhotos.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
    };
  }, [newPhotos]);

  const getTotalPhotos = () => existingPhotosState.length + newPhotos.length;

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      setIsCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error(t('toast.camera_permission_denied'));
      console.error('Camera error:', error);
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      if (getTotalPhotos() >= maxPhotos) {
        toast.error(t('toast.progress_max_photos'));
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setNewPhotos((prev) => [...prev, url]);
              closeCamera();
            } else {
              toast.error(t('toast.progress_capture_photo_failed'));
            }
          },
          'image/jpeg',
          0.8
        );
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const validFiles: File[] = [];
      const invalidFiles: File[] = [];

      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file);
        }
      });

      const totalPhotos = getTotalPhotos();
      if (totalPhotos + validFiles.length > maxPhotos) {
        toast.error(t('toast.progress_max_photos_limit', { count: maxPhotos - totalPhotos }));
        return;
      }

      validFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        setNewPhotos((prev) => [...prev, url]);
      });

      if (invalidFiles.length > 0) {
        toast.error(t('toast.progress_invalid_files', { count: invalidFiles.length }));
      }
    }

    if (event.target) {
      event.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    if (index < existingPhotosState.length) {
      setExistingPhotosState((prev) => prev.filter((_, i) => i !== index));
    } else {
      const newPhotoIndex = index - existingPhotosState.length;
      setNewPhotos((prev) => {
        const updated = prev.filter((_, i) => i !== newPhotoIndex);
        URL.revokeObjectURL(prev[newPhotoIndex]);
        return updated;
      });
    }
  };

  const cleanupNewPhotos = useCallback(() => {
    newPhotos.forEach((blobUrl) => {
      URL.revokeObjectURL(blobUrl);
    });
    setNewPhotos([]);
  }, [newPhotos]);

  const resetPhotos = useCallback(() => {
    cleanupNewPhotos();
    // Use initialExistingPhotos ref to avoid triggering effect
    setExistingPhotosState(initialExistingPhotos.current);
  }, [cleanupNewPhotos]);

  const getAllPhotosAsUrls = useCallback(
    () => [...existingPhotosState.map((p) => p.url), ...newPhotos],
    [existingPhotosState, newPhotos]
  );

  const canAddMore = useMemo(() => {
    const total = existingPhotosState.length + newPhotos.length;
    return total < maxPhotos;
  }, [existingPhotosState.length, newPhotos.length, maxPhotos]);

  return {
    // State
    newPhotos,
    existingPhotos: existingPhotosState,
    isCameraOpen,
    stream,

    // Refs
    fileInputRef,
    videoRef,
    canvasRef,

    // Methods
    openCamera,
    closeCamera,
    capturePhoto,
    handleFileUpload,
    removePhoto,
    cleanupNewPhotos,
    resetPhotos,
    getAllPhotosAsUrls,
    getTotalPhotos,

    // Computed
    canAddMore
  };
};
