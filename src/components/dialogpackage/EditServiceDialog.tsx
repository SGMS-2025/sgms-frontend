import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { LegacyService } from '@/types/api/Package';

interface EditServiceDialogProps {
  readonly service: LegacyService | null;
  readonly onSubmit: (
    id: string,
    v: {
      name: string;
      price?: number;
      durationInMonths?: number;
      minParticipants?: number;
      maxParticipants?: number;
    }
  ) => void;
  readonly loading: boolean;
  readonly serviceType: 'CLASS' | 'PT';
  readonly defaultMinParticipants?: number;
  readonly defaultMaxParticipants?: number;
}

export function EditServiceDialog({
  service,
  onSubmit,
  loading,
  serviceType,
  defaultMinParticipants = 5,
  defaultMaxParticipants = 20
}: EditServiceDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [duration, setDuration] = useState<string>('1');
  const [minParticipants, setMinParticipants] = useState<string>(defaultMinParticipants.toString());
  const [maxParticipants, setMaxParticipants] = useState<string>(defaultMaxParticipants.toString());

  React.useEffect(() => {
    if (service) {
      setName(service.name);
      setPrice(service.price ? service.price.toString() : '');
      setDuration(service.durationInMonths ? service.durationInMonths.toString() : '1');
      // Note: LegacyService doesn't have min/max participants, so we use defaults
      setMinParticipants(defaultMinParticipants.toString());
      setMaxParticipants(defaultMaxParticipants.toString());
      setOpen(true);
    }
  }, [service, defaultMinParticipants, defaultMaxParticipants]);

  const handleUpdate = () => {
    if (!name.trim() || !service) return;
    onSubmit(service.id, {
      name: name.trim(),
      price: price ? Number(price) : undefined,
      durationInMonths: duration ? Number(duration) : undefined,
      minParticipants: minParticipants ? Number(minParticipants) : defaultMinParticipants,
      maxParticipants: maxParticipants ? Number(maxParticipants) : defaultMaxParticipants
    });
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    setName('');
    setPrice('');
    setDuration('1');
    setMinParticipants(defaultMinParticipants.toString());
    setMaxParticipants(defaultMaxParticipants.toString());
  };

  const translationKey = serviceType === 'CLASS' ? 'class_service' : 'pt_service';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`${translationKey}.edit_${serviceType.toLowerCase()}_dialog_title`)}</DialogTitle>
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
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t(`${translationKey}.cancel`)}
          </Button>
          <Button onClick={handleUpdate} className="bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t(`${translationKey}.update_${serviceType.toLowerCase()}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
