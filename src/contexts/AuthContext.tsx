import { createContext, useReducer, useContext, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types/api/User';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

export type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN'; payload: { user: User } }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE'; payload: { user: User | null } }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'LOGIN':
      return {
        isAuthenticated: true,
        user: action.payload.user,
        isLoading: false
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false
      };
    case 'RESTORE':
      return {
        isAuthenticated: !!action.payload.user,
        user: action.payload.user,
        isLoading: false
      };
    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore user from localStorage when the app starts
  useEffect(() => {
    const restoreAuth = () => {
      try {
        const userStr = localStorage.getItem('user');
        let user = null;
        if (userStr) {
          try {
            user = JSON.parse(userStr);
          } catch (error) {
            console.error('Error parsing user from localStorage:', error);
          }
        }
        dispatch({ type: 'RESTORE', payload: { user } });
      } catch (error) {
        console.error('Error restoring auth:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    // Only run once on mount
    restoreAuth();
  }, []);

  const login = useCallback((user: User) => {
    // Save user to localStorage
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({
      type: 'LOGIN',
      payload: { user }
    });
    console.log('Login successful:', { user });
  }, []);

  const logout = useCallback(() => {
    // Remove user from localStorage
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
    console.log('Logout successful');
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      state,
      login,
      logout
    }),
    [state, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
