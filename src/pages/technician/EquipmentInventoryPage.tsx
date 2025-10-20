import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronDown,
  Eye,
  AlertTriangle,
  FileText,
  Plus,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBranch } from '@/contexts/BranchContext';
import { useEquipmentInventory } from '@/hooks/useEquipmentInventory';
import { equipmentInventoryApi } from '@/services/api/equipmentInventoryApi';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { EQUIPMENT_INVENTORY_STATUS } from '@/constants/equipmentInventory';
import type { EquipmentInventorySession } from '@/types/api/EquipmentInventory';

export const EquipmentInventoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const {
    sessions: inventorySessions,
    loading,
    error,
    getInventoryHistory,
    startInventorySession
  } = useEquipmentInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<EquipmentInventorySession | null>(null);

  // Fetch inventory sessions
  const fetchInventorySessions = async () => {
    if (!currentBranch?._id) {
      console.log('No current branch selected');
      return;
    }

    console.log('Fetching inventory sessions for branch:', currentBranch._id);

    await getInventoryHistory({
      branchId: currentBranch._id,
      page: 1,
      limit: 50,
      sortBy: 'inventoryDate',
      sortOrder: 'desc'
    });
  };

  useEffect(() => {
    fetchInventorySessions();
  }, [currentBranch?._id]);

  const getStatusBadge = (isCompleted: boolean) => {
    if (isCompleted) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('equipmentInventory.completed')}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          {t('equipmentInventory.inProgress')}
        </Badge>
      );
    }
  };

  // Filter inventory sessions
  const filteredSessions = inventorySessions.filter((session) => {
    const matchesSearch =
      !searchTerm ||
      session.branchInfo?.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.checkedByInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      !statusFilter ||
      statusFilter === 'all' ||
      (statusFilter === 'completed' && session.isCompleted) ||
      (statusFilter === 'in-progress' && !session.isCompleted);

    return matchesSearch && matchesStatus;
  });

  const handleViewDetail = async (session: EquipmentInventorySession) => {
    setSelectedSession(session);

    // Nếu equipmentChecks có equipmentId nhưng chưa được populate, fetch thông tin thiết bị
    if (session.equipmentChecks && session.equipmentChecks.length > 0) {
      const firstCheck = session.equipmentChecks[0];
      if (typeof firstCheck.equipmentId === 'string') {
        console.log('EquipmentId is string, fetching equipment details...');

        // Fetch thông tin thiết bị từ branch
        const branchEquipments = await equipmentInventoryApi.getEquipmentToCheck(
          session.branchId,
          session.inventoryDate
            ? format(new Date(session.inventoryDate), 'yyyy-MM-dd')
            : format(new Date(), 'yyyy-MM-dd')
        );

        if (branchEquipments.success && branchEquipments.data.equipments) {
          // Map equipment info vào equipmentChecks
          const updatedSession = {
            ...session,
            equipmentChecks: session.equipmentChecks.map((check) => {
              const equipment = branchEquipments.data.equipments.find((eq) => eq._id === check.equipmentId);
              return {
                ...check,
                equipmentId: equipment || check.equipmentId // Use full equipment object
              };
            })
          };

          console.log('Updated session with equipment details:', updatedSession);
          setSelectedSession(updatedSession);
        }
      }
    }

    setShowDetailModal(true);
  };

  const handleStartNewSession = async () => {
    if (!currentBranch?._id) {
      toast.error(t('equipmentInventory.selectBranch'));
      return;
    }

    // Luôn sử dụng ngày hôm nay (đảm bảo timezone đúng)
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    console.log(
      'Starting new inventory session for branch:',
      currentBranch._id,
      'date:',
      today,
      'current time:',
      now.toISOString()
    );

    // Kiểm tra xem đã có session hôm nay chưa
    const existingSession = inventorySessions.find(
      (session) =>
        session.branchId === currentBranch._id && format(new Date(session.inventoryDate), 'yyyy-MM-dd') === today
    );

    if (existingSession) {
      toast.info(t('equipmentInventory.sessionExistsToday'));
      return;
    }

    const session = await startInventorySession({
      branchId: currentBranch._id,
      inventoryDate: today // Luôn dùng ngày hôm nay
    });

    if (session) {
      fetchInventorySessions();
      // Redirect to inventory session page
      window.location.href = `/manage/technician/equipment-inventory/session/${session._id}`;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          {/* Breadcrumb */}
          <div className="text-xs sm:text-sm text-orange-500 font-medium">{t('equipmentInventory.breadcrumb')}</div>

          {/* Main Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {t('equipmentInventory.title')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">{t('equipmentInventory.description')}</p>
            </div>
            <Button
              onClick={handleStartNewSession}
              disabled={!currentBranch?._id}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('equipmentInventory.startToday')}
            </Button>
          </div>

          {/* Branch Filter Badge */}
          {currentBranch && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 text-xs sm:text-sm">
                <MapPin className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">{t('equipmentInventory.filteringByBranch')}:</span>
                <span className="sm:hidden">{t('equipmentInventory.branch')}:</span>
                <span className="font-medium">{currentBranch.branchName}</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Main Content Card */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Search and Filter Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={t('equipmentInventory.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 sm:h-11 w-full rounded-full border border-transparent bg-gray-50 pl-10 sm:pl-12 pr-4 text-sm shadow-inner focus:border-orange-200 focus:bg-white focus:ring-orange-200"
                  />
                  <Search className="pointer-events-none absolute left-3 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>

                {/* Status Filter */}
                <div className="relative dropdown-container">
                  <button
                    className="h-10 sm:h-11 rounded-full border border-gray-200 bg-white px-3 sm:px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200 flex items-center gap-2 w-full sm:min-w-[140px] justify-between"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    <span className="truncate">
                      {statusFilter === 'all'
                        ? t('equipmentInventory.allStatus')
                        : statusFilter === 'completed'
                          ? t('equipmentInventory.completed')
                          : statusFilter === 'in-progress'
                            ? t('equipmentInventory.inProgress')
                            : statusFilter}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                        showStatusDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showStatusDropdown && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                      <div className="py-1">
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setStatusFilter('all');
                            setShowStatusDropdown(false);
                          }}
                        >
                          {t('equipmentInventory.allStatus')}
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setStatusFilter('completed');
                            setShowStatusDropdown(false);
                          }}
                        >
                          {t('equipmentInventory.completed')}
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setStatusFilter('in-progress');
                            setShowStatusDropdown(false);
                          }}
                        >
                          {t('equipmentInventory.inProgress')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4 sm:my-6" />

              {/* Sessions Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader className="bg-orange-50">
                      <TableRow className="border-orange-100 hover:bg-orange-50">
                        <TableHead className="text-orange-600 font-semibold">{t('equipmentInventory.stt')}</TableHead>
                        <TableHead className="text-orange-600 font-semibold">
                          {t('equipmentInventory.inventoryDate')}
                        </TableHead>
                        <TableHead className="text-orange-600 font-semibold">
                          {t('equipmentInventory.performer')}
                        </TableHead>
                        <TableHead className="text-orange-600 font-semibold">
                          {t('equipmentInventory.status')}
                        </TableHead>
                        <TableHead className="text-orange-600 font-semibold">
                          {t('equipmentInventory.actions')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <>
                          {Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Skeleton className="h-4 w-8" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-32" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-6 w-16 rounded-full" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-8 w-16" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={5} className="p-0">
                            <Alert variant="destructive" className="m-4">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                {t('equipmentInventory.loadError')}: {error}
                              </AlertDescription>
                            </Alert>
                          </TableCell>
                        </TableRow>
                      ) : filteredSessions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <div className="text-gray-500 mb-2">
                              {inventorySessions.length === 0
                                ? t('equipmentInventory.noSessions')
                                : t('equipmentInventory.noMatchingSessions')}
                            </div>
                            <div className="text-sm text-gray-400">
                              {inventorySessions.length === 0
                                ? t('equipmentInventory.createFirstSession')
                                : t('equipmentInventory.tryDifferentSearch')}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSessions.map((session: EquipmentInventorySession, index: number) => (
                          <TableRow
                            key={session._id}
                            className={`hover:bg-orange-50/50 transition-colors ${
                              index % 2 === 0 ? 'bg-white' : 'bg-[#FFF9F2]'
                            }`}
                          >
                            <TableCell className="font-medium text-orange-500">{index + 1}</TableCell>
                            <TableCell className="text-gray-600">
                              {session.inventoryDate ? format(new Date(session.inventoryDate), 'dd/MM/yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {session.checkedByInfo?.fullName || t('equipmentInventory.unknown')}
                                </div>
                                <div className="text-xs text-gray-500">{session.checkedByInfo?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(session.isCompleted)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <button
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500"
                                  onClick={() => handleViewDetail(session)}
                                  title={t('equipmentInventory.viewDetail')}
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {(() => {
                                  const today = format(new Date(), 'yyyy-MM-dd');
                                  const sessionDate = format(new Date(session.inventoryDate), 'yyyy-MM-dd');
                                  const isToday = sessionDate === today;

                                  return isToday ? (
                                    <button
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500"
                                      onClick={() => {
                                        window.location.href = `/manage/technician/equipment-inventory/session/${session._id}`;
                                      }}
                                      title={t('equipmentInventory.edit')}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  ) : null;
                                })()}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden">
                  {loading ? (
                    <div className="p-4 space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                            </div>
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="p-4">
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {t('equipmentInventory.loadError')}: {error}
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>{t('equipmentInventory.noSessions')}</p>
                    </div>
                  ) : (
                    filteredSessions.map((session: EquipmentInventorySession, index: number) => (
                      <div key={session._id} className="bg-white border border-gray-200 rounded-lg p-4 m-4">
                        <div className="space-y-3">
                          {/* Header with status */}
                          <div className="flex justify-between items-start">
                            <div className="text-sm font-medium text-gray-600">#{index + 1}</div>
                            {getStatusBadge(session.isCompleted)}
                          </div>

                          {/* Date */}
                          <div>
                            <h3 className="font-semibold text-gray-900 text-base">
                              {session.inventoryDate ? format(new Date(session.inventoryDate), 'dd/MM/yyyy') : 'N/A'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {t('equipmentInventory.performer')}:{' '}
                              {session.checkedByInfo?.fullName || t('equipmentInventory.unknown')}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>
                              {t('equipmentInventory.present')}:{' '}
                              <span className="font-medium text-green-600">{session.presentCount}</span>
                            </span>
                            <span>
                              {t('equipmentInventory.missing')}:{' '}
                              <span className="font-medium text-red-600">{session.missingCount}</span>
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <button
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500 mr-2"
                              onClick={() => handleViewDetail(session)}
                              title={t('equipmentInventory.viewDetail')}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {(() => {
                              const today = format(new Date(), 'yyyy-MM-dd');
                              const sessionDate = format(new Date(session.inventoryDate), 'yyyy-MM-dd');
                              const isToday = sessionDate === today;

                              return isToday ? (
                                <button
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500"
                                  onClick={() => {
                                    window.location.href = `/manage/technician/equipment-inventory/session/${session._id}`;
                                  }}
                                  title={t('equipmentInventory.edit')}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                {t('equipmentInventory.sessionDetail')}
              </DialogTitle>
            </DialogHeader>

            {selectedSession && (
              <div className="mt-4 space-y-6">
                {/* Session Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{t('equipmentInventory.sessionInfo')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('equipmentInventory.inventoryDate')}:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedSession.inventoryDate
                          ? format(new Date(selectedSession.inventoryDate), 'dd/MM/yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">{t('equipmentInventory.performer')}:</span>
                      <p className="text-sm text-gray-900">{selectedSession.checkedByInfo?.fullName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">{t('equipmentInventory.status')}:</span>
                      <div className="mt-1">{getStatusBadge(selectedSession.isCompleted)}</div>
                    </div>
                  </div>
                </div>

                {/* Equipment Checks */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{t('equipmentInventory.inventoryResults')}</h3>
                  <div className="space-y-2">
                    {selectedSession.equipmentChecks.map((check, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <div className="font-medium text-gray-900">
                            {(check.equipmentId as { equipmentName?: string })?.equipmentName ||
                              t('equipmentInventory.unknownEquipment')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {t('equipmentInventory.code')}:{' '}
                            {(check.equipmentId as { equipmentCode?: string })?.equipmentCode ||
                              (typeof check.equipmentId === 'string' ? check.equipmentId : 'N/A')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {check.status === EQUIPMENT_INVENTORY_STATUS.PRESENT ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {t('equipmentInventory.present')}
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              {t('equipmentInventory.missing')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                    {t('equipmentInventory.close')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};
