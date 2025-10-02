import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Download, RefreshCw, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  const { generateQRCode, downloadQRCode, loading, error, resetError } = useEquipmentQR();

  const handleGenerateQRCode = useCallback(async () => {
    if (!equipment || loading || qrGenerating || hasGeneratedRef.current) return;

    setQrGenerating(true);
    hasGeneratedRef.current = true;

    const response = await generateQRCode(equipment._id);

    if (response) {
      setQrImageUrl(response.qrCode?.url || '');
      setQrData(response.qrCode?.data || '');
      setQrLoaded(true);

      if (showSuccessToast) {
        toast.success(t('equipment.qr_code_generated'));
      }
    } else {
      toast.error(t('equipment.qr_code_error'));
    }

    setQrGenerating(false);
  }, [equipment?._id, onQRGenerated, t, showSuccessToast, generateQRCode, loading]);

  const loadQRCode = useCallback(async () => {
    if (!equipment || loading || qrLoaded || qrGenerating || hasGeneratedRef.current) return;

    if (equipment.qrCode?.url) {
      setQrImageUrl(equipment.qrCode.url);
      if (equipment.qrCode.data && equipment.qrCode.data.trim() !== '') {
        setQrData(equipment.qrCode.data);
      } else {
        setQrData('');
      }
      setQrLoaded(true);
    } else {
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
    hasGeneratedRef.current = false;
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {t('equipment.qr_code')} - {equipment.equipmentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-700">{error}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetError}
                className="mt-2 text-xs text-red-600 hover:text-red-800 h-auto p-1"
              >
                {t('common.dismiss')}
              </Button>
            </div>
          )}

          {/* Equipment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">{t('equipment.qr_code_info')}</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <Card>
            <CardContent className="text-center pt-6">
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
                  <Button onClick={handleGenerateQRCode} disabled={loading} className="bg-blue-500 hover:bg-blue-600">
                    <RefreshCw size={16} className="mr-2" />
                    {t('equipment.qr_code_generate')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex space-x-2">
            {qrData && (
              <Button
                variant="ghost"
                onClick={handleCopyData}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                {copied ? <Check size={16} className="mr-1" /> : <Copy size={16} className="mr-1" />}
                {copied ? t('equipment.qr_code_copied') : t('equipment.qr_code_copy')}
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            {qrImageUrl && (
              <Button onClick={handleDownload} className="bg-green-500 hover:bg-green-600 text-white">
                <Download size={16} className="mr-2" />
                {t('equipment.qr_code_download')}
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              {t('equipment.excel_import_close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
