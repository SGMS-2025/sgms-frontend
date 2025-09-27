import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, RefreshCw, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useEquipmentQR } from '../../hooks/useEquipmentQR';
import type { Equipment } from '../../types/api/Equipment';
import { downloadQRCodeFile, copyToClipboard } from '../../utils/qrCodeUtils';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  onQRGenerated?: (equipment: Equipment) => void;
  showSuccessToast?: boolean; // New prop to control toast display
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onQRGenerated,
  showSuccessToast = true
}) => {
  const { t } = useTranslation();
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [qrData, setQrData] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrGenerating, setQrGenerating] = useState(false);
  const hasGeneratedRef = useRef(false);

  // Sử dụng hooks thay vì API calls
  const { generateQRCode, downloadQRCode, loading, error, resetError } = useEquipmentQR();

  const handleGenerateQRCode = useCallback(async () => {
    if (!equipment || loading || qrGenerating || hasGeneratedRef.current) return; // Tránh gọi nhiều lần đồng thời

    setQrGenerating(true);
    hasGeneratedRef.current = true; // Đánh dấu đã generate

    const response = await generateQRCode(equipment._id);

    if (response) {
      setQrImageUrl(response.qrCode?.url || '');
      setQrData(response.qrCode?.data || '');
      setQrLoaded(true);

      // Don't call onQRGenerated here to avoid modal closing
      // if (onQRGenerated) {
      //   console.log('QRCodeModal - calling onQRGenerated callback');
      //   onQRGenerated(response);
      // }

      if (showSuccessToast) {
        toast.success(t('equipment.qr_code_generated'));
      }
    } else {
      toast.error(t('equipment.qr_code_error'));
    }

    setQrGenerating(false);
  }, [equipment?._id, onQRGenerated, t, showSuccessToast, generateQRCode, loading]);

  const loadQRCode = useCallback(async () => {
    if (!equipment || loading || qrLoaded || qrGenerating || hasGeneratedRef.current) return; // Tránh gọi nhiều lần đồng thời

    // Nếu equipment đã có QR code, sử dụng URL hiện có
    if (equipment.qrCode?.url) {
      setQrImageUrl(equipment.qrCode.url);
      // Chỉ set QR data nếu nó tồn tại và không rỗng
      if (equipment.qrCode.data && equipment.qrCode.data.trim() !== '') {
        setQrData(equipment.qrCode.data);
      } else {
        setQrData('');
      }
      setQrLoaded(true);
    } else {
      // Nếu chưa có QR code, generate mới
      await handleGenerateQRCode();
    }
  }, [equipment, loading, qrLoaded, qrGenerating, handleGenerateQRCode]);

  useEffect(() => {
    if (isOpen && equipment && !qrLoaded && !hasGeneratedRef.current) {
      // Use setTimeout to avoid race conditions
      const timeoutId = setTimeout(() => {
        if (!hasGeneratedRef.current) {
          loadQRCode();
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, equipment?._id]); // Only depend on isOpen and equipment ID

  // Reset QR loaded state when equipment changes
  useEffect(() => {
    setQrLoaded(false);
    setQrImageUrl('');
    setQrData('');
    setQrGenerating(false);
    hasGeneratedRef.current = false; // Reset ref khi equipment thay đổi
  }, [equipment?._id]);

  const handleDownload = async () => {
    if (!equipment) return;

    const blob = await downloadQRCode(equipment._id);
    downloadQRCodeFile(blob, equipment.equipmentCode, equipment.equipmentName);
    toast.success(t('equipment.qr_code_downloaded'));
  };

  const handleCopyData = async () => {
    if (!qrData) return;

    const success = await copyToClipboard(qrData);
    if (success) {
      setCopied(true);
      toast.success(t('equipment.qr_code_copied'));
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(t('equipment.qr_code_error'));
    }
  };

  if (!isOpen || !equipment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('equipment.qr_code')} - {equipment.equipmentName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-700">{error}</div>
              <button onClick={resetError} className="mt-2 text-xs text-red-600 hover:text-red-800">
                {t('common.dismiss')}
              </button>
            </div>
          )}

          {/* Equipment Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{t('equipment.qr_code_info')}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{t('equipment.equipment_code')}:</span>
                <span className="ml-2 font-medium">{equipment.equipmentCode}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('equipment.equipment_name')}:</span>
                <span className="ml-2 font-medium">{equipment.equipmentName}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('equipment.category')}:</span>
                <span className="ml-2 font-medium">{equipment.category}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('equipment.manufacturer')}:</span>
                <span className="ml-2 font-medium">{equipment.manufacturer}</span>
              </div>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="text-center">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="animate-spin text-blue-500" size={32} />
                <span className="ml-2 text-gray-600">{t('equipment.qr_code_generating')}</span>
              </div>
            ) : qrImageUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={qrImageUrl}
                    alt={`${t('equipment.qr_code')} - ${equipment.equipmentName}`}
                    className="border-2 border-gray-200 rounded-lg shadow-sm"
                    style={{ maxWidth: '300px', maxHeight: '300px' }}
                    onError={(e) => {
                      console.error('QR code image failed to load:', e);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">{t('equipment.qr_code_error')}</p>
                <button
                  onClick={handleGenerateQRCode}
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center mx-auto"
                >
                  <RefreshCw size={16} className="mr-2" />
                  {t('equipment.qr_code_generate')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex space-x-2">
            {qrData && (
              <button
                onClick={handleCopyData}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copied ? <Check size={16} className="mr-1" /> : <Copy size={16} className="mr-1" />}
                {copied ? t('equipment.qr_code_copied') : t('equipment.qr_code_copy')}
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            {qrImageUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download size={16} className="mr-2" />
                {t('equipment.qr_code_download')}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              {t('equipment.excel_import_close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
