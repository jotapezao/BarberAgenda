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
import Barbers from './pages/Barbers';
import Security from './pages/Security';
import Developer from './pages/Developer';
import Reviews from './pages/Reviews';
import Booking from './pages/Booking';


function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  useEffect(() => {
    publicApi.getSiteConfig().then(config => {
      // 1. Aplicar Tema e Nome
      const validThemes = ['theme-dark-gold', 'theme-dark-purple', 'theme-dark-grey', 'theme-light-clean', 'theme-sophisticated-blue', 'theme-ruby-red', 'theme-emerald-green', 'theme-neon-cyberpunk'];
      document.body.classList.remove(...validThemes);
      if (config.site_theme && validThemes.includes(config.site_theme)) {
        document.body.classList.add(config.site_theme);
      } else {
        document.body.classList.add('theme-dark-gold');
      }

      const siteName = config.site_name || 'BarberPro';
      document.title = `${siteName} | Barbearia Premium`;

      // 2. Favicon e Meta Imagem Dinâmicos
      if (config.site_logo) {
        const logoUrl = `${BASE_URL}${config.site_logo}`;
        const favicon = document.getElementById('favicon');
        if (favicon) favicon.href = logoUrl;

        const ogImage = document.getElementById('og-image');
        if (ogImage) ogImage.setAttribute('content', logoUrl);
      }

      // 3. Aplicar Background Fixo
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
          <Route path="/booking" element={<Booking />} />
          <Route path="/developer" element={<Developer />} />

          <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
          <Route path="/admin/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
          <Route path="/admin/financial" element={<ProtectedRoute><Financial /></ProtectedRoute>} />
          <Route path="/admin/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/admin/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
          <Route path="/admin/site-config" element={<ProtectedRoute><SiteConfig /></ProtectedRoute>} />
          <Route path="/admin/barbers" element={<ProtectedRoute><Barbers /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
          <Route path="/admin/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
