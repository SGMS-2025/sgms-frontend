import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

interface AddInitialDataDialogProps {
  readonly onAddFeature: (v: { name: string }) => void;
  readonly onAddService: (v: {
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

export function AddInitialDataDialog({
  onAddFeature,
  onAddService,
  loading,
  serviceType,
  defaultMinParticipants = 5,
  defaultMaxParticipants = 20
}: AddInitialDataDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [featureName, setFeatureName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [duration, setDuration] = useState<string>('1');
  const [minParticipants, setMinParticipants] = useState<string>(defaultMinParticipants.toString());
  const [maxParticipants, setMaxParticipants] = useState<string>(defaultMaxParticipants.toString());

  const handleCreate = () => {
    // Validate that both feature and service are provided
    if (!featureName.trim() || !serviceName.trim()) {
      return;
    }

    // Validate service required fields
    if (!price.trim() || !duration.trim() || !minParticipants.trim() || !maxParticipants.trim()) {
      return;
    }

    // Add feature
    onAddFeature({ name: featureName.trim() });

    // Add service
    onAddService({
      name: serviceName.trim(),
      price: Number(price),
      durationInMonths: Number(duration),
      minParticipants: Number(minParticipants),
      maxParticipants: Number(maxParticipants)
    });

    setOpen(false);
    setFeatureName('');
    setServiceName('');
    setPrice('');
    setDuration('1');
    setMinParticipants(defaultMinParticipants.toString());
    setMaxParticipants(defaultMaxParticipants.toString());
  };

  const translationKey = serviceType === 'CLASS' ? 'class_service' : 'pt_service';
  const serviceTypeLower = serviceType.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="px-8 py-4 text-lg font-semibold text-white border border-orange-500 rounded-full bg-orange-500 hover:bg-orange-600 hover:border-orange-600 transition-colors flex items-center leading-none shadow-lg"
          disabled={loading}
        >
          <Plus className="h-5 w-5 mr-2" />
          {t(`${translationKey}.add_initial_data`)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(`${translationKey}.add_initial_data_title`)}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Feature Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <h3 className="text-sm font-medium text-gray-900">{t(`${translationKey}.add_feature_section`)}</h3>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="featureName">
                {t(`${translationKey}.feature_name`)} <span className="text-red-500">*</span>
              </Label>
              <Input
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
                placeholder={t(`${translationKey}.feature_name_placeholder`)}
                disabled={loading}
                className={featureName.trim() !== '' ? '' : 'border-red-300 focus:border-red-500'}
              />
            </div>
          </div>

          {/* Service Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-medium text-gray-900">
                {t(`${translationKey}.add_${serviceTypeLower}_section`)}
              </h3>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="serviceName">
                  {t(`${translationKey}.${serviceTypeLower}_name`)} <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder={t(`${translationKey}.${serviceTypeLower}_name_placeholder`)}
                  disabled={loading}
                  className={serviceName.trim() !== '' ? '' : 'border-red-300 focus:border-red-500'}
                />
              </div>
              <div className="grid gap-2 grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="price">
                    {t(`${translationKey}.price`)} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={t(`${translationKey}.price_placeholder`)}
                    disabled={loading}
                    className={price.trim() !== '' ? '' : 'border-red-300 focus:border-red-500'}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">
                    {t(`${translationKey}.duration`)} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder={t(`${translationKey}.duration_placeholder`)}
                    disabled={loading}
                    className={duration.trim() !== '' ? '' : 'border-red-300 focus:border-red-500'}
                  />
                </div>
              </div>
              <div className="grid gap-2 grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="minParticipants">
                    {t(`${translationKey}.min_participants`)} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={minParticipants}
                    onChange={(e) => setMinParticipants(e.target.value)}
                    placeholder={t(`${translationKey}.min_participants_placeholder`)}
                    disabled={loading}
                    className={minParticipants.trim() !== '' ? '' : 'border-red-300 focus:border-red-500'}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxParticipants">
                    {t(`${translationKey}.max_participants`)} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    placeholder={t(`${translationKey}.max_participants_placeholder`)}
                    disabled={loading}
                    className={maxParticipants.trim() !== '' ? '' : 'border-red-300 focus:border-red-500'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {t(`${translationKey}.cancel`)}
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={
              loading ||
              !featureName.trim() ||
              !serviceName.trim() ||
              !price.trim() ||
              !duration.trim() ||
              !minParticipants.trim() ||
              !maxParticipants.trim()
            }
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t(`${translationKey}.create_initial_data`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
