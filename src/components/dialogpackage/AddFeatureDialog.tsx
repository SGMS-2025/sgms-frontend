import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

interface AddFeatureDialogProps {
  readonly onSubmit: (v: { name: string }) => void;
  readonly loading: boolean;
  readonly serviceType: 'CLASS' | 'PT';
}

export function AddFeatureDialog({ onSubmit, loading, serviceType }: AddFeatureDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim() });
    setOpen(false);
    setName('');
  };

  const translationKey = serviceType === 'CLASS' ? 'class_service' : 'pt_service';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="px-4 py-2 text-sm text-white border border-orange-500 rounded-full bg-orange-500 hover:bg-orange-600 hover:border-orange-600 transition-colors flex items-center leading-none"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t(`${translationKey}.add_feature`)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`${translationKey}.add_feature_dialog_title`)}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">{t(`${translationKey}.feature_name`)}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(`${translationKey}.feature_name_placeholder`)}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {t(`${translationKey}.cancel`)}
          </Button>
          <Button onClick={handleCreate} className="bg-black hover:bg-gray-800 text-white" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t(`${translationKey}.create_feature`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
