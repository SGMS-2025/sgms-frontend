import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { X, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useBranch } from '@/contexts/BranchContext';
import type { BaseImportResult, ExcelImportModalBaseProps } from '@/types/components/ExcelImport';

export function ExcelImportModalBase<T extends BaseImportResult>({
  isOpen,
  onClose,
  onImportSuccess,
  translationNamespace,
  importFunction,
  downloadTemplateFunction,
  loading,
  error,
  resetError,
  renderCustomResultContent,
  maxWidth = 'max-w-4xl',
  instructionsCount = 4
}: ExcelImportModalBaseProps<T>) {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<T | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tKey = (key: string) => t(`${translationNamespace}.${key}`);

  const generateTemplate = async () => {
    await downloadTemplateFunction();
    if (!error) {
      toast.success(tKey('template_downloaded') || tKey('success_message'));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return;
    }

    // Validate branch ID
    if (!currentBranch?._id) {
      return;
    }

    setUploadProgress(0);
    setImportResult(null);
    resetError();

    try {
      setUploadProgress(25);
      const result = await importFunction(file, currentBranch._id);
      setUploadProgress(100);

      setImportResult(result);

      if (result.successCount > 0) {
        toast.success(
          tKey('success_import') ? t(tKey('success_import'), { count: result.successCount }) : tKey('success_import')
        );
        onImportSuccess();
      }
    } catch {
      setUploadProgress(0);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetModal = () => {
    setUploadProgress(0);
    setImportResult(null);
    resetError();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${maxWidth} max-h-[90vh] overflow-y-auto hide-scrollbar`}>
        <DialogHeader className="bg-orange-500 text-white rounded-t-lg -m-6 mb-0 p-6">
          <DialogTitle className="text-xl font-semibold flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            {tKey('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">{tKey('download_template')}</h3>
                <p className="text-xs text-blue-600">{tKey('template_description')}</p>
              </div>
              <Button
                onClick={generateTemplate}
                variant="outline"
                size="sm"
                className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
              >
                <Download className="w-4 h-4 mr-2" />
                {tKey('download_template')}
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">{tKey('select_file')}</h3>
                {importResult && (
                  <Button
                    onClick={() => {
                      setImportResult(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {tKey('upload_again')}
                  </Button>
                )}
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                  disabled={loading}
                />
                <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">{tKey('click_to_select')}</span>{' '}
                    {tKey('drag_drop')}
                  </div>
                  <div className="text-xs text-gray-500">{tKey('supported_formats')}</div>
                </label>
              </div>
            </div>

            {/* Upload Progress */}
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{tKey('processing')}</span>
                  <span className="text-gray-500">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              </div>
            )}

            {/* Import Results */}
            {importResult && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{tKey('import_results')}</h4>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">
                        {tKey('success')}:{' '}
                        <span className="font-medium text-green-600">{importResult.successCount}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-gray-600">
                        {tKey('failed')}: <span className="font-medium text-red-600">{importResult.failedCount}</span>
                      </span>
                    </div>
                  </div>

                  {/* Custom Result Content (e.g., passwords) */}
                  {renderCustomResultContent && renderCustomResultContent(importResult)}

                  {/* Error Details */}
                  {importResult.errors.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h5 className="text-sm font-medium text-gray-700">{tKey('error_details')}</h5>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResult.errors.map((errorItem, index) => {
                          let errorMessage = 'Unknown error';

                          if (errorItem.errorKey) {
                            const translationKey = errorItem.errorKey.includes('.')
                              ? errorItem.errorKey
                              : `${translationNamespace}.${errorItem.errorKey}`;

                            if (errorItem.errorData) {
                              const translated = t(translationKey, errorItem.errorData as Record<string, unknown>);

                              // If translation returns the key itself, it means translation not found
                              if (translated === translationKey) {
                                errorMessage = errorItem.errorKey; // Fallback to raw key
                              } else {
                                errorMessage = translated;
                              }
                            } else {
                              const translated = t(translationKey);

                              // If translation returns the key itself, it means translation not found
                              if (translated === translationKey) {
                                errorMessage = errorItem.errorKey; // Fallback to raw key
                              } else {
                                errorMessage = translated;
                              }
                            }
                          } else if (errorItem.error || errorItem.message) {
                            errorMessage = errorItem.error || errorItem.message || 'Unknown error';
                          }

                          return (
                            <div key={index} className="flex items-start space-x-2 text-xs text-red-600">
                              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>
                                {tKey('row')} {errorItem.row}: {errorMessage}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">{tKey('instructions_title')}</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              {Array.from({ length: instructionsCount }, (_, i) => (
                <li key={i}>{tKey(`instruction_${i + 1}`)}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-lg -m-6 mt-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="bg-gray-500 text-white hover:bg-gray-600 border-gray-500"
          >
            <X className="w-4 h-4 mr-2" />
            {tKey('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
