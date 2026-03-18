import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './components/ThemeProvider';
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
import Backup from './pages/Backup';


function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider>
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
          <Route path="/admin/backup" element={<ProtectedRoute><Backup /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
