import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { useEffect } from 'react';
import { publicApi, BASE_URL } from './api';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Schedule from './pages/Schedule';
import Financial from './pages/Financial';
import Clients from './pages/Clients';
import Stock from './pages/Stock';
import SiteConfig from './pages/SiteConfig';
import Developer from './pages/Developer';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  useEffect(() => {
    publicApi.getSiteConfig().then(config => {
      // Aplicar Tema global baseado no slug salvo (ex: "dark-gold")
      const themeSlugs = ['dark-gold', 'dark-purple', 'dark-grey', 'light-clean', 'sophisticated-blue'];
      const themeClasses = themeSlugs.map(slug => `theme-${slug}`);
      document.body.classList.remove(...themeClasses);
      if (config.site_theme && themeSlugs.includes(config.site_theme)) {
        document.body.classList.add(`theme-${config.site_theme}`);
      } else {
        document.body.classList.add('theme-dark-gold');
      }

      // Aplicar Background Fixo
      if (config.site_background) {
        document.body.style.backgroundImage = `url(${BASE_URL}${config.site_background})`;
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
      } else {
        document.body.style.backgroundImage = 'none';
      }
    }).catch(console.error);
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/developer" element={<Developer />} />
          <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
          <Route path="/admin/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
          <Route path="/admin/financial" element={<ProtectedRoute><Financial /></ProtectedRoute>} />
          <Route path="/admin/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/admin/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
          <Route path="/admin/site-config" element={<ProtectedRoute><SiteConfig /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
