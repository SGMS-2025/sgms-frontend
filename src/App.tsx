import './index.css';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes/AppRoutes';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { BranchProvider } from './contexts/BranchContext';
import { SocketProvider } from './contexts/SocketContext';
import { Toast } from '@/components/ui/toast';
import NavigationHandler from '@/components/navigation/NavigationHandler';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <LanguageProvider>
        <AuthProvider>
          <BranchProvider>
            <SocketProvider>
              <BrowserRouter>
                <NavigationHandler />
                <AppRoutes />
                <Toast />
              </BrowserRouter>
            </SocketProvider>
          </BranchProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
