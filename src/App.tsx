import './index.css';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes/AppRoutes';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
