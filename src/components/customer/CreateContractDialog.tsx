import { useState, useEffect } from 'react';
import { Loader2, FileText, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { contractDocumentApi } from '@/services/api/contractDocumentApi';
import { toast } from 'sonner';
import type { ContractDocument } from '@/types/api/ContractDocument';
import { Card, CardContent } from '@/components/ui/card';

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onSuccess?: () => void;
  contractType?: 'membership' | 'service_class' | 'service_pt' | 'custom';
  contractId?: string;
}

export default function CreateContractDialog({
  open,
  onOpenChange,
  customerId,
  onSuccess,
  contractType,
  contractId
}: CreateContractDialogProps) {
  const [templates, setTemplates] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Use dedicated templates API endpoint
      const response = await contractDocumentApi.getTemplates();

      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        toast.error('Không thể tải danh sách mẫu hợp đồng');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Không thể tải danh sách mẫu hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedTemplateId) {
      toast.error('Vui lòng chọn mẫu hợp đồng');
      return;
    }

    setCreating(true);
    try {
      const response = await contractDocumentApi.createContractFromTemplate(customerId, {
        templateDocumentId: selectedTemplateId,
        contractType: contractType || 'custom',
        contractId: contractId
      });

      if (response.success) {
        toast.success('Đã tạo hợp đồng thành công');
        onSuccess?.();
        onOpenChange(false);
        setSelectedTemplateId('');
      } else {
        toast.error(response.message || 'Không thể tạo hợp đồng');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      const errorMessage =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        'Không thể tạo hợp đồng';
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const selectedTemplate = templates.find((t) => t._id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo hợp đồng từ mẫu</DialogTitle>
          <DialogDescription>Chọn một mẫu hợp đồng có sẵn để tạo hợp đồng riêng cho khách hàng này</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Chọn mẫu hợp đồng</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Chọn mẫu hợp đồng..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Không có mẫu hợp đồng nào
                    </SelectItem>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template._id} value={template._id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{template.title}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedTemplate && (
            <Card className="rounded-lg border">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">{selectedTemplate.title}</h4>
                  </div>
                  {selectedTemplate.description && (
                    <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    <div>File: {selectedTemplate.fileName}</div>
                    <div>Kích thước: {(selectedTemplate.fileSize / 1024).toFixed(2)} KB</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
              Hủy
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedTemplateId || creating}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Tạo hợp đồng
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
