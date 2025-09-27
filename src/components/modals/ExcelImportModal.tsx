import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { equipmentApi } from '../../services/api/equipmentApi';
import type { Branch } from '../../types/api/Branch';
import type { ExcelImportResult } from '../../types/api/Equipment';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  onImportSuccess?: () => void;
}

// ImportResult is now ExcelImportResult from Equipment types

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, branches, onImportSuccess }) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Helper function to handle interpolation manually
  const interpolate = (key: string, values: Record<string, string | number>): string => {
    let message = t(key);
    Object.entries(values).forEach(([placeholder, value]) => {
      message = message.replace(`{${placeholder}}`, value.toString());
    });
    return message;
  };

  // Helper function to translate error codes to localized messages
  const translateError = (errorMessage: string): string => {
    // Extract error code from error message
    const errorCode = errorMessage.split(':')[0];

    // Map error codes to translation keys
    const errorCodeMap: Record<string, string> = {
      EQUIPMENT_NAME_REQUIRED: 'equipment.excel_import_error_equipment_name_required',
      EQUIPMENT_CATEGORY_REQUIRED: 'equipment.excel_import_error_equipment_category_required',
      EQUIPMENT_CATEGORY_INVALID: 'equipment.excel_import_error_equipment_category_invalid',
      EQUIPMENT_MANUFACTURER_REQUIRED: 'equipment.excel_import_error_equipment_manufacturer_required',
      EQUIPMENT_PRICE_REQUIRED: 'equipment.excel_import_error_equipment_price_required',
      EQUIPMENT_PRICE_INVALID: 'equipment.excel_import_error_equipment_price_invalid',
      EQUIPMENT_PRICE_POSITIVE: 'equipment.excel_import_error_equipment_price_positive',
      EQUIPMENT_PURCHASE_DATE_REQUIRED: 'equipment.excel_import_error_equipment_purchase_date_required',
      EQUIPMENT_PURCHASE_DATE_FORMAT: 'equipment.excel_import_error_equipment_purchase_date_format',
      EQUIPMENT_PURCHASE_DATE_INVALID: 'equipment.excel_import_error_equipment_purchase_date_invalid',
      EQUIPMENT_WARRANTY_DATE_REQUIRED: 'equipment.excel_import_error_equipment_warranty_date_required',
      EQUIPMENT_WARRANTY_DATE_FORMAT: 'equipment.excel_import_error_equipment_warranty_date_format',
      EQUIPMENT_WARRANTY_DATE_INVALID: 'equipment.excel_import_error_equipment_warranty_date_invalid',
      EQUIPMENT_STATUS_REQUIRED: 'equipment.excel_import_error_equipment_status_required',
      EQUIPMENT_STATUS_INVALID: 'equipment.excel_import_error_equipment_status_invalid',
      EXCEL_VALIDATION_ERRORS: 'equipment.excel_import_validation_errors',
      QR_CODE_DATA_REQUIRED: 'equipment.qr_code_data_required',
      NO_FILE_UPLOADED: 'equipment.no_file_uploaded',
      EXCEL_FILE_REQUIRED: 'equipment.excel_file_required',
      BRANCH_ID_REQUIRED: 'equipment.branch_id_required',
      EXCEL_NO_DATA: 'equipment.excel_no_data',
      TEMPLATE_DOWNLOAD_ERROR: 'equipment.excel_template_download_error'
    };

    const translationKey = errorCodeMap[errorCode];
    if (translationKey) {
      const translatedMessage = t(translationKey);
      // If there's additional info after the colon, append it
      const additionalInfo = errorMessage.includes(':')
        ? errorMessage.substring(errorMessage.indexOf(':') + 1).trim()
        : '';

      if (additionalInfo) {
        // Handle special format for category/status invalid errors
        if (errorCode === 'EQUIPMENT_CATEGORY_INVALID' || errorCode === 'EQUIPMENT_STATUS_INVALID') {
          if (additionalInfo.includes('|')) {
            const [invalidValue, validValues] = additionalInfo.split('|');
            return `${translatedMessage} ${invalidValue}. ${t('common.valid_values')}: ${validValues}`;
          }
        }

        // Handle special format for price invalid errors
        if (errorCode === 'EQUIPMENT_PRICE_INVALID') {
          if (additionalInfo.includes('|')) {
            const [invalidValue, example1, example2] = additionalInfo.split('|');
            return `${translatedMessage} ${invalidValue}. ${t('equipment.price_must_be_positive')} (${t('common.example')}: ${example1} ${t('common.or')} ${example2})`;
          }
        }

        // Handle special format for date format errors
        if (errorCode === 'EQUIPMENT_PURCHASE_DATE_FORMAT' || errorCode === 'EQUIPMENT_WARRANTY_DATE_FORMAT') {
          if (additionalInfo.includes('|')) {
            const [invalidValue, format, example] = additionalInfo.split('|');
            return `${translatedMessage} ${invalidValue}. ${t('common.correct_format')}: ${format} (${t('common.example')}: ${example})`;
          }
        }

        return `${translatedMessage} ${additionalInfo}`;
      }
      return translatedMessage;
    }

    // Fallback to original message if no translation found
    return errorMessage;
  };

  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'result'>('upload');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];

      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
        toast.error(t('equipment.excel_import_invalid_file'));
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('equipment.excel_import_file_too_large'));
        return;
      }

      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    const response = await equipmentApi.downloadEquipmentTemplate();

    if (response) {
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'equipment_import_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t('equipment.excel_template_downloaded'));
    } else {
      toast.error(t('equipment.excel_template_download_error'));
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedBranchId) {
      toast.error(t('equipment.excel_import_file_branch_required'));
      return;
    }

    setLoading(true);

    try {
      const response = await equipmentApi.importEquipmentFromExcel(selectedFile, selectedBranchId);

      if (response.success && response.data) {
        setImportResult(response.data);
        setStep('result');

        if (response.data.successCount > 0) {
          toast.success(interpolate('equipment.excel_import_success', { count: response.data.successCount }));
          if (onImportSuccess) {
            onImportSuccess();
          }
        }

        if (response.data.errorCount > 0) {
          toast.error(interpolate('equipment.excel_import_error', { count: response.data.errorCount }));
        }
      } else {
        // Handle validation errors - check if response has error structure from backend
        const errorResponse = response as unknown as {
          error?: {
            meta?: {
              successCount?: number;
              errorCount?: number;
              totalCount?: number;
              errors?: Array<{
                row: number;
                equipmentName?: string;
                error?: string;
                errors?: string[];
              }>;
            };
          };
        };
        if (errorResponse.error && errorResponse.error.meta) {
          // Create ExcelImportResult from error response
          const errorResult: ExcelImportResult = {
            successCount: errorResponse.error.meta.successCount || 0,
            errorCount: errorResponse.error.meta.errorCount || 0,
            totalCount: errorResponse.error.meta.totalCount || 0,
            errors: errorResponse.error.meta.errors || [],
            importedEquipment: []
          };
          setImportResult(errorResult);
          setStep('result');

          if (errorResult.errorCount > 0) {
            toast.error(interpolate('equipment.excel_import_error', { count: errorResult.errorCount }));
          }
        } else {
          toast.error(translateError(response.message || '') || t('equipment.excel_import_failed'));
        }
      }
    } catch (error) {
      // Check if error has response data with validation errors
      const errorResponse = (
        error as unknown as {
          response?: {
            data?: {
              error?: {
                meta?: {
                  successCount?: number;
                  errorCount?: number;
                  totalCount?: number;
                  errors?: Array<{
                    row: number;
                    equipmentName?: string;
                    error?: string;
                    errors?: string[];
                  }>;
                };
              };
            };
          };
        }
      )?.response?.data;
      if (errorResponse && errorResponse.error && errorResponse.error.meta) {
        // Create ExcelImportResult from error response
        const errorResult: ExcelImportResult = {
          successCount: errorResponse.error.meta.successCount || 0,
          errorCount: errorResponse.error.meta.errorCount || 0,
          totalCount: errorResponse.error.meta.totalCount || 0,
          errors: errorResponse.error.meta.errors || [],
          importedEquipment: []
        };
        setImportResult(errorResult);
        setStep('result');

        if (errorResult.errorCount > 0) {
          toast.error(interpolate('equipment.excel_import_error', { count: errorResult.errorCount }));
        }
      } else {
        toast.error(t('equipment.excel_import_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSelectedBranchId('');
    setImportResult(null);
    setStep('upload');
    onClose();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedBranchId('');
    setImportResult(null);
    setStep('upload');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{t('equipment.excel_import_title')}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">{t('equipment.excel_template_download')}</h3>
                    <p className="text-sm text-blue-700">{t('equipment.excel_import_description')}</p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('equipment.excel_template_download')}
                  </button>
                </div>
              </div>

              {/* Branch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('equipment.excel_select_branch')} *
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white appearance-none"
                  style={{ border: '1px solid #d1d5db' }}
                >
                  <option value="">-- {t('equipment.excel_select_branch')} --</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.branchName} - {branch.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('equipment.excel_select_file')} *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center space-y-2">
                    <FileSpreadsheet className="w-12 h-12 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedFile ? selectedFile.name : t('equipment.excel_click_to_select')}
                      </p>
                      <p className="text-xs text-gray-500">{t('equipment.excel_file_support')}</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">{t('equipment.excel_import_instructions_title')}</h4>
                    <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                      <li>• {t('equipment.excel_import_instruction_1')}</li>
                      <li>• {t('equipment.excel_import_instruction_2')}</li>
                      <li>• {t('equipment.excel_import_instruction_3')}</li>
                      <li>• {t('equipment.excel_import_instruction_4')}</li>
                      <li>• {t('equipment.excel_import_instruction_5')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="space-y-6">
              {importResult ? (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-900">{importResult.successCount || 0}</div>
                      <div className="text-sm text-green-700">{t('equipment.excel_import_success_count')}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-900">{importResult.errorCount || 0}</div>
                      <div className="text-sm text-red-700">{t('equipment.excel_import_error_count')}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <FileSpreadsheet className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{importResult.totalCount || 0}</div>
                      <div className="text-sm text-gray-700">{t('equipment.excel_import_total_count')}</div>
                    </div>
                  </div>

                  {/* Warning message when there are errors */}
                  {(importResult.errorCount || 0) > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-900 font-medium">
                          {(importResult.successCount || 0) === 0
                            ? t('equipment.excel_import_no_equipment_imported')
                            : t('equipment.excel_import_some_equipment_imported')}
                        </span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">{t('equipment.excel_import_fix_errors_and_retry')}</p>

                      {/* Chi tiết lỗi */}
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-red-900 mb-2">
                            {t('equipment.excel_import_error_details')}
                          </h4>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {importResult.errors.slice(0, 10).map((error, index) => (
                              <div key={index} className="text-xs text-red-800 bg-red-100 p-2 rounded">
                                <div className="font-medium">
                                  {interpolate('equipment.excel_import_row', { row: error.row })}:{' '}
                                  {error.equipmentName || 'N/A'}
                                </div>
                                {error.errors && error.errors.length > 0 ? (
                                  <ul className="mt-1 ml-4 list-disc">
                                    {error.errors.map((err, errIndex) => (
                                      <li key={errIndex}>{translateError(err)}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="mt-1">{error.error ? translateError(error.error) : ''}</div>
                                )}
                              </div>
                            ))}
                            {importResult.errors.length > 10 && (
                              <div className="text-xs text-red-600 italic">
                                ... và {importResult.errors.length - 10} lỗi khác
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Success Message */}
                  {(importResult.successCount || 0) > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-900 font-medium">
                          {interpolate('equipment.excel_import_success', { count: importResult.successCount || 0 })}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">{t('equipment.excel_import_no_results')}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {step === 'upload' && t('equipment.excel_import_step_1')}
            {step === 'result' && t('equipment.excel_import_step_2')}
          </div>

          <div className="flex space-x-3">
            {step === 'result' && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {t('equipment.excel_import_again')}
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              {t('equipment.excel_import_close')}
            </button>
            {step === 'upload' && (
              <button
                onClick={handleImport}
                disabled={!selectedFile || !selectedBranchId || loading}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('equipment.excel_import_importing')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{t('equipment.excel_import_import')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
