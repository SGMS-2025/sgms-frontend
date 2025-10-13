import React, { useState, useEffect } from 'react';
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
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Pause,
  Brain,
  Calendar,
  Clock,
  Users,
  Building
} from 'lucide-react';
import { useScheduleTemplate } from '@/hooks/useScheduleTemplate';
import { useBranches } from '@/hooks/useBranches';
import { ScheduleTemplateForm } from './ScheduleTemplateForm';
import { ScheduleTemplateStats } from './ScheduleTemplateStats';
import type { ScheduleTemplate, ScheduleType, UpdateScheduleTemplateRequest } from '@/types/api/ScheduleTemplate';
import { SCHEDULE_TYPES } from '@/types/api/ScheduleTemplate';

interface ScheduleTemplateListProps {
  branchId?: string;
  onTemplateSelect?: (template: ScheduleTemplate) => void;
}

export const ScheduleTemplateList: React.FC<ScheduleTemplateListProps> = ({ branchId, onTemplateSelect }) => {
  const {
    templates,
    loading,
    error,
    pagination,
    fetchTemplates,
    updateTemplate,
    deleteTemplate,
    activateTemplate,
    deactivateTemplate,
    searchTemplates
  } = useScheduleTemplate();

  const { branches } = useBranches();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ScheduleType | 'all'>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || 'all');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    const params = {
      page: 1,
      limit: 10,
      ...(selectedBranch && selectedBranch !== 'all' && { branchId: selectedBranch }),
      ...(selectedType && selectedType !== 'all' && { type: selectedType as ScheduleType }),
      ...(searchTerm && { search: searchTerm })
    };
    fetchTemplates(params);
  }, [selectedBranch, selectedType, searchTerm, fetchTemplates]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      searchTemplates(value, selectedBranch !== 'all' ? selectedBranch : undefined);
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

  const handleUpdateTemplate = async (data: UpdateScheduleTemplateRequest) => {
    if (!editingTemplate) return;

    await updateTemplate(editingTemplate._id, data);
    setEditingTemplate(null);
    // Refresh list
    fetchTemplates({
      page: 1,
      limit: 10,
      ...(selectedBranch && selectedBranch !== 'all' && { branchId: selectedBranch }),
      ...(selectedType !== 'all' && { type: selectedType as ScheduleType })
    });
  };

  const handleDeleteTemplate = async (template: ScheduleTemplate) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      await deleteTemplate(template._id);
      // Refresh list
      fetchTemplates({
        page: 1,
        limit: 10,
        ...(selectedBranch && { branchId: selectedBranch }),
        ...(selectedType !== 'all' && { type: selectedType as ScheduleType })
      });
    }
  };

  const handleToggleActive = async (template: ScheduleTemplate) => {
    if (template.isActive) {
      await deactivateTemplate(template._id);
    } else {
      await activateTemplate(template._id);
    }
  };

  const getTypeColor = (type: ScheduleType) => {
    switch (type) {
      case 'CLASS':
        return 'bg-blue-100 text-blue-800';
      case 'PERSONAL_TRAINING':
        return 'bg-green-100 text-green-800';
      case 'FREE_TIME':
        return 'bg-yellow-100 text-yellow-800';
      case 'MAINTENANCE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const formatTime = (time: string) => {
    return time;
  };

  const formatDays = (days: string[]) => {
    return days.map((day) => day.slice(0, 3)).join(', ');
  };

  const getTypeLabel = (type: ScheduleType) => {
    return SCHEDULE_TYPES[type]?.label || type;
  };

  if (showForm) {
    return (
      <ScheduleTemplateForm
        template={editingTemplate || undefined}
        onSuccess={
          editingTemplate
            ? (template: ScheduleTemplate) => {
                const updateData: UpdateScheduleTemplateRequest = {
                  name: template.name,
                  description: template.description,
                  type: template.type,
                  branchId: template.branchId._id,
                  startTime: template.startTime,
                  endTime: template.endTime,
                  daysOfWeek: template.daysOfWeek,
                  maxCapacity: template.maxCapacity,
                  priority: template.priority,
                  isActive: template.isActive,
                  autoGenerate: template.autoGenerate
                    ? {
                        enabled: template.autoGenerate.enabled,
                        advanceDays: template.autoGenerate.advanceDays,
                        endDate: template.autoGenerate.endDate || new Date().toISOString()
                      }
                    : undefined,
                  notes: template.notes
                };
                handleUpdateTemplate(updateData);
              }
            : () => {
                // For create, just close the form and refresh the list
                setShowForm(false);
                // Refresh list
                fetchTemplates({
                  page: 1,
                  limit: 10,
                  ...(selectedBranch && selectedBranch !== 'all' && { branchId: selectedBranch }),
                  ...(selectedType !== 'all' && { type: selectedType as ScheduleType })
                });
              }
        }
        onCancel={() => {
          setShowForm(false);
          setEditingTemplate(null);
        }}
      />
    );
  }

  if (showStats) {
    return <ScheduleTemplateStats branchId={selectedBranch} onBack={() => setShowStats(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule Templates</h1>
          <p className="text-muted-foreground">Manage work schedule templates and auto-generation settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowStats(true)}>
            <Brain className="w-4 h-4 mr-2" />
            Statistics
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label htmlFor="search" className="text-sm font-medium">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="branch" className="text-sm font-medium">
                Branch
              </label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
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
                Type
              </label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ScheduleType | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(SCHEDULE_TYPES).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="actions" className="text-sm font-medium">
                Actions
              </label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
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
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Templates ({templates?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading templates...</div>
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-destructive">Error: {error}</div>
            </div>
          )}
          {!loading && !error && (!templates || templates.length === 0) && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No templates found</h3>
                <p className="text-muted-foreground mb-4">Create your first schedule template to get started</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </div>
          )}
          {!loading && !error && templates && templates.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auto Gen</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
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
                        {template.branchId.branchName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {formatTime(template.startTime)} - {formatTime(template.endTime)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDays(template.daysOfWeek)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {template.maxCapacity}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(template.isActive)}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {template.autoGenerate.enabled ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <Brain className="w-3 h-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800">
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{template.usageCount} times</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              if (onTemplateSelect) {
                                onTemplateSelect(template);
                              } else {
                                setEditingTemplate(template);
                              }
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(template)}>
                            {template.isActive ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteTemplate(template)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
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
            Showing {templates?.length || 0} of {pagination?.total || 0} templates
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
              Previous
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
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
