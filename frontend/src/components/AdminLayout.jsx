import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Scissors, Settings, LogOut, Users, Package, Palette, Menu, DollarSign } from 'lucide-react';
import { publicApi, BASE_URL } from '../api';

export default function AdminLayout({ children }) {
    const navigate = useNavigate();
    const [siteConfig, setSiteConfig] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : { role: 'admin' };
    const isAdmin = user.role === 'admin';

    useEffect(() => {
        publicApi.getSiteConfig().then(setSiteConfig).catch(console.error);
    }, []);

    const handleLogout = () => {
        if (!window.confirm('Deseja realmente sair?')) return;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="admin-container">
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
                <Menu size={24} />
            </button>
            <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={closeSidebar}></div>
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="admin-logo">
                    {siteConfig.site_logo ? (
                        <img src={`${BASE_URL}${siteConfig.site_logo}`} alt="Logo" style={{ maxHeight: 50, width: 'auto', display: 'block' }} />
                    ) : (
                        <>{siteConfig.site_name || 'Admin'}</>
                    )}
                </div>
                <nav className="admin-nav">
                    <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><LayoutDashboard size={20} /> Dashboard</NavLink>
                    <NavLink to="/admin/schedule" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Calendar size={20} /> Agendamentos</NavLink>
                    <NavLink to="/admin/financial" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><DollarSign size={20} /> Financeiro</NavLink>
                    {isAdmin && (
                        <>
                            <NavLink to="/admin/services" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Scissors size={20} /> Serviços</NavLink>
                            <NavLink to="/admin/barbers" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Users size={20} /> Barbeiros</NavLink>
                            <NavLink to="/admin/clients" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Users size={20} /> Clientes</NavLink>
                            <NavLink to="/admin/stock" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Package size={20} /> Estoque</NavLink>
                            <NavLink to="/admin/site-config" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Palette size={20} /> Personalizar Site</NavLink>
                        </>
                    )}
                </nav>
                <button className="logout-btn" onClick={handleLogout}><LogOut size={20} /> Sair do Painel</button>
            </aside>
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}
