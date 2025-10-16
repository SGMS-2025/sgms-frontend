import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, User as UserIcon, Building2, LogIn, AlertCircle, CheckCircle2, Crown, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api/api';
import { useAttendanceBranches } from '@/hooks/useBranches';
import { useStaffDetailsByUserId } from '@/hooks/useStaff';
import { useStaffAttendance } from '@/hooks/useStaffAttendance';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/api/User';
import type { BranchDisplay } from '@/types/api/Branch';
import type { StaffAttendance } from '@/types/api/StaffAttendance';

interface AttendanceState {
  isLoggedIn: boolean;
  user: User | null;
  selectedBranch: BranchDisplay | null;
  staffUsername: string;
  attendanceRecord: StaffAttendance | null;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

interface BranchSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBranchSelect: (branch: BranchDisplay) => void;
  branches: BranchDisplay[];
  loading: boolean;
  error: string | null;
}

const BranchSelectionModal: React.FC<BranchSelectionModalProps> = ({
  isOpen,
  onClose,
  onBranchSelect,
  branches,
  loading,
  error
}) => {
  const { t } = useTranslation();
  let bodyContent: React.ReactNode;
  if (loading) {
    bodyContent = (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">{t('attendance.branch_modal.loading')}</span>
      </div>
    );
  } else if (error) {
    bodyContent = (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  } else if (branches.length === 0) {
    bodyContent = (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t('attendance.branch_modal.no_branches')}</AlertDescription>
      </Alert>
    );
  } else {
    bodyContent = (
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {branches.map((branch) => (
          <Card
            key={branch._id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onBranchSelect(branch)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{branch.branchName}</h3>
                  <p className="text-sm text-muted-foreground">{branch.location}</p>
                  <p className="text-xs text-muted-foreground mt-1">{branch.hotline}</p>
                </div>
                <Badge variant={branch.isActive ? 'default' : 'secondary'}>
                  {branch.isActive ? t('attendance.branch_modal.active') : t('attendance.branch_modal.inactive')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  const canDismiss = !!(error || branches.length === 0);
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Prevent closing unless allowed (no branches or error)
        if (open === false && canDismiss) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (!canDismiss) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!canDismiss) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('attendance.branch_modal.title')}
          </DialogTitle>
          <DialogDescription>{t('attendance.branch_modal.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">{bodyContent}</div>
      </DialogContent>
    </Dialog>
  );
};

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const { t } = useTranslation();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  // Use hook to get staff details
  const { staffDetails, loading: staffLoading, error: staffError } = useStaffDetailsByUserId(loggedInUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const response = await api.post('/users/login', {
      emailOrUsername,
      password
    });

    if (response.data.success) {
      const userData = response.data.data;

      // Extract user from nested structure
      const user = userData.user || userData;

      if (user.role === 'OWNER') {
        onLogin(user);
        toast.success(t('auth.login_success'));
      } else if (user.role === 'STAFF') {
        // Set user ID to trigger staff details fetch
        setLoggedInUserId(user._id);
        setLoggedInUser(user);
      } else {
        toast.error(t('attendance.login.access_denied'));
      }
    } else {
      toast.error(response.data.message || t('auth.login_failed'));
    }

    setIsLoading(false);
  };

  // Handle staff details response
  useEffect(() => {
    if (staffDetails && loggedInUserId && loggedInUser) {
      if (staffDetails.jobTitle === 'Manager') {
        onLogin(loggedInUser);
        toast.success(t('auth.login_success'));
      } else {
        toast.error(t('attendance.login.access_denied'));
      }
      setLoggedInUserId(null); // Reset
      setLoggedInUser(null); // Reset
    } else if (staffError && loggedInUserId) {
      toast.error(t('attendance.login.verify_failed'));
      setLoggedInUserId(null); // Reset
      setLoggedInUser(null); // Reset
    }
  }, [staffDetails, staffError, loggedInUserId, loggedInUser, onLogin, t]);

  // Clear fields whenever modal opens to avoid stale values / browser autofill
  useEffect(() => {
    if (isOpen) {
      setEmailOrUsername('');
      setPassword('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-orange-500" />
            {t('auth.login_title')}
          </DialogTitle>
          <DialogDescription>
            {t('attendance.login.description')}
            <br />
            <span className="text-sm text-muted-foreground">
              • {t('attendance.login.roles.owner')}
              <br />• {t('attendance.login.roles.manager')}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="emailOrUsername" className="block text-sm font-medium mb-2">
              {t('auth.email_or_username')}
            </label>
            <Input
              id="emailOrUsername"
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder={t('auth.placeholder_email_or_username')}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              name="username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              {t('auth.password')}
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.placeholder_password')}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="none"
              name="password"
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || staffLoading} className="flex-1">
              {isLoading || staffLoading ? t('auth.logging_in') : t('auth.login_title')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AttendancePage: React.FC = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [state, setState] = useState<AttendanceState>({
    isLoggedIn: false,
    user: null,
    selectedBranch: null,
    staffUsername: '',
    attendanceRecord: null
  });

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBranchSelectionModal, setShowBranchSelectionModal] = useState(false);

  // Use the attendance-specific hook to get branches only when logged in
  const { branches, loading: branchesLoading, error: branchesError } = useAttendanceBranches(state.isLoggedIn);

  // Use the staff attendance hook
  const { toggleAttendance, loading: attendanceLoading } = useStaffAttendance();

  const handleLogin = (user: User) => {
    setState((prev) => ({
      ...prev,
      isLoggedIn: true,
      user
    }));
    setShowLoginModal(false);
    setShowBranchSelectionModal(true);
  };

  const handleBranchSelect = async (branch: BranchDisplay) => {
    setState((prev) => ({
      ...prev,
      selectedBranch: branch
    }));
    setShowBranchSelectionModal(false);

    // Auto logout after selecting branch but keep branchId
    await logout();
    setState((prev) => ({
      ...prev,
      isLoggedIn: false,
      user: null
    }));
    toast.success(t('attendance.toast.branch_selected_and_logged_out'));
  };

  const handleToggleAttendance = async () => {
    if (!state.staffUsername.trim()) {
      toast.error(t('attendance.error.enter_username'));
      return;
    }

    if (!state.selectedBranch) {
      toast.error(t('attendance.error.select_branch'));
      return;
    }

    const record = await toggleAttendance({
      username: state.staffUsername,
      branchId: state.selectedBranch._id
    });

    setState((prev) => ({ ...prev, attendanceRecord: record }));

    if (record.checkInTime && !record.checkOutTime) {
      toast.success(t('attendance.toast.checkin_success'));
    } else if (record.checkOutTime) {
      toast.success(t('attendance.toast.checkout_success'));
    }
  };

  const getAttendanceStatus = () => {
    if (!state.attendanceRecord) return null;

    if (state.attendanceRecord.checkInTime && !state.attendanceRecord.checkOutTime) {
      return { status: 'checked-in', text: t('attendance.status.checked_in'), color: 'bg-green-500' };
    } else if (state.attendanceRecord.checkOutTime) {
      return { status: 'checked-out', text: t('attendance.status.checked_out'), color: 'bg-blue-500' };
    }
    return null;
  };

  const attendanceStatus = getAttendanceStatus();

  // Resolve role label without nested ternary (Sonar rule S3358)
  let roleLabel = t('attendance.role.selected_branch');
  if (state.user?.role === 'OWNER') {
    roleLabel = t('common.owner');
  } else if (state.user?.role === 'STAFF') {
    roleLabel = t('staff.manager');
  }

  if (!state.isLoggedIn && !state.selectedBranch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-orange-500" />
              {t('attendance.app.title')}
            </CardTitle>
            <CardDescription>{t('attendance.app.login_prompt')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowLoginModal(true)} className="w-full" size="lg">
              <LogIn className="w-4 h-4 mr-2" />
              {t('attendance.login.open_modal_button')}
            </Button>
          </CardContent>
        </Card>

        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-8 h-8 text-orange-500" />
                {t('attendance.app.title')}
              </h1>
              <p className="text-gray-600 mt-1">{t('attendance.app.subtitle', { role: roleLabel })}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                {t('attendance.title')}
              </CardTitle>
              <CardDescription>{t('attendance.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  {t('attendance.selected_branch')}
                </label>
                {state.selectedBranch ? (
                  <Card className="p-4 bg-green-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-green-800">{state.selectedBranch.branchName}</h3>
                        <p className="text-sm text-green-600">{state.selectedBranch.location}</p>
                        {/* <p className="text-xs text-green-500 mt-1">📞 {state.selectedBranch.hotline}</p> */}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {t('common.selected')}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => setShowLoginModal(true)}>
                          {t('attendance.change_branch')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-4 bg-gray-50 border-gray-200">
                    <div className="flex items-center justify-center text-gray-500">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>{t('attendance.no_branch_selected')}</span>
                    </div>
                  </Card>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  {t('attendance.staff_username')}
                </label>
                <Input
                  type="text"
                  value={state.staffUsername}
                  onChange={(e) => setState((prev) => ({ ...prev, staffUsername: e.target.value }))}
                  placeholder={t('attendance.staff_username_placeholder')}
                />
              </div>

              <Button
                onClick={handleToggleAttendance}
                disabled={attendanceLoading || !state.selectedBranch || !state.staffUsername.trim()}
                className="w-full"
                size="lg"
              >
                {attendanceLoading ? (
                  t('common.processing')
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    {t('attendance.check')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {t('attendance.status.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceStatus ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      {t('attendance.status.employee_status', {
                        username: state.staffUsername,
                        status: attendanceStatus.text.toLowerCase()
                      })}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('attendance.status.branch')}:</span>
                      <span className="text-sm font-medium">{state.selectedBranch?.branchName}</span>
                    </div>

                    {state.attendanceRecord?.checkInTime && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{t('attendance.status.checkin')}:</span>
                        <span className="text-sm font-medium">
                          {new Date(state.attendanceRecord.checkInTime).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    )}

                    {state.attendanceRecord?.checkOutTime && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{t('attendance.status.checkout')}:</span>
                        <span className="text-sm font-medium">
                          {new Date(state.attendanceRecord.checkOutTime).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    )}

                    {state.attendanceRecord?.status && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{t('attendance.status.status_label')}:</span>
                        <Badge className={attendanceStatus.color}>
                          {t(`attendance.status.values.${state.attendanceRecord.status}`)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t('attendance.status.empty_title')}</p>
                  <p className="text-sm text-gray-400 mt-1">{t('attendance.status.empty_subtitle')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Branch Selection Modal */}
      <BranchSelectionModal
        isOpen={showBranchSelectionModal}
        onClose={() => setShowBranchSelectionModal(false)}
        onBranchSelect={handleBranchSelect}
        branches={branches}
        loading={branchesLoading}
        error={branchesError}
      />

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
    </div>
  );
};

export default AttendancePage;
