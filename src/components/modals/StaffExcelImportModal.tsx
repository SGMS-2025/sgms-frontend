import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { X, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Key, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useStaffImport } from '@/hooks/useStaff';
import { useBranch } from '@/contexts/BranchContext';

interface StaffExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

interface ImportResult {
  successCount: number;
  failedCount: number;
  errors: Array<{
    row: number;
    error?: string;
    errorKey?: string;
    errorData?: Record<string, unknown>;
  }>;
  generatedPasswords: Array<{ email: string; username: string; password: string }>;
}

export const StaffExcelImportModal: React.FC<StaffExcelImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const { importStaffs, downloadTemplate, loading, error, resetError } = useStaffImport();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateTemplate = async () => {
    await downloadTemplate();
    if (!error) {
      toast.success(t('staff_import.template_downloaded'));
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

    // Import staffs using hook
    setUploadProgress(25);
    const result = await importStaffs(file, currentBranch._id);
    setUploadProgress(100);

    setImportResult(result);

    if (result.successCount > 0) {
      toast.success(t('staff_import.success_import', { count: result.successCount }));
      onImportSuccess();
    }

    // Reset file input to allow re-upload
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyPassword = (email: string, password: string) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
    toast.success(t('staff_import.password_copied'));
  };

  const copyAllPasswords = () => {
    if (!importResult?.generatedPasswords) return;

    const text = importResult.generatedPasswords
      .map((p) => `Email: ${p.email}\nUsername: ${p.username}\nPassword: ${p.password}\n`)
      .join('\n');

    navigator.clipboard.writeText(text);
    toast.success(t('staff_import.all_passwords_copied'));
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-orange-500 text-white rounded-t-lg -m-6 mb-0 p-6">
          <DialogTitle className="text-xl font-semibold flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            {t('staff_import.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">{t('staff_import.download_template')}</h3>
                <p className="text-xs text-blue-600">{t('staff_import.template_description')}</p>
              </div>
              <Button
                onClick={generateTemplate}
                variant="outline"
                size="sm"
                className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('staff_import.download_template')}
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">{t('staff_import.select_file')}</h3>
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
                    {t('staff_import.upload_again')}
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
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      {t('staff_import.click_to_select')}
                    </span>{' '}
                    {t('staff_import.drag_drop')}
                  </div>
                  <div className="text-xs text-gray-500">{t('staff_import.supported_formats')}</div>
                </label>
              </div>
            </div>

            {/* Upload Progress */}
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('staff_import.processing')}</span>
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
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{t('staff_import.import_results')}</h4>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">
                        {t('staff_import.success')}:{' '}
                        <span className="font-medium text-green-600">{importResult.successCount}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-gray-600">
                        {t('staff_import.failed')}:{' '}
                        <span className="font-medium text-red-600">{importResult.failedCount}</span>
                      </span>
                    </div>
                  </div>

                  {/* Generated Passwords Display */}
                  {importResult.generatedPasswords.length > 0 && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Key className="w-5 h-5 text-yellow-600" />
                          <h5 className="text-sm font-medium text-yellow-800">
                            {t('staff_import.generated_passwords')}
                          </h5>
                        </div>
                        <Button
                          onClick={copyAllPasswords}
                          variant="outline"
                          size="sm"
                          className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          {t('staff_import.copy_all')}
                        </Button>
                      </div>
                      <p className="text-xs text-yellow-700 mb-3">{t('staff_import.password_warning')}</p>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {importResult.generatedPasswords.map((pwd, index) => (
                          <div
                            key={index}
                            className="bg-white border border-yellow-200 rounded p-3 flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="text-xs text-gray-600 mb-1">
                                <span className="font-medium">{t('staff_import.label_email')}:</span> {pwd.email}
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                <span className="font-medium">{t('staff_import.label_username')}:</span> {pwd.username}
                              </div>
                              <div className="text-xs">
                                <span className="font-medium text-gray-600">{t('staff_import.label_password')}:</span>{' '}
                                <code className="bg-gray-100 px-2 py-1 rounded text-orange-600 font-mono">
                                  {pwd.password}
                                </code>
                              </div>
                            </div>
                            <Button
                              onClick={() => copyPassword(pwd.email, pwd.password)}
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error Details */}
                  {importResult.errors.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h5 className="text-sm font-medium text-gray-700">{t('staff_import.error_details')}</h5>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResult.errors.map((error, index) => {
                          const errorMessage = error.errorKey
                            ? String(t(error.errorKey, (error.errorData || {}) as Record<string, unknown>))
                            : error.error || 'Unknown error';

                          return (
                            <div key={index} className="flex items-start space-x-2 text-xs text-red-600">
                              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>
                                {t('staff_import.row')} {error.row}: {errorMessage}
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
            <h4 className="text-sm font-medium text-yellow-800 mb-2">{t('staff_import.instructions_title')}</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>{t('staff_import.instruction_1')}</li>
              <li>{t('staff_import.instruction_2')}</li>
              <li>{t('staff_import.instruction_3')}</li>
              <li>{t('staff_import.instruction_4')}</li>
              <li>{t('staff_import.instruction_5')}</li>
              <li>{t('staff_import.instruction_6')}</li>
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
            {t('staff_import.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
