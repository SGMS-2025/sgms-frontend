import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, RefreshCw, Plus, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import type { TimeOff } from '@/types/api/TimeOff';
import { Badge } from '@/components/ui/badge';

interface MobileTimeOffViewProps {
  timeOffs: TimeOff[];
  loading?: boolean;
  stats?: { total: number; pending: number; approved: number; rejected: number; cancelled: number };
  onCreateNew?: () => void;
  onRefresh?: () => void;
  onView?: (id: string) => void;
}

const MobileTimeOffView: React.FC<MobileTimeOffViewProps> = ({
  timeOffs,
  loading,
  stats,
  onCreateNew,
  onRefresh,
  onView
}) => {
  const { t } = useTranslation();

  const renderStatus = (status?: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{t('timeoff.status.approved')}</Badge>
        );
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('timeoff.status.pending')}</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">{t('timeoff.status.rejected')}</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{t('timeoff.status.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="bg-orange-50 text-orange-700 border-orange-200">
            <Calendar className="w-3 h-3 mr-1" />
            {t('timeoff.title') || 'Time Off'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-1" />
              {t('common.refresh') || 'Refresh'}
            </Button>
          )}
        </div>
      </div>

      {onCreateNew && (
        <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          {t('timeoff.request_time_off') || 'Request Time Off'}
        </Button>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-gray-500">{t('timeoff.total')}</div>
              <div className="text-xl font-semibold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <div>
                <div className="text-xs text-gray-500">{t('timeoff.status.pending')}</div>
                <div className="text-lg font-semibold">{stats.pending}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-xs text-gray-500">{t('timeoff.status.approved')}</div>
                <div className="text-lg font-semibold">{stats.approved}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <div>
                <div className="text-xs text-gray-500">{t('timeoff.status.rejected')}</div>
                <div className="text-lg font-semibold">{stats.rejected}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">{t('common.loading') || 'Loading...'}</CardContent>
          </Card>
        ) : timeOffs.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              {t('timeoff.no_requests') || 'No requests'}
            </CardContent>
          </Card>
        ) : (
          timeOffs.map((tfo) => (
            <Card key={tfo._id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {t(`timeoff.type.${(tfo.type || 'OTHER').toLowerCase()}`)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(tfo.startDate).toLocaleDateString()} - {new Date(tfo.endDate).toLocaleDateString()}
                    </div>
                    {tfo.branchId?.branchName && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {tfo.branchId.branchName}
                      </div>
                    )}
                    {tfo.reason && <div className="text-xs text-gray-600 mt-2 line-clamp-2">{tfo.reason}</div>}
                  </div>
                  <div>{renderStatus(tfo.status)}</div>
                </div>
                {onView && (
                  <Button variant="ghost" size="sm" className="mt-2 text-orange-600" onClick={() => onView(tfo._id)}>
                    {t('timeoff.view_details') || 'View details'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileTimeOffView;
