import { useAuth } from '@/contexts/AuthContext';

// Helper hooks
export const useAuthState = () => {
  const { state } = useAuth();
  return state;
};

export const useUser = () => {
  const { state } = useAuth();
  return state.user;
};

export const useIsAuthenticated = () => {
  const { state } = useAuth();
  return state.isAuthenticated;
};

export const useAuthActions = () => {
  const { login, updateUser, logout } = useAuth();
  return { login, updateUser, logout };
};
