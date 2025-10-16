import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Search, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEquipmentInventory } from '@/hooks/useEquipmentInventory';
import { format } from 'date-fns';
import { EQUIPMENT_INVENTORY_STATUS } from '@/constants/equipmentInventory';

export const EquipmentInventorySessionPage: React.FC = () => {
  const { t } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const {
    currentSession: session,
    equipments,
    loading,
    error,
    getInventorySessionById,
    getEquipmentToCheck,
    saveInventoryResults,
    setEquipments
  } = useEquipmentInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [completing, setCompleting] = useState(false);
  const [editingMode, setEditingMode] = useState(false);

  // Fetch session data
  const fetchSessionData = async () => {
    if (!sessionId) return;

    console.log('Fetching session data for sessionId:', sessionId);

    const sessionData = await getInventorySessionById(sessionId);
    console.log('Session data received:', sessionData);

    if (sessionData) {
      console.log('Session found, equipmentChecks length:', sessionData.equipmentChecks.length);
      // Nếu session chưa có equipmentChecks, load thiết bị từ branch
      if (sessionData.equipmentChecks.length === 0) {
        console.log('Loading equipment from branch:', {
          branchId: sessionData.branchId,
          inventoryDate: sessionData.inventoryDate,
          formattedDate: format(new Date(sessionData.inventoryDate), 'yyyy-MM-dd')
        });

        await getEquipmentToCheck(sessionData.branchId, format(new Date(sessionData.inventoryDate), 'yyyy-MM-dd'));
      }
    } else {
      console.log('No session data received');
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  // Debug log for equipments state
  useEffect(() => {
    console.log('Component: equipments state changed:', equipments);
  }, [equipments]);

  // Debug log for session state
  useEffect(() => {
    console.log('Component: session state changed:', session);
  }, [session]);

  // Tự động vào editing mode nếu session đã hoàn thành VÀ trong ngày
  useEffect(() => {
    if (session && session.isCompleted) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const sessionDate = format(new Date(session.inventoryDate), 'yyyy-MM-dd');

      // Chỉ cho phép chỉnh sửa nếu session trong ngày hôm nay
      if (sessionDate === today) {
        setEditingMode(true);
      }
    }
  }, [session]);

  // Handle save session
  const handleSaveSession = async () => {
    if (!sessionId || !session) return;

    setCompleting(true);

    // Tạo equipmentResults từ equipments
    const equipmentResults = equipments.map((equipment) => ({
      equipmentId: equipment._id,
      status: equipment.checkStatus || EQUIPMENT_INVENTORY_STATUS.PRESENT,
      notes: equipment.checkNotes || ''
    }));

    console.log('Saving inventory results:', { sessionId, equipmentResults });

    const success = await saveInventoryResults(sessionId, equipmentResults);

    if (success) {
      setEditingMode(false); // Reset editing mode
      navigate('/manage/technician/equipment-inventory');
    }

    setCompleting(false);
  };

  // Filter equipments
  const filteredEquipments = equipments.filter(
    (equipment) =>
      !searchTerm ||
      equipment.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.equipmentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug log for filtered equipments
  console.log('Component: filteredEquipments:', filteredEquipments);
  console.log('Component: searchTerm:', searchTerm);

  // Calculate stats
  const stats = {
    total: equipments.length,
    checked: equipments.filter((e) => e.checkStatus && e.checkStatus !== null).length,
    present: equipments.filter((e) => e.checkStatus === EQUIPMENT_INVENTORY_STATUS.PRESENT).length,
    missing: equipments.filter((e) => e.checkStatus === EQUIPMENT_INVENTORY_STATUS.MISSING).length,
    unchecked: equipments.filter((e) => !e.checkStatus || e.checkStatus === null).length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/manage/technician/equipment-inventory')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('equipmentInventory.back')}
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{t('equipmentInventory.sessionTitle')}</h1>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/manage/technician/equipment-inventory')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('equipmentInventory.back')}
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{t('equipmentInventory.sessionTitle')}</h1>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{t('equipmentInventory.sessionNotFound')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/manage/technician/equipment-inventory')}
              className="flex items-center gap-2 border-gray-300 hover:border-orange-300 hover:text-orange-600 transition-colors duration-200"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('equipmentInventory.back')}
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-orange-500" />
                {t('equipmentInventory.sessionTitle')}
              </h1>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <span className="font-medium">{format(new Date(session.inventoryDate), 'dd/MM/yyyy')}</span>
                <span>•</span>
                <span>{session.branchInfo?.branchName}</span>
              </p>
            </div>
          </div>

          <Button
            onClick={handleSaveSession}
            disabled={completing || (session && session.isCompleted && !editingMode)}
            className={
              session && session.isCompleted && !editingMode
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-200'
            }
            size="lg"
          >
            {completing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {session && session.isCompleted && !editingMode
              ? t('equipmentInventory.locked')
              : editingMode
                ? t('equipmentInventory.saveChanges')
                : t('equipmentInventory.save')}
          </Button>
        </div>

        {/* Session Locked Alert */}
        {session && session.isCompleted && !editingMode && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {t('equipmentInventory.sessionLockedMessage')}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-l-orange-500">
            <CardContent className="p-4">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">{t('equipmentInventory.totalEquipment')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-l-green-500">
            <CardContent className="p-4">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">{t('equipmentInventory.present')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-l-red-500">
            <CardContent className="p-4">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">{t('equipmentInventory.missing')}</p>
                <p className="text-2xl font-bold text-red-600">{stats.missing}</p>
              </div>
            </CardContent>
          </Card>
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
                    placeholder={t('equipmentInventory.searchEquipmentPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 sm:h-11 w-full rounded-full border border-transparent bg-gray-50 pl-10 sm:pl-12 pr-4 text-sm shadow-inner focus:border-orange-200 focus:bg-white focus:ring-orange-200"
                  />
                  <Search className="pointer-events-none absolute left-3 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Equipment Table */}
              {filteredEquipments && filteredEquipments.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-orange-50">
                      <TableRow className="border-orange-100 hover:bg-orange-50">
                        <TableHead className="text-orange-600 font-semibold px-6 py-4">
                          {t('equipmentInventory.equipment')}
                        </TableHead>
                        <TableHead className="text-orange-600 font-semibold px-6 py-4">
                          {t('equipmentInventory.manufacturer')}
                        </TableHead>
                        <TableHead className="text-orange-600 font-semibold px-6 py-4">
                          {t('equipmentInventory.location')}
                        </TableHead>
                        <TableHead className="text-orange-600 font-semibold px-6 py-4">
                          {t('equipmentInventory.status')}
                        </TableHead>
                        <TableHead className="text-center text-orange-600 font-semibold px-6 py-4">
                          {t('equipmentInventory.inventoryStatus')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEquipments.map((equipment, index) => (
                        <TableRow
                          key={equipment._id}
                          className={`hover:bg-orange-50/50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-[#FFF9F2]'
                          }`}
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{equipment.equipmentName}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-orange-50 text-orange-700 border-orange-200 px-1.5 py-0.5"
                                  >
                                    {equipment.equipmentCode}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-1.5 py-0.5"
                                  >
                                    {equipment.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm text-gray-900">{equipment.manufacturer}</TableCell>
                          <TableCell className="px-6 py-4 text-sm text-gray-900">{equipment.location}</TableCell>
                          <TableCell className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                equipment.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : equipment.status === 'INACTIVE'
                                    ? 'bg-gray-100 text-gray-800'
                                    : equipment.status === 'MAINTENANCE'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : equipment.status === 'REPAIR'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {equipment.status === 'ACTIVE'
                                ? t('equipmentInventory.active')
                                : equipment.status === 'INACTIVE'
                                  ? t('equipmentInventory.inactive')
                                  : equipment.status === 'MAINTENANCE'
                                    ? t('equipmentInventory.maintenance')
                                    : equipment.status === 'REPAIR'
                                      ? t('equipmentInventory.repair')
                                      : equipment.status}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Checkbox
                                checked={equipment.checkStatus === EQUIPMENT_INVENTORY_STATUS.MISSING}
                                disabled={session.isCompleted && !editingMode}
                                onCheckedChange={(checked) => {
                                  if (session.isCompleted && !editingMode) return;
                                  const newStatus = checked
                                    ? EQUIPMENT_INVENTORY_STATUS.MISSING
                                    : EQUIPMENT_INVENTORY_STATUS.PRESENT;
                                  setEquipments(
                                    equipments.map((eq) =>
                                      eq._id === equipment._id ? { ...eq, checkStatus: newStatus } : eq
                                    )
                                  );
                                }}
                                className={`data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 ${
                                  session.isCompleted && !editingMode ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              />
                              <span
                                className={`text-sm font-medium ${
                                  equipment.checkStatus === EQUIPMENT_INVENTORY_STATUS.MISSING
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }`}
                              >
                                {equipment.checkStatus === EQUIPMENT_INVENTORY_STATUS.MISSING
                                  ? t('equipmentInventory.missing')
                                  : t('equipmentInventory.present')}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('equipmentInventory.noEquipmentFound')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};
