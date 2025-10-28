import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { compressImageAdvanced, validateAndPrepareImages, TRAINING_PHOTO_OPTIONS } from '@/utils/imageUtils';
import type { UsePhotoManagerOptions } from '@/types/components/pt/Progress';

export const usePhotoManager = ({ maxPhotos, existingPhotos = [] }: UsePhotoManagerOptions) => {
  const { t } = useTranslation();
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [existingPhotosState, setExistingPhotosState] = useState<{ url: string; publicId: string }[]>(existingPhotos);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

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
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      if (getTotalPhotos() >= maxPhotos) {
        toast.error(t('toast.progress_max_photos'));
        return;
      }

      setIsProcessing(true);
      setProcessingProgress(30);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        setProcessingProgress(50);

        // Convert to blob with compression
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.8);
        });

        if (blob) {
          setProcessingProgress(60);

          // Compress if needed
          let finalBlob = blob;
          if (blob.size > 500 * 1024) {
            setProcessingProgress(75);
            const compressedFile = await compressImageAdvanced(blob, 500, TRAINING_PHOTO_OPTIONS);
            finalBlob = compressedFile;
          }

          const url = URL.createObjectURL(finalBlob);
          setNewPhotos((prev) => [...prev, url]);
          closeCamera();

          toast.success(
            t('toast.photo_captured', {
              defaultValue: 'Photo captured successfully'
            })
          );
        } else {
          toast.error(t('toast.progress_capture_photo_failed'));
        }
      }

      setIsProcessing(false);
      setProcessingProgress(100);
      setTimeout(() => setProcessingProgress(0), 1000);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Reset progress
    setProcessingProgress(0);
    setIsProcessing(true);

    // Validate files
    const { validFiles, errors } = validateAndPrepareImages(files);

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      setIsProcessing(false);
      return;
    }

    // Check total photos limit
    const totalPhotos = getTotalPhotos();
    if (totalPhotos + validFiles.length > maxPhotos) {
      toast.error(t('toast.progress_max_photos_limit', { count: maxPhotos - totalPhotos }));
      setIsProcessing(false);
      return;
    }

    setProcessingProgress(20);

    // Process files with compression
    const processedUrls: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      // Update progress
      setProcessingProgress(20 + (i / validFiles.length) * 70);

      // Compress image if it's larger than 500KB
      let processedFile = file;
      if (file.size > 500 * 1024) {
        processedFile = await compressImageAdvanced(file, 500, TRAINING_PHOTO_OPTIONS);
      }

      const url = URL.createObjectURL(processedFile);
      processedUrls.push(url);
    }

    setProcessingProgress(95);

    // Update photos state
    setNewPhotos((prev) => [...prev, ...processedUrls]);

    // Show success message
    if (processedUrls.length > 0) {
      toast.success(
        t('toast.photos_processed', {
          count: processedUrls.length,
          defaultValue: `${processedUrls.length} photo(s) processed successfully`
        })
      );
    }

    setIsProcessing(false);
    setProcessingProgress(100);

    // Clear progress after a delay
    setTimeout(() => setProcessingProgress(0), 1000);

    // Clear input
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
    isProcessing,
    processingProgress,

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
