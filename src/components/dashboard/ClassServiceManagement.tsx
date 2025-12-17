import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Loader2, Building2, Eye, Save, Pencil, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBranch } from '@/contexts/BranchContext';
import { useMatrix } from '@/hooks/useMatrix';
import { useClassServicesTour } from '@/hooks/useClassServicesTour';
import type { LegacyService } from '@/types/api/Package';
import type { MatrixDisplayData } from '@/types/api/Matrix';
import { AddServiceDialog } from '@/components/dialogpackage/AddServiceDialog';
import { EditServiceDialog } from '@/components/dialogpackage/EditServiceDialog';
import { AddFeatureDialog } from '@/components/dialogpackage/AddFeatureDialog';
import { EditFeatureDialog } from '@/components/dialogpackage/EditFeatureDialog';
import { AddInitialDataDialog } from '@/components/dialogpackage/AddInitialDataDialog';
import { ConfirmDeleteServiceDialog } from '@/components/dialogpackage/ConfirmDeleteServiceDialog';
import { ConfirmDeleteFeatureDialog } from '@/components/dialogpackage/ConfirmDeleteFeatureDialog';
import { MatrixCell } from '@/components/dialogpackage/MatrixCell';
import { ErrorDisplay } from '@/components/dialogpackage/ErrorDisplay';
import { useUpdateService, useUpdateFeature } from '@/hooks/useServiceManagement';

// Define feature type from MatrixDisplayData
type MatrixFeature = MatrixDisplayData['features'][0];
export default function ClassServiceManagement() {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const { startClassServicesTour } = useClassServicesTour();
  const {
    services,
    features,
    cells,
    loading,
    error,
    addService,
    removeService,
    addFeature,
    removeFeature,
    updateCell,
    reloadMatrix,
    saveMatrix,
    clearError,
    testConnection
  } = useMatrix('CLASS');

  // Custom hooks for update operations
  const { updateService, loading: updateServiceLoading } = useUpdateService();
  const { updateFeature, loading: updateFeatureLoading } = useUpdateFeature();

  // Services are already filtered by useMatrix('CLASS')
  const classServices = services;

  const [preview, setPreview] = useState(true);
  const [serviceToDelete, setServiceToDelete] = useState<LegacyService | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<MatrixFeature | null>(null);
  const [serviceToEdit, setServiceToEdit] = useState<LegacyService | null>(null);
  const [featureToEdit, setFeatureToEdit] = useState<MatrixFeature | null>(null);

  const handleDeleteService = (service: LegacyService) => {
    setServiceToDelete(service);
  };

  const confirmDeleteService = async () => {
    if (serviceToDelete) {
      await removeService(serviceToDelete.id);
      setServiceToDelete(null);
    }
  };

  const handleDeleteFeature = (feature: MatrixFeature) => {
    setFeatureToDelete(feature);
  };

  const confirmDeleteFeature = async () => {
    if (featureToDelete) {
      await removeFeature(featureToDelete.id);
      setFeatureToDelete(null);
    }
  };

  const handleEditService = (service: LegacyService) => {
    setServiceToEdit(service);
  };

  const handleEditFeature = (feature: MatrixFeature) => {
    setFeatureToEdit(feature);
  };

  const handleUpdateService = async (
    id: string,
    data: {
      name: string;
      price?: number;
      durationInMonths?: number;
      sessionCount?: number;
      minParticipants?: number;
      maxParticipants?: number;
    }
  ) => {
    await updateService(id, { ...data, type: 'CLASS' });
    await reloadMatrix();
    setServiceToEdit(null);
  };

  const handleUpdateFeature = async (id: string, data: { name: string }) => {
    await updateFeature(id, data, 'CLASS');
    await reloadMatrix();
    setFeatureToEdit(null);
  };

  const handleRetry = () => {
    clearError();
    reloadMatrix();
  };

  if (!currentBranch) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="text-center py-8">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('class_service.no_branch_selected')}</h3>
          <p className="mt-2 text-sm text-gray-500">{t('class_service.no_branch_message')}</p>
        </div>
      </div>
    );
  }

  // Show loading when switching branches
  if (loading && classServices.length === 0 && features.length === 0) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="text-center py-8">
          <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('class_service.loading')}</h3>
          <p className="mt-2 text-sm text-gray-500">{t('class_service.loading_message')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
                  <Building2 className="h-3.5 w-3.5" />
                  {t('class_service.badge')}
                </span>
                <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900">{t('class_service.title')}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t('class_service.subtitle')} <span className="font-medium">{currentBranch.branchName}</span>
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-300 hover:bg-gray-50"
                    onClick={startClassServicesTour}
                    title={t('class_service.tour.button', 'Hướng dẫn')}
                  >
                    <HelpCircle className="w-4 h-4 text-gray-500 hover:text-orange-500" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="space-y-4">
              <ErrorDisplay error={error} onRetry={handleRetry} serviceType="CLASS" />
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-md">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">{t('class_service.offline_mode')}</span>
                </div>
                <p className="text-blue-700 text-sm mb-3">{t('class_service.offline_message')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const isConnected = await testConnection();
                    if (isConnected) {
                      clearError();
                      reloadMatrix();
                    } else {
                      alert(t('class_service.api_connection_error'));
                    }
                  }}
                >
                  {t('class_service.test_connection')}
                </Button>
              </div>
            </div>
          )}

          {loading && !error && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{t('class_service.loading')}</span>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Building2 className="w-4 h-4 text-orange-500 mr-2" />
                <span className="text-sm text-orange-500 font-semibold">{t('class_service.features_benefits')}</span>
              </div>
              <div className="flex items-center gap-2">
                {!preview && (
                  <Button
                    size="sm"
                    onClick={saveMatrix}
                    disabled={loading}
                    className="px-4 py-2 text-sm text-white border border-orange-500 rounded-full bg-orange-500 hover:bg-orange-600 hover:border-orange-600 transition-colors flex items-center leading-none"
                    data-tour="class-save-changes-button"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {t('class_service.save_changes')}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => setPreview((p) => !p)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full bg-white hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors flex items-center leading-none"
                  data-tour="class-preview-edit-toggle"
                >
                  {preview ? <Pencil className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {preview ? t('class_service.edit') : t('class_service.preview')}
                </Button>
              </div>
            </div>

            {classServices.length === 0 && features.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-6 min-h-[200px]">
                <div className="text-muted-foreground mb-4 text-center">
                  <Building2 className="mx-auto h-10 w-10 mb-2" />
                  <h3 className="text-lg font-medium mb-1">{t('class_service.no_data_title')}</h3>
                  <p className="text-sm">{t('class_service.no_data_subtitle')}</p>
                </div>
                <div className="flex justify-center">
                  <AddInitialDataDialog
                    onAddFeature={addFeature}
                    onAddService={addService}
                    loading={loading}
                    serviceType="CLASS"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div
                    className="bg-white border border-orange-200 rounded-lg overflow-hidden origin-top-left"
                    data-tour="class-matrix-table"
                  >
                    {/* Header row */}
                    <div
                      className="grid gap-[5px] p-4 text-orange-500 text-sm font-semibold bg-orange-50"
                      style={{
                        gridTemplateColumns: preview
                          ? `260px repeat(${classServices.length}, 180px)`
                          : `260px repeat(${classServices.length}, 180px) 180px`
                      }}
                    >
                      <div className="flex items-center justify-center px-2">
                        {t('class_service.features_services')}
                      </div>
                      {classServices.map((s) => (
                        <div key={s.id} className="flex flex-col items-center gap-1 min-w-0 px-2">
                          <div className="flex items-center gap-2 justify-center w-full min-w-0">
                            <button
                              className="truncate font-semibold cursor-pointer hover:text-orange-600 transition-colors bg-transparent border-none p-0 text-inherit max-w-full min-w-0"
                              onClick={() => !preview && handleEditService(s)}
                              title={s.name || (!preview ? t('class_service.click_to_edit') : '')}
                              disabled={preview}
                              style={{
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {s.name}
                            </button>
                            {!preview && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0 text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                                onClick={() => handleDeleteService(s)}
                                disabled={loading}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          {/* Price and Sessions */}
                          <div className="flex flex-col items-center gap-1 text-xs text-orange-400">
                            {s.price && s.price > 0 ? (
                              <div className="font-medium text-green-600">{s.price.toLocaleString('vi-VN')}₫</div>
                            ) : (
                              <div className="text-orange-300 italic text-xs">{t('class_service.no_price')}</div>
                            )}
                            {s.sessionCount && s.sessionCount > 0 ? (
                              <div className="text-blue-600">
                                {s.sessionCount} {t('class_service.sessions', 'buổi')}
                              </div>
                            ) : (
                              <div className="text-orange-300 italic text-xs">
                                {t('class_service.no_sessions', 'Chưa có số buổi')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {/* Add Package column */}
                      {!preview && (
                        <div className="flex items-center justify-center px-2">
                          <AddServiceDialog onSubmit={addService} loading={loading} serviceType="CLASS" iconOnly />
                        </div>
                      )}
                    </div>

                    {/* Feature rows */}
                    {features.map((f, index) => (
                      <div
                        key={f.id}
                        className={`grid gap-[5px] p-4 text-sm border-t border-gray-200 ${
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        }`}
                        style={{
                          gridTemplateColumns: preview
                            ? `260px repeat(${classServices.length}, 180px)`
                            : `260px repeat(${classServices.length}, 180px) 180px`
                        }}
                      >
                        {/* Feature name column */}
                        <div className="flex items-center justify-center gap-2 px-2">
                          <button
                            className="text-sm font-medium leading-5 text-center text-gray-800 cursor-pointer hover:text-orange-600 transition-colors bg-transparent border-none p-0 truncate max-w-full"
                            onClick={() => !preview && handleEditFeature(f)}
                            title={!preview ? t('class_service.click_to_edit') : ''}
                            disabled={preview}
                          >
                            {f.name}
                          </button>
                          {!preview && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0 text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                              onClick={() => handleDeleteFeature(f)}
                              disabled={loading}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {/* Service columns */}
                        {classServices.map((s) => {
                          const cellKey = `${s.id}__${f.id}`;
                          const cell = cells[cellKey];
                          return (
                            <div key={cellKey} className="flex items-center justify-center px-2">
                              {preview ? (
                                // render read-only preview
                                <div className="flex items-center justify-center py-2">
                                  {cell?.isIncluded ? (
                                    <div className="flex items-center justify-center w-6 h-6 bg-green-600 rounded-full">
                                      <Check className="w-4 h-4 text-white" />
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-lg">—</span>
                                  )}
                                </div>
                              ) : (
                                <MatrixCell
                                  feature={f}
                                  cell={cell}
                                  onChange={(patch: Partial<import('@/types/api/Matrix').MatrixCellData>) =>
                                    updateCell(s.id, f.id, patch)
                                  }
                                  disabled={loading}
                                />
                              )}
                            </div>
                          );
                        })}
                        {/* Empty cell for Add Package column */}
                        {!preview && <div className="flex items-center justify-center px-2"></div>}
                      </div>
                    ))}
                    {/* Add Feature row */}
                    {!preview && (
                      <div
                        className="grid gap-[5px] p-4 text-sm border-t border-gray-200 bg-gray-50"
                        style={{
                          gridTemplateColumns: `260px repeat(${classServices.length}, 180px) 180px`
                        }}
                      >
                        <div className="flex items-center justify-center px-2">
                          <AddFeatureDialog onSubmit={addFeature} loading={loading} serviceType="CLASS" iconOnly />
                        </div>
                        {/* Empty cells for service columns */}
                        {classServices.map((s) => (
                          <div key={s.id} className="flex items-center justify-center px-2"></div>
                        ))}
                        {/* Empty cell for Add Package column */}
                        <div className="flex items-center justify-center px-2"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDeleteServiceDialog
        service={serviceToDelete}
        onConfirm={confirmDeleteService}
        loading={loading}
        serviceType="CLASS"
      />
      <ConfirmDeleteFeatureDialog
        feature={featureToDelete}
        onConfirm={confirmDeleteFeature}
        loading={loading}
        serviceType="CLASS"
      />

      {/* Edit Dialogs */}
      <EditServiceDialog
        service={serviceToEdit}
        onSubmit={handleUpdateService}
        loading={updateServiceLoading}
        serviceType="CLASS"
      />
      <EditFeatureDialog
        feature={featureToEdit}
        onSubmit={handleUpdateFeature}
        loading={updateFeatureLoading}
        serviceType="CLASS"
      />
    </div>
  );
}
