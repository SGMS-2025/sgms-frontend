import React from 'react';
import { ExcelImportModalBase } from './ExcelImportModalBase';
import { useCustomerImport } from '@/hooks/useCustomer';
import type { CustomerExcelImportModalProps, ImportResult } from '@/types/api/Customer';

export const CustomerExcelImportModal: React.FC<CustomerExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const { importCustomers, downloadTemplate, loading, error, resetError } = useCustomerImport();

  return (
    <ExcelImportModalBase<ImportResult>
      isOpen={isOpen}
      onClose={onClose}
      onImportSuccess={onImportSuccess}
      translationNamespace="customer_excel_import"
      importFunction={importCustomers}
      downloadTemplateFunction={downloadTemplate}
      loading={loading}
      error={error}
      resetError={resetError}
      maxWidth="max-w-4xl"
      instructionsCount={4}
    />
  );
};
