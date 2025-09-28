import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

interface AddServiceDialogProps {
  readonly onSubmit: (v: {
    name: string;
    price?: number;
    durationInMonths?: number;
    minParticipants?: number;
    maxParticipants?: number;
  }) => void;
  readonly loading: boolean;
  readonly serviceType: 'CLASS' | 'PT';
  readonly defaultMinParticipants?: number;
  readonly defaultMaxParticipants?: number;
}

export function AddServiceDialog({
  onSubmit,
  loading,
  serviceType,
  defaultMinParticipants = 5,
  defaultMaxParticipants = 20
}: AddServiceDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [duration, setDuration] = useState<string>('1');
  const [minParticipants, setMinParticipants] = useState<string>(defaultMinParticipants.toString());
  const [maxParticipants, setMaxParticipants] = useState<string>(defaultMaxParticipants.toString());

  const handleCreate = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      price: price ? Number(price) : undefined,
      durationInMonths: duration ? Number(duration) : undefined,
      minParticipants: minParticipants ? Number(minParticipants) : defaultMinParticipants,
      maxParticipants: maxParticipants ? Number(maxParticipants) : defaultMaxParticipants
    });
    setOpen(false);
    setName('');
    setPrice('');
    setMinParticipants(defaultMinParticipants.toString());
    setMaxParticipants(defaultMaxParticipants.toString());
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
          {t(`${translationKey}.add_${serviceType.toLowerCase()}`)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`${translationKey}.add_${serviceType.toLowerCase()}_dialog_title`)}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">{t(`${translationKey}.${serviceType.toLowerCase()}_name`)}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(`${translationKey}.${serviceType.toLowerCase()}_name_placeholder`)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2 grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="price">{t(`${translationKey}.price`)}</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t(`${translationKey}.price_placeholder`)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">{t(`${translationKey}.duration`)}</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={t(`${translationKey}.duration_placeholder`)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid gap-2 grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="minParticipants">{t(`${translationKey}.min_participants`)}</Label>
              <Input
                type="number"
                value={minParticipants}
                onChange={(e) => setMinParticipants(e.target.value)}
                placeholder={t(`${translationKey}.min_participants_placeholder`)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxParticipants">{t(`${translationKey}.max_participants`)}</Label>
              <Input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder={t(`${translationKey}.max_participants_placeholder`)}
                disabled={loading}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {t(`${translationKey}.cancel`)}
          </Button>
          <Button onClick={handleCreate} className="bg-black hover:bg-gray-800 text-white" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t(`${translationKey}.create_${serviceType.toLowerCase()}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
