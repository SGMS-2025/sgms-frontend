import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import type {
  SubscriptionPackage,
  CreateSubscriptionPackageRequest,
  UpdateSubscriptionPackageRequest
} from '@/types/api/Subscription';
import PackageFormDialog from '@/components/admin/subscriptions/PackageFormDialog';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';

const AdminSubscriptionPackagesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [packages, setPackages] = React.useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');
  const [showDialog, setShowDialog] = React.useState<boolean>(false);
  const [editing, setEditing] = React.useState<SubscriptionPackage | null>(null);
  const [packageToDelete, setPackageToDelete] = React.useState<SubscriptionPackage | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState<boolean>(false);

  const fetchPackages = () => {
    setLoading(true);
    setError('');

    subscriptionApi
      .getActivePackages()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setPackages(res.data);
        } else {
          setError(res.message || t('admin.subscription_packages.error.load_failed'));
        }
      })
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreate = (
    data: {
      name: string;
      description?: string;
      price: number;
      duration: number;
      durationUnit: 'DAY' | 'MONTH' | 'YEAR';
      maxBranches: number;
      maxCustomers: number;
      tier: number;
      features?: string[];
      isActive?: boolean;
    },
    setFormError?: (field: string, message: string) => void
  ) => {
    // Send in Mongoose model format (flat structure) - not Joi validation format
    const payload = {
      name: data.name,
      tier: data.tier,
      price: data.price,
      duration: data.duration, // Number
      durationUnit: data.durationUnit, // String
      maxBranches: data.maxBranches, // Number
      maxCustomers: data.maxCustomers, // Number
      features: data.features || [], // Array of strings
      description: data.description,
      isActive: data.isActive ?? true
    };

    return subscriptionApi.createPackage(payload).then((res) => {
      if (res.success && res.data) {
        setPackages((prev) => [res.data, ...prev]);
        toast.success(t('admin.subscription_packages.toast.create_success'));
        return true;
      } else {
        // Check for field-specific errors
        const errorRes = res as typeof res & {
          error?: { meta?: { details?: Array<{ field: string; message: string }> } };
        };
        let hasFieldError = false;
        if (errorRes.error?.meta?.details && Array.isArray(errorRes.error.meta.details)) {
          errorRes.error.meta.details.forEach((detail: { field: string; message: string }) => {
            if (setFormError) {
              if (detail.field === 'tier') {
                setFormError('tier', t('admin.subscription_packages.validation.tier_exists'));
                hasFieldError = true;
              } else if (detail.field === 'name') {
                setFormError('name', t('admin.subscription_packages.validation.name_exists'));
                hasFieldError = true;
              }
            }
          });
        }
        if (!hasFieldError) {
          toast.error(t('admin.subscription_packages.toast.create_error'));
        }
        return false;
      }
    });
  };

  const handleUpdate = (
    data: {
      name?: string;
      description?: string;
      price?: number;
      duration?: number;
      durationUnit?: 'DAY' | 'MONTH' | 'YEAR';
      maxBranches?: number;
      maxCustomers?: number;
      tier?: number;
      isActive?: boolean;
      features?: string[];
    },
    setFormError?: (field: string, message: string) => void
  ) => {
    if (!editing) return Promise.resolve();
    // Send in Mongoose model format (flat structure) - not Joi validation format
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.price !== undefined) payload.price = data.price;
    if (data.duration !== undefined) payload.duration = data.duration;
    if (data.durationUnit !== undefined) payload.durationUnit = data.durationUnit;
    if (data.maxBranches !== undefined) payload.maxBranches = data.maxBranches;
    if (data.maxCustomers !== undefined) payload.maxCustomers = data.maxCustomers;
    if (data.features !== undefined) payload.features = data.features;
    if (data.description !== undefined) payload.description = data.description;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    // Always include tier if it's provided, ensure it's a number
    if (data.tier !== undefined && data.tier !== null) {
      payload.tier = typeof data.tier === 'number' ? data.tier : Number(data.tier);
    }

    return subscriptionApi.updatePackage(editing._id, payload).then((res) => {
      if (res.success && res.data) {
        setPackages((prev) => prev.map((p) => (p._id === editing._id ? res.data : p)));
        toast.success(t('admin.subscription_packages.toast.update_success'));
        return true;
      } else {
        // Check for field-specific errors
        const errorRes = res as typeof res & {
          error?: { meta?: { details?: Array<{ field: string; message: string }> } };
        };
        let hasFieldError = false;
        if (errorRes.error?.meta?.details && Array.isArray(errorRes.error.meta.details)) {
          errorRes.error.meta.details.forEach((detail: { field: string; message: string }) => {
            if (setFormError) {
              if (detail.field === 'tier') {
                setFormError('tier', t('admin.subscription_packages.validation.tier_exists'));
                hasFieldError = true;
              } else if (detail.field === 'name') {
                setFormError('name', t('admin.subscription_packages.validation.name_exists'));
                hasFieldError = true;
              }
            }
          });
        }
        if (!hasFieldError) {
          toast.error(t('admin.subscription_packages.toast.update_error'));
        }
        return false;
      }
    });
  };

  const handleDeleteClick = (pkg: SubscriptionPackage) => {
    setPackageToDelete(pkg);
  };

  const handleConfirmDelete = () => {
    if (!packageToDelete) return;

    setDeleteLoading(true);
    subscriptionApi
      .deletePackage(packageToDelete._id)
      .then((res) => {
        if (res.success) {
          setPackages((prev) => prev.filter((p) => p._id !== packageToDelete._id));
          toast.success(t('admin.subscription_packages.toast.delete_success'));
          setPackageToDelete(null);
        } else {
          toast.error(t('admin.subscription_packages.toast.delete_error'));
        }
      })
      .finally(() => {
        setDeleteLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('admin.subscription_packages.title')}</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setEditing(null);
                setShowDialog(true);
              }}
            >
              {t('admin.subscription_packages.button.create')}
            </Button>
            <Button variant="outline" onClick={fetchPackages}>
              {t('admin.subscription_packages.button.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}
          {loading ? (
            <div className="text-sm text-gray-600">{t('admin.subscription_packages.loading')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.subscription_packages.table.header.name')}</TableHead>
                  <TableHead>{t('admin.subscription_packages.table.header.tier')}</TableHead>
                  <TableHead>{t('admin.subscription_packages.table.header.price')}</TableHead>
                  <TableHead>{t('admin.subscription_packages.table.header.duration')}</TableHead>
                  <TableHead>{t('admin.subscription_packages.table.header.limits')}</TableHead>
                  <TableHead>{t('admin.subscription_packages.table.header.status')}</TableHead>
                  <TableHead className="text-right">{t('admin.subscription_packages.table.header.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg._id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{pkg.tier}</TableCell>
                    <TableCell>{pkg.price.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</TableCell>
                    <TableCell>
                      {pkg.duration}{' '}
                      {pkg.durationUnit === 'DAY'
                        ? t('admin.subscription_packages.table.duration.day')
                        : pkg.durationUnit === 'MONTH'
                          ? t('admin.subscription_packages.table.duration.month')
                          : t('admin.subscription_packages.table.duration.year')}
                    </TableCell>
                    <TableCell>
                      {t('admin.subscription_packages.table.limits', {
                        branches: pkg.maxBranches,
                        customers: pkg.maxCustomers
                      })}
                    </TableCell>
                    <TableCell>
                      {pkg.isActive ? (
                        <Badge>{t('admin.subscription_packages.table.status.active')}</Badge>
                      ) : (
                        <Badge variant="secondary">{t('admin.subscription_packages.table.status.inactive')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(pkg);
                          setShowDialog(true);
                        }}
                      >
                        {t('admin.subscription_packages.button.edit')}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(pkg)}>
                        {t('admin.subscription_packages.button.delete')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PackageFormDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setEditing(null);
        }}
        initialValue={editing}
        onSubmit={(payload, setFormError) => {
          const promise = editing
            ? handleUpdate(payload as UpdateSubscriptionPackageRequest, setFormError)
            : handleCreate(payload as CreateSubscriptionPackageRequest, setFormError);
          return promise.then((success) => {
            if (success) {
              setShowDialog(false);
              setEditing(null);
            }
            // Keep dialog open on error so user can fix and retry
          });
        }}
      />

      <DeleteConfirmationModal
        isOpen={!!packageToDelete}
        onClose={() => setPackageToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLoading}
        title={t('admin.subscription_packages.delete_modal.title')}
        description={t('admin.subscription_packages.delete_modal.description', { name: packageToDelete?.name || '' })}
      />
    </div>
  );
};

export default AdminSubscriptionPackagesPage;
