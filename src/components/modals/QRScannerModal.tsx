import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QrCode, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import type { Equipment } from '@/types/api/Equipment';
import jsQR from 'jsqr'; // Uncomment after installing jsqr
import { useTranslation } from 'react-i18next';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipmentScanned: (equipment: Equipment) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onEquipmentScanned }) => {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const [scannedData, setScannedData] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Real QR code scanner using jsQR
  const fetchEquipmentDetails = useCallback(
    async (equipmentId: string, qrData: string) => {
      // Import equipment API
      const { equipmentApi } = await import('@/services/api/equipmentApi');

      // Fetch equipment details
      const response = await equipmentApi.getEquipmentById(equipmentId);

      if (response.success && response.data) {
        const equipment = response.data;

        // Add QR code data to equipment
        const equipmentWithQR: Equipment = {
          ...equipment,
          qrCode: {
            publicId: 'qr-id',
            url: '',
            data: qrData,
            generatedAt: new Date().toISOString()
          }
        };

        onEquipmentScanned(equipmentWithQR);
        toast.success(t('qrScanner.scanSuccess', 'Đã quét thành công QR code thiết bị!'));
        onClose();
      } else {
        toast.error(t('qrScanner.equipmentNotFound', 'Không tìm thấy thông tin thiết bị'));
        setIsScanning(false);
      }
    },
    [onEquipmentScanned, onClose]
  );

  const scanQRCode = useCallback(() => {
    console.log(
      'scanQRCode called - isScanning:',
      isScanning,
      'videoRef:',
      !!videoRef.current,
      'canvasRef:',
      !!canvasRef.current
    );

    if (!videoRef.current || !canvasRef.current || !isScanning) {
      console.log('scanQRCode early return - missing refs or not scanning');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) return;

    // Check if video is ready and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video not ready, dimensions:', video.videoWidth, 'x', video.videoHeight);
      // Continue scanning loop
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data from canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Try to decode QR code with options for better detection
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    // Debug log for scanning loop
    if (isScanning) {
      console.log('Scanning loop - Canvas size:', canvas.width, 'x', canvas.height);
      if (code) {
        console.log('QR Code detected in scanning loop:', code.data);
      }
    }

    if (code) {
      setScannedData(code.data);
      setIsScanning(false);

      // Parse QR data
      const qrData = JSON.parse(code.data);

      // Check if QR code has equipmentId
      if (qrData.equipmentId && qrData.type === 'equipment') {
        // Fetch equipment details from API
        fetchEquipmentDetails(qrData.equipmentId, code.data);
      } else {
        toast.error(t('qrScanner.invalidQR', 'QR code không hợp lệ hoặc không phải thiết bị'));
        setIsScanning(false);
      }
    } else {
      // Continue scanning
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    }
  }, [isScanning, fetchEquipmentDetails]);

  const startQRScanning = () => {
    if (isScanning) {
      return;
    }

    if (!hasPermission) {
      setError(t('qrScanner.cameraNotReady', 'Camera chưa sẵn sàng. Vui lòng đợi...'));
      toast.error(t('qrScanner.cameraNotReady', 'Camera chưa sẵn sàng. Vui lòng đợi...'));
      return;
    }

    // Đảm bảo camera đang hiển thị
    if (videoRef.current && streamRef.current) {
      const video = videoRef.current;
      if (!video.srcObject) {
        video.srcObject = streamRef.current;
        video.load();
      }

      // Force play để đảm bảo camera hiển thị
      video.play();
    }

    setError('');

    console.log('Starting QR scanning loop...');
    console.log('videoRef.current:', videoRef.current);
    console.log('canvasRef.current:', canvasRef.current);

    // Set scanning state
    setIsScanning(true);
  };

  const startScanning = async () => {
    setError('');
    setHasPermission(null);

    // Check if camera is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setError(t('qrScanner.cameraNotSupported', 'Camera không được hỗ trợ trên thiết bị này'));
      toast.error(t('qrScanner.cameraNotSupported', 'Camera không được hỗ trợ trên thiết bị này'));
      return;
    }

    // Request camera permission with fallback options
    let stream = null;

    // Try back camera first
    const backCameraResult = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Try back camera first
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    if (backCameraResult) {
      stream = backCameraResult;
    } else {
      // Try front camera as fallback
      const frontCameraResult = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (frontCameraResult) {
        stream = frontCameraResult;
      } else {
        setHasPermission(false);
        setError(
          t('qrScanner.cameraAccessDenied', 'Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera.')
        );
        toast.error(t('qrScanner.cameraAccessDenied', 'Không thể truy cập camera'));
        return;
      }
    }

    if (!stream) return;

    setHasPermission(true);
    streamRef.current = stream;

    if (videoRef.current) {
      const video = videoRef.current;

      // Clear any existing stream first
      if (video.srcObject) {
        const oldStream = video.srcObject as MediaStream;
        oldStream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }

      // Set up event listeners before setting srcObject
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded, starting playback...');
        video.play();
      };

      video.oncanplay = () => {
        console.log('Video can start playing');
      };

      video.onerror = (e) => {
        console.error('Video error:', e);
        setError(t('qrScanner.videoLoadError', 'Lỗi khi tải video từ camera'));
      };

      video.onplay = () => {
        console.log('Video is now playing');
      };

      // Set the stream
      video.srcObject = stream;
      console.log('Stream assigned to video:', video.srcObject);

      // Force load
      video.load();
    }

    // Camera is ready, but QR scanning needs to be implemented
    // User needs to click a button to start scanning
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsScanning(false);
    setScannedData('');
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // Start scanning when isScanning becomes true
  useEffect(() => {
    if (isScanning && hasPermission && videoRef.current && canvasRef.current) {
      console.log('useEffect: Starting scanning loop, isScanning:', isScanning);
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    }
  }, [isScanning, hasPermission, scanQRCode]);

  // Reset state when modal opens/closes and auto-start camera
  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      setError('');
      setScannedData('');
      setHasPermission(null);
    } else {
      // Auto-start camera when modal opens
      startScanning();
    }
  }, [isOpen]);

  // Auto-start QR scanning when camera is ready
  useEffect(() => {
    if (hasPermission === true && !isScanning && !scannedData) {
      // Small delay to ensure video element is ready
      const timer = setTimeout(() => {
        startQRScanning();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [hasPermission, isScanning, scannedData]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-2xl lg:max-w-4xl max-h-[90vh] mx-auto overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            {t('qrScanner.title', 'Quét QR Code Thiết Bị')}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {t('qrScanner.description', 'Sử dụng camera để quét QR code của thiết bị cần báo cáo lỗi')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 lg:space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Instructions */}
          <Card>
            <CardContent className="pt-3 sm:pt-4 lg:pt-6">
              <div className="text-xs sm:text-sm lg:text-base text-gray-600 space-y-2 lg:space-y-3">
                <p>1. {t('qrScanner.instruction1', 'Đảm bảo camera có quyền truy cập')}</p>
                <p>2. {t('qrScanner.instruction2', 'Hướng camera về phía QR code của thiết bị')}</p>
                <p>3. {t('qrScanner.instruction3', 'Chờ hệ thống tự động nhận diện')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Camera Preview */}
          <div className="relative max-h-[60vh] lg:max-h-[50vh]">
            {hasPermission === null && (
              <div className="aspect-square lg:aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <div className="text-center p-4">
                  <QrCode className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-600">
                    {t('qrScanner.initializing', 'Đang khởi tạo camera...')}
                  </p>
                </div>
              </div>
            )}

            {hasPermission === false && (
              <div className="aspect-square lg:aspect-video bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center overflow-hidden">
                <div className="text-center p-4">
                  <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-red-600">
                    {t('qrScanner.cameraError', 'Không thể truy cập camera')}
                  </p>
                  <p className="text-xs text-red-500 mt-1">{error}</p>
                </div>
              </div>
            )}

            {hasPermission === true && (
              <div className="relative aspect-square lg:aspect-video bg-gray-900 rounded-lg overflow-hidden max-h-full">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                  style={{ backgroundColor: '#000' }}
                />

                {/* Hidden canvas for QR code processing */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning overlay - chỉ hiển thị ở góc */}
                {isScanning && (
                  <div className="absolute top-4 left-4 bg-black bg-opacity-70 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-white">
                      <div className="animate-pulse w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <p className="text-sm">{t('qrScanner.scanning', 'Đang quét...')}</p>
                    </div>
                  </div>
                )}

                {/* Success overlay */}
                {scannedData && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">{t('qrScanner.success', 'Đã quét thành công!')}</p>
                    </div>
                  </div>
                )}

                {/* QR Code frame overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 lg:w-64 lg:h-64 border-2 border-white border-dashed rounded-lg"></div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-3">
              {hasPermission === false && (
                <Button onClick={startScanning} className="flex-1 bg-blue-500 hover:bg-blue-600">
                  <QrCode className="w-4 h-4 mr-2" />
                  {t('qrScanner.retry', 'Thử lại')}
                </Button>
              )}

              {hasPermission === true && !isScanning && !scannedData && (
                <div className="flex-1 bg-gray-100 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('qrScanner.initializing', 'Đang khởi tạo camera...')}</span>
                  </div>
                </div>
              )}

              {hasPermission === true && isScanning && (
                <div className="flex-1 bg-green-100 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('qrScanner.scanningQR', 'Đang quét QR code...')}</span>
                  </div>
                </div>
              )}

              <Button variant="outline" onClick={handleClose} className="flex-1">
                {t('common.close', 'Đóng')}
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
