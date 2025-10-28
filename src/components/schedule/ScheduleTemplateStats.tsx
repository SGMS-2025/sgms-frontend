import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BarChart3, TrendingUp, Users, Calendar, Brain, Activity, Building } from 'lucide-react';
import { useScheduleTemplate } from '@/hooks/useScheduleTemplate';
import { useBranches } from '@/hooks/useBranches';
import type { ScheduleTemplateStats as ScheduleTemplateStatsType } from '@/types/api/ScheduleTemplate';
import { SCHEDULE_TYPES } from '@/types/api/ScheduleTemplate';
import { useTranslation } from 'react-i18next';
interface ScheduleTemplateStatsComponentProps {
  branchId?: string;
  onBack: () => void;
}

export const ScheduleTemplateStats: React.FC<ScheduleTemplateStatsComponentProps> = ({ branchId, onBack }) => {
  const { getTemplateStats } = useScheduleTemplate();
  const { branches } = useBranches();
  const { t } = useTranslation();
  const [stats, setStats] = useState<ScheduleTemplateStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || '');
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(
    async (branchId?: string) => {
      setLoading(true);
      setError(null);

      const result = await getTemplateStats(branchId);
      setStats(result);
      setLoading(false);
    },
    [getTemplateStats]
  );

  useEffect(() => {
    fetchStats(selectedBranch || undefined);
  }, [selectedBranch, fetchStats]);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
  };

  const selectedBranchData = branches.find((b) => b._id === selectedBranch);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Template Statistics</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading statistics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Template Statistics</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-destructive">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Template Statistics</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">No statistics available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Template Statistics</h1>
            <p className="text-muted-foreground">
              {selectedBranchData ? `Statistics for ${selectedBranchData.branchName}` : 'Overall statistics'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedBranch} onValueChange={handleBranchChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('schedule.form.select_branch')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch._id} value={branch._id}>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {branch.branchName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All schedule templates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active templates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Generation</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.autoGenerate}</div>
            <p className="text-xs text-muted-foreground">Templates with auto generation enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Templates</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Disabled templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Templates by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Templates by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.byType.map((type) => (
              <div key={type._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <div>
                    <div className="font-medium">{SCHEDULE_TYPES[type._id]?.label || type._id}</div>
                    <div className="text-sm text-muted-foreground">{type._id} templates</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-lg font-bold">
                  {type.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Template Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Templates</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{stats.active}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inactive Templates</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full"
                      style={{
                        width: `${stats.total > 0 ? (stats.inactive / stats.total) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{stats.inactive}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto Generation</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${stats.total > 0 ? (stats.autoGenerate / stats.total) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{stats.autoGenerate}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Templates</span>
                <Badge variant="outline" className="text-lg font-bold">
                  {stats.total}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Rate</span>
                <Badge
                  variant="outline"
                  className={`text-lg font-bold ${
                    stats.total > 0 && stats.active / stats.total > 0.8 ? 'text-green-600' : 'text-yellow-600'
                  }`}
                >
                  {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto Gen Rate</span>
                <Badge
                  variant="outline"
                  className={`text-lg font-bold ${
                    stats.total > 0 && stats.autoGenerate / stats.total > 0.5 ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {stats.total > 0 ? Math.round((stats.autoGenerate / stats.total) * 100) : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
