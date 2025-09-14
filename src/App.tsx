import './index.css';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes/AppRoutes';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { BranchProvider } from './contexts/BranchContext';
import { Toast } from '@/components/ui/toast';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <LanguageProvider>
        <AuthProvider>
          <BranchProvider>
            <BrowserRouter>
              <AppRoutes />
              <Toast />
            </BrowserRouter>
          </BranchProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
