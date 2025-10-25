import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { handleAsyncOperation } from '@/utils/errorHandler';
import { Search, Filter, MoreHorizontal, Trash2, Play, Pause, Brain, Calendar, Building, Eye } from 'lucide-react';
import { useScheduleTemplate } from '@/hooks/useScheduleTemplate';
import { useBranches } from '@/hooks/useBranches';
import { ScheduleTemplateStats } from './ScheduleTemplateStats';
import { ScheduleTemplateDetailModal } from './ScheduleTemplateDetailModal';
import type { ScheduleTemplate, ScheduleType } from '@/types/api/ScheduleTemplate';
import { SCHEDULE_TYPES } from '@/types/api/ScheduleTemplate';
import { getScheduleTypeLabel, formatDaysOfWeek } from '@/utils/scheduleTypeHelpers';
import { getTemplateTypeColor } from '@/utils/scheduleTemplateHelpers';

interface ScheduleTemplateListProps {
  branchId?: string;
}

export const ScheduleTemplateList: React.FC<ScheduleTemplateListProps> = ({ branchId }) => {
  const { t } = useTranslation();
  const {
    templates,
    loading,
    error,
    pagination,
    fetchTemplates,
    deleteTemplate,
    activateTemplate,
    deactivateTemplate,
    searchTemplates
  } = useScheduleTemplate();

  const { branches } = useBranches();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ScheduleType | 'all'>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || 'all');
  const [showStats, setShowStats] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ScheduleTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    const params = {
      page: 1,
      limit: 10,
      ...(selectedBranch && selectedBranch !== 'all' && { branchId: selectedBranch }),
      ...(selectedType && selectedType !== 'all' && { type: selectedType }),
      ...(searchTerm && { search: searchTerm })
    };
    fetchTemplates(params);
  }, [selectedBranch, selectedType, searchTerm, fetchTemplates]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      searchTemplates(value, selectedBranch === 'all' ? undefined : selectedBranch);
    } else {
      fetchTemplates({
        page: 1,
        limit: 10,
        ...(selectedBranch && selectedBranch !== 'all' && { branchId: selectedBranch }),
        ...(selectedType !== 'all' && { type: selectedType as ScheduleType })
      });
    }
  };

  // Removed handleCreateTemplate as it's no longer needed

  const handleDeleteTemplate = (template: ScheduleTemplate) => {
    setTemplateToDelete(template);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;

    // Using the new error handler with wrapper function
    const result = await handleAsyncOperation(
      async () => {
        await deleteTemplate(templateToDelete._id);
        return { success: true, data: { deleted: true } };
      },
      t('schedule_templates.delete_success'),
      t('schedule_templates.delete_error', { name: templateToDelete.name })
    );

    if (result) {
      // Refresh list
      fetchTemplates({
        page: 1,
        limit: 10,
        ...(selectedBranch && { branchId: selectedBranch }),
        ...(selectedType !== 'all' && { type: selectedType as ScheduleType })
      });
    }

    setShowDeleteDialog(false);
    setTemplateToDelete(null);
  };

  const handleToggleActive = async (template: ScheduleTemplate) => {
    if (template.isActive) {
      await deactivateTemplate(template._id);
    } else {
      await activateTemplate(template._id);
    }
  };

  const handleViewDetail = (template: ScheduleTemplate) => {
    setSelectedTemplate(template);
    setShowDetailModal(true);
  };

  const handleEditFromDetail = () => {
    fetchTemplates({
      page: 1,
      limit: 10,
      ...(selectedBranch && { branchId: selectedBranch }),
      ...(selectedType !== 'all' && { type: selectedType as ScheduleType })
    });
  };

  const getTypeColor = (type: ScheduleType) => {
    return getTemplateTypeColor(type);
  };

  const formatDays = (days: string[]) => {
    return formatDaysOfWeek(days, t);
  };

  const getTypeLabel = (type: ScheduleType) => {
    return getScheduleTypeLabel(type, t);
  };

  if (showStats) {
    return <ScheduleTemplateStats branchId={selectedBranch} onBack={() => setShowStats(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('schedule_templates.title')}</h1>
          <p className="text-muted-foreground">{t('schedule_templates.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowStats(true)}>
            <Brain className="w-4 h-4 mr-2" />
            {t('schedule_templates.statistics')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label htmlFor="search" className="text-sm font-medium">
                {t('schedule_templates.search')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('schedule.form.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="branch" className="text-sm font-medium">
                {t('schedule_templates.branch')}
              </label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder={t('schedule.form.all_branches')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('schedule_templates.all_branches')}</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.branchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                {t('schedule_templates.type')}
              </label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ScheduleType | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('schedule.form.all_types')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('schedule_templates.all_types')}</SelectItem>
                  {Object.entries(SCHEDULE_TYPES).map(([value]) => (
                    <SelectItem key={value} value={value}>
                      {getScheduleTypeLabel(value as ScheduleType, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="actions" className="text-sm font-medium">
                {t('schedule_templates.actions')}
              </label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  {t('schedule_templates.filter')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                    setSelectedBranch(branchId || 'all');
                  }}
                >
                  {t('schedule_templates.clear')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('schedule_templates.templates_count', { count: templates?.length || 0 })}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{t('schedule_templates.loading')}</div>
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-destructive">{t('schedule_templates.error', { error })}</div>
            </div>
          )}
          {!loading && !error && (!templates || templates.length === 0) && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t('schedule_templates.no_templates')}</h3>
                <p className="text-muted-foreground mb-4">{t('schedule_templates.empty_state_message')}</p>
              </div>
            </div>
          )}
          {!loading && !error && templates && templates.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('schedule_templates.name')}</TableHead>
                  <TableHead>{t('schedule_templates.type_column')}</TableHead>
                  <TableHead>{t('schedule_templates.branch_column')}</TableHead>
                  <TableHead>{t('schedule_templates.days')}</TableHead>
                  <TableHead className="w-[50px]">{t('schedule_templates.actions_column')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates?.map((template) => (
                  <TableRow key={template._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-muted-foreground">{template.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(template.type)}>{getTypeLabel(template.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        {template.branchId?.branchName || t('common.unknown')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDays(template.daysOfWeek)}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('schedule_templates.actions')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewDetail(template)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {t('common.view_details')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(template)}>
                            {template.isActive ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                {t('common.deactivate')}
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                {t('common.activate')}
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteTemplate(template)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('schedule_templates.pagination_showing', {
              current: templates?.length || 0,
              total: pagination?.total || 0
            })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() =>
                fetchTemplates({
                  page: pagination.page - 1,
                  limit: pagination.limit,
                  ...(selectedBranch && { branchId: selectedBranch }),
                  ...(selectedType !== 'all' && { type: selectedType as ScheduleType })
                })
              }
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() =>
                fetchTemplates({
                  page: pagination.page + 1,
                  limit: pagination.limit,
                  ...(selectedBranch && { branchId: selectedBranch }),
                  ...(selectedType !== 'all' && { type: selectedType as ScheduleType })
                })
              }
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Schedule Template Detail Modal */}
      <ScheduleTemplateDetailModal
        template={selectedTemplate}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTemplate(null);
        }}
        onEdit={handleEditFromDetail}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('schedule_templates.delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('schedule_templates.delete_confirm_message', { name: templateToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTemplate}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
