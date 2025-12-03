import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';
import type { UploadDocumentRequest } from '@/types/api/ContractDocument';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: () => void;
  branchId?: string;
}

export default function DocumentUploadDialog({
  open,
  onOpenChange,
  onUploaded,
  branchId: initialBranchId
}: DocumentUploadDialogProps) {
  const { t } = useTranslation();
  const { currentBranch, branches } = useBranch();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [templateContractType] = useState<'membership' | 'service_pt' | 'service_class' | 'custom'>('service_pt');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Initialize selected branch when dialog opens
  useEffect(() => {
    if (open) {
      // Use initialBranchId if provided, otherwise use current branch
      setSelectedBranchId(initialBranchId || currentBranch?._id || '');
    }
  }, [open, initialBranchId, currentBranch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/png'
      ];
      const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png)$/i;

      if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.test(selectedFile.name)) {
        toast.error('Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG');
        return;
      }

      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);

    const data: UploadDocumentRequest = {
      document: file,
      title: title || file.name,
      ...(selectedBranchId && selectedBranchId !== 'global' ? { branchId: selectedBranchId } : {}),
      isTemplate: true,
      templateContractType: templateContractType
    };

    const response = await contractDocumentApi.uploadDocument(data);

    if (response.success) {
      toast.success('Document uploaded successfully');
      handleClose();
      onUploaded?.();
    } else {
      toast.error(response.message || 'Failed to upload document');
    }

    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      setFile(null);
      setTitle('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('contracts.upload_document', 'Upload Document')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="document">
              {t('contracts.document_file', 'Document')} <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="document"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png"
                onChange={handleFileChange}
                disabled={loading}
                className="flex-1"
              />
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={loading}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {file && (
              <p className="text-sm text-gray-600">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {t('contracts.document_title', 'Title')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('contracts.document_title_placeholder', 'Enter document title')}
              disabled={loading}
              required
            />
          </div>

          {/* Branch Selector */}
          <div className="space-y-2">
            <Label htmlFor="branch">
              {t('contracts.branch', 'Branch')} <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId} disabled={loading}>
              <SelectTrigger id="branch">
                <SelectValue placeholder={t('contracts.select_branch', 'Select branch')} />
              </SelectTrigger>
              <SelectContent>
                {/* Global Template Option */}
                <SelectItem value="global">
                  {t('contracts.global_template', 'Global Template (All Branches)')}
                </SelectItem>
                {/* User's Branches */}
                {branches.map((branch) => (
                  <SelectItem key={branch._id} value={branch._id}>
                    {branch.branchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              {t(
                'contracts.branch_hint',
                'Select which branch this template is for, or choose Global for all branches'
              )}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.uploading', 'Uploading...')}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('common.upload', 'Upload')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
