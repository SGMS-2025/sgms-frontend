import { useState, useCallback } from 'react';
import { equipmentApi } from '@/services/api/equipmentApi';

// Hook for QR Code operations
export const useEquipmentQR = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQRCode = useCallback(async (equipmentId: string) => {
    setLoading(true);
    setError(null);

    const response = await equipmentApi.generateQRCode(equipmentId);
    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      setError(response.message || 'Failed to generate QR code');
      setLoading(false);
      return null;
    }
  }, []);

  const downloadQRCode = useCallback(async (equipmentId: string) => {
    setLoading(true);
    setError(null);

    const blob = await equipmentApi.downloadQRCode(equipmentId);
    setLoading(false);
    return blob;
  }, []);

  const getQRCodeData = useCallback(async (equipmentId: string) => {
    setLoading(true);
    setError(null);

    const response = await equipmentApi.getQRCodeData(equipmentId);
    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      setError(response.message || 'Failed to get QR code data');
      setLoading(false);
      return null;
    }
  }, []);

  const downloadAllQRCodes = useCallback(async (branchId: string) => {
    setLoading(true);
    setError(null);

    const blob = await equipmentApi.downloadAllQRCodes(branchId);
    setLoading(false);
    return blob;
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generateQRCode,
    downloadQRCode,
    getQRCodeData,
    downloadAllQRCodes,
    loading,
    error,
    resetError
  };
};
