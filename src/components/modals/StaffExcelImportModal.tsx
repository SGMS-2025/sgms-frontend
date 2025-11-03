import React from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Key, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExcelImportModalBase } from './ExcelImportModalBase';
import { useStaffImport } from '@/hooks/useStaff';
import type { StaffExcelImportModalProps, StaffImportResult } from '@/types/api/Staff';

export const StaffExcelImportModal: React.FC<StaffExcelImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const { t } = useTranslation();
  const { importStaffs, downloadTemplate, loading, error, resetError } = useStaffImport();

  const copyPassword = (email: string, password: string) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
    toast.success(t('staff_import.password_copied'));
  };

  const copyAllPasswords = (passwords: StaffImportResult['generatedPasswords']) => {
    const text = passwords
      .map((p) => `Email: ${p.email}\nUsername: ${p.username}\nPassword: ${p.password}\n`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success(t('staff_import.all_passwords_copied'));
  };

  const renderPasswordContent = (result: StaffImportResult) => {
    if (!result.generatedPasswords || result.generatedPasswords.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-yellow-600" />
            <h5 className="text-sm font-medium text-yellow-800">{t('staff_import.generated_passwords')}</h5>
          </div>
          <Button
            onClick={() => copyAllPasswords(result.generatedPasswords)}
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
          {result.generatedPasswords.map((pwd, index) => (
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
                  <code className="bg-gray-100 px-2 py-1 rounded text-orange-600 font-mono">{pwd.password}</code>
                </div>
              </div>
              <Button onClick={() => copyPassword(pwd.email, pwd.password)} variant="ghost" size="sm" className="ml-2">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ExcelImportModalBase<StaffImportResult>
      isOpen={isOpen}
      onClose={onClose}
      onImportSuccess={onImportSuccess}
      translationNamespace="staff_import"
      importFunction={importStaffs}
      downloadTemplateFunction={downloadTemplate}
      loading={loading}
      error={error}
      resetError={resetError}
      renderCustomResultContent={renderPasswordContent}
      maxWidth="max-w-5xl"
      instructionsCount={6}
    />
  );
};
