import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Scissors, Settings, LogOut, Users, Package, Palette, Menu, DollarSign, Star, Bell } from 'lucide-react';
import { publicApi, adminApi, BASE_URL } from '../api';

export default function AdminLayout({ children }) {
    const navigate = useNavigate();
    const [siteConfig, setSiteConfig] = useState({});
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : { role: 'admin' };
    const isAdmin = user.role === 'admin';

    useEffect(() => {
        publicApi.getSiteConfig().then(setSiteConfig).catch(console.error);
        if (isAdmin) {
            adminApi.getUnreadReviewsCount().then(res => setUnreadCount(res.count)).catch(console.error);
            const interval = setInterval(() => {
                adminApi.getUnreadReviewsCount().then(res => setUnreadCount(res.count)).catch(console.error);
            }, 60000);
            return () => clearInterval(interval);
        }
    }, [isAdmin]);

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
            <button
                className="mobile-menu-btn"
                onClick={toggleSidebar}
                style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    color: 'var(--color-accent)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.5)'
                }}
            >
                <Menu size={22} />
            </button>
            <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="admin-logo" style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '20px' }}>
                    <style>
                        {`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Montserrat:wght@900&display=swap');`}
                    </style>
                    {siteConfig.site_logo && (
                        <img src={`${BASE_URL}${siteConfig.site_logo}`} alt="Logo" style={{ maxHeight: 50, width: 'auto', display: 'block' }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                        <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.4rem', color: '#fff', transform: 'rotate(-5deg)', marginBottom: '-8px', position: 'relative', zIndex: 2 }}>
                            Painel do Barbeiro
                        </span>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.4rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                            {siteConfig.site_name || 'ADMIN'}
                        </span>
                    </div>
                </div>
                <nav className="admin-nav">
                    <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Calendar size={20} /> Agenda</NavLink>
                    <NavLink to="/admin/schedule" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Settings size={20} /> Sistema - Horário</NavLink>
                    <NavLink to="/admin/financial" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><DollarSign size={20} /> Financeiro</NavLink>
                    {isAdmin && (
                        <>
                            <NavLink to="/admin/services" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Scissors size={20} /> Serviços</NavLink>
                            <NavLink to="/admin/barbers" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Users size={20} /> Barbeiros</NavLink>
                            <NavLink to="/admin/clients" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Users size={20} /> Clientes</NavLink>
                            <NavLink to="/admin/stock" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Package size={20} /> Estoque</NavLink>
                            <NavLink to="/admin/reviews" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Star size={20} /> Avaliações</div>
                                {unreadCount > 0 && <span className="badge-notification">{unreadCount}</span>}
                            </NavLink>
                            <NavLink to="/admin/site-config" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Palette size={20} /> Personalizar Site</NavLink>
                            <NavLink to="/admin/security" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}><Settings size={20} /> Segurança</NavLink>
                        </>
                    )}
                </nav>
                <div style={{ padding: '0 20px', marginBottom: 20 }}>
                    <div className="admin-user-info" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800 }}>{user.name?.charAt(0) || 'A'}</div>
                        <div style={{ fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: 700 }}>{user.name}</div>
                            <div style={{ opacity: 0.6 }}>{user.role}</div>
                        </div>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}><LogOut size={20} /> Sair do Painel</button>
            </aside>
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}
