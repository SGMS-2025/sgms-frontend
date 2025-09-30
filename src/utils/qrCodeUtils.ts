/**
 * Utility functions for QR code operations
 */
import type { Equipment, QRCodeData } from '@/types/api/Equipment';

/**
 * Download QR code image as file
 * @param blob - The blob data of the QR code image
 * @param equipmentCode - Equipment code for filename
 * @param equipmentName - Equipment name for filename
 */
export const downloadQRCodeFile = (blob: Blob, equipmentCode: string, equipmentName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Create filename from equipment code and name
  const sanitizedName = equipmentName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  link.download = `QR_${equipmentCode}_${sanitizedName}.png`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download ZIP file containing all QR codes
 * @param blob - The blob data of the ZIP file
 * @param branchName - Branch name for filename
 * @param branchId - Branch ID for filename
 */
export const downloadAllQRCodesFile = (blob: Blob, branchName: string, branchId: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Create filename from branch name and ID
  const sanitizedName = branchName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  link.download = `QR_Codes_${sanitizedName}_${branchId}.zip`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Generate QR code data object for equipment
 * @param equipment - Equipment object
 * @returns QR code data object
 */
export const generateQRCodeData = (equipment: Equipment): QRCodeData => {
  return {
    equipmentId: equipment._id,
    type: 'equipment'
  };
};

/**
 * Parse QR code data from string
 * @param qrDataString - QR code data as string
 * @returns Parsed QR code data or null if invalid
 */
export const parseQRCodeData = (qrDataString: string): QRCodeData | null => {
  try {
    // Check if string is empty, null, or undefined
    if (!qrDataString || qrDataString.trim() === '') {
      return null;
    }

    const parsed = JSON.parse(qrDataString);
    return parsed as QRCodeData;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
};

/**
 * Validate QR code data structure
 * @param qrData - QR code data object
 * @returns boolean indicating if data is valid
 */
export const validateQRCodeData = (qrData: unknown): qrData is QRCodeData => {
  if (!qrData || typeof qrData !== 'object') {
    return false;
  }

  // Backend chỉ gửi minimal data: equipmentId và type
  const requiredFields = ['equipmentId', 'type'];

  return requiredFields.every(
    (field) => field in qrData && typeof (qrData as Record<string, unknown>)[field] === 'string'
  );
};

/**
 * Format QR code data for display
 * @param qrData - QR code data object
 * @returns Formatted display data
 */
export const formatQRCodeDataForDisplay = (qrData: unknown) => {
  if (!validateQRCodeData(qrData)) {
    return null;
  }

  // Backend chỉ gửi minimal data, nên chỉ hiển thị thông tin có sẵn
  return {
    id: qrData.equipmentId,
    type: qrData.type,
    // Các thông tin khác sẽ được lấy từ API khi cần
    message: 'QR code chứa ID thiết bị. Sử dụng để tra cứu thông tin chi tiết.'
  };
};

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copy is complete
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

/**
 * Generate QR code filename
 * @param equipmentCode - Equipment code
 * @param equipmentName - Equipment name
 * @returns Formatted filename
 */
export const generateQRCodeFilename = (equipmentCode: string, equipmentName: string): string => {
  const sanitizedName = equipmentName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  return `QR_${equipmentCode}_${sanitizedName}_${timestamp}.png`;
};
