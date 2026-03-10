import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Scissors, Settings, LogOut, Users, Package, Palette, Menu, DollarSign, Star, Bell, X } from 'lucide-react';
import { publicApi, adminApi, BASE_URL } from '../api';

// Toca um beep suave de notificação via Web Audio API
function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    } catch (e) { console.warn('Audio não suportado:', e); }
}

export default function AdminLayout({ children }) {
    const navigate = useNavigate();
    const [siteConfig, setSiteConfig] = useState({});
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Notificações de novos agendamentos
    const [newAptNotifs, setNewAptNotifs] = useState([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [notifEnabled, setNotifEnabled] = useState(true);
    const lastSeenAptId = useRef(parseInt(localStorage.getItem('lastSeenAptId') || '0'));
    const notifPanelRef = useRef();

    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : { role: 'admin' };
    const isAdmin = user.role === 'admin';

    useEffect(() => {
        publicApi.getSiteConfig().then(cfg => {
            setSiteConfig(cfg);
            // Lê configuração de notificação
            const notifSetting = cfg.appointment_notifications;
            setNotifEnabled(notifSetting !== 'false' && notifSetting !== '0');
        }).catch(console.error);

        if (isAdmin) {
            adminApi.getUnreadReviewsCount().then(res => setUnreadCount(res.count)).catch(console.error);
            const reviewInterval = setInterval(() => {
                adminApi.getUnreadReviewsCount().then(res => setUnreadCount(res.count)).catch(console.error);
            }, 60000);
            return () => clearInterval(reviewInterval);
        }
    }, [isAdmin]);

    // Polling de novos agendamentos a cada 30s
    useEffect(() => {
        if (!notifEnabled) return;

        const checkNewAppointments = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const apts = await adminApi.getAppointments({ date: today, status: 'confirmed' });
                if (!Array.isArray(apts) || apts.length === 0) return;

                const latestId = Math.max(...apts.map(a => a.id));
                const knownId = lastSeenAptId.current;

                if (latestId > knownId) {
                    const newOnes = apts.filter(a => a.id > knownId);
                    if (newOnes.length > 0 && knownId > 0) {
                        // Há novos agendamentos desde a última vez
                        setNewAptNotifs(prev => [
                            ...newOnes.map(a => ({
                                id: a.id,
                                message: `Novo agendamento: ${a.client_name}`,
                                detail: `${a.service_name} às ${a.time}`,
                                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                read: false
                            })),
                            ...prev.slice(0, 19)
                        ]);
                        setShowNotifPanel(true);
                        playNotificationSound();
                    }
                    lastSeenAptId.current = latestId;
                    localStorage.setItem('lastSeenAptId', String(latestId));
                }
            } catch (e) { console.warn('Erro ao checar agendamentos:', e); }
        };

        // Roda imediatamente na primeira vez para "calibrar" o ID base
        checkNewAppointments();
        const interval = setInterval(checkNewAppointments, 30000);
        return () => clearInterval(interval);
    }, [notifEnabled]);

    // Fecha painel ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
                setShowNotifPanel(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadNotifs = newAptNotifs.filter(n => !n.read).length;

    const markAllRead = () => {
        setNewAptNotifs(prev => prev.map(n => ({ ...n, read: true })));
    };

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
            <button className="mobile-menu-btn" onClick={toggleSidebar}
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, color: 'var(--color-accent)', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                <Menu size={22} />
            </button>

            <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>

            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="admin-logo" style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '20px' }}>
                    <style>{`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Montserrat:wght@900&display=swap');`}</style>
                    {siteConfig.site_logo && (
                        <img src={`${BASE_URL}${siteConfig.site_logo}`} alt="Logo" style={{ maxHeight: 50, width: 'auto', display: 'block' }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
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
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800 }}>
                            {user.name?.charAt(0) || 'A'}
                        </div>
                        <div style={{ fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: 700 }}>{user.name}</div>
                            <div style={{ opacity: 0.6 }}>{user.role}</div>
                        </div>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}><LogOut size={20} /> Sair do Painel</button>
            </aside>

            <main className="admin-content">
                {/* Barra Superior com Sino */}
                {notifEnabled && (
                    <div ref={notifPanelRef} style={{ position: 'fixed', top: 16, right: 20, zIndex: 900 }}>
                        {/* Botão Sino */}
                        <button onClick={() => { setShowNotifPanel(v => !v); markAllRead(); }}
                            style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', transition: 'all 0.2s' }}>
                            <Bell size={18} color={unreadNotifs > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)'}
                                style={{ animation: unreadNotifs > 0 ? 'bellRing 1s ease infinite' : 'none' }} />
                            {unreadNotifs > 0 && (
                                <span style={{ position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-primary)' }}>
                                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                                </span>
                            )}
                        </button>

                        {/* Painel de Notificações */}
                        {showNotifPanel && (
                            <div style={{ position: 'absolute', top: 50, right: 0, width: 320, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.8)', overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Bell size={15} className="text-accent" /> Notificações
                                    </h4>
                                    <button onClick={() => setShowNotifPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                                    {newAptNotifs.length > 0 ? newAptNotifs.map((n, i) => (
                                        <div key={`${n.id}-${i}`} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: !n.read ? 'rgba(212,165,72,0.06)' : 'transparent', transition: 'background 0.2s' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>📅 {n.message}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{n.detail}</div>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: 10, marginTop: 2 }}>{n.time}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                            <Bell size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
                                            <p>Sem notificações recentes</p>
                                        </div>
                                    )}
                                </div>
                                {newAptNotifs.length > 0 && (
                                    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)' }}>
                                        <button onClick={() => setNewAptNotifs([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.8rem', width: '100%', textAlign: 'center' }}>
                                            Limpar todas
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {children}
            </main>

            <style>{`
                @keyframes bellRing {
                    0%, 100% { transform: rotate(0); }
                    10% { transform: rotate(-10deg); }
                    30% { transform: rotate(10deg); }
                    50% { transform: rotate(-8deg); }
                    70% { transform: rotate(8deg); }
                    90% { transform: rotate(-4deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .btn-primary-circle {
                    border-radius: 50% !important;
                    width: 42px; height: 42px; padding: 0;
                }
            `}</style>
        </div>
    );
}
