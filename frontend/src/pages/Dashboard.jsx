import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { Calendar, Users, CheckCircle, XCircle, Clock, Phone, ChevronRight, DollarSign, Package, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : { role: 'admin' };
    const isAdmin = user.role === 'admin';

    useEffect(() => { loadDashboard(); }, []);

    const loadDashboard = async () => {
        try { setData(await adminApi.getDashboard()); }
        catch (err) { toast.error('Erro ao carregar dashboard'); }
        finally { setLoading(false); }
    };

    const updateStatus = async (id, status) => {
        try { await adminApi.updateAppointment(id, { status }); toast.success(`Status: ${statusLabels[status]}`); loadDashboard(); }
        catch (err) { toast.error('Erro ao atualizar'); }
    };

    const statusLabels = { confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' };
    const statusBadge = (status) => <span className={`badge badge-${status}`}>{statusLabels[status] || status}</span>;
    const formatPrice = (p) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p || 0);
    const formatDateBR = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
    const formatDuration = (min) => { if (!min) return ''; if (min < 60) return `${min}min`; const h = Math.floor(min / 60); const m = min % 60; return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`; };

    const openWhatsApp = (phone, name) => {
        const clean = phone.replace(/\D/g, '');
        const full = clean.startsWith('55') ? clean : `55${clean}`;
        window.open(`https://wa.me/${full}?text=Olá, ${name}! Sobre seu agendamento na BarberPro.`, '_blank');
    };

    if (loading) return <AdminLayout><div className="loading-spinner"><div className="spinner"></div></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="section-header-admin">
                <div>
                    <h1>Dashboard</h1>
                    <p className="text-secondary">Visão geral do seu dia</p>
                </div>
                <div className="admin-header-actions">
                    <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
                        <Calendar size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            <div className="stats-grid">
                <div className="card stat-card">
                    <div className="stat-icon blue"><Calendar size={24} /></div>
                    <div className="stat-info"><h3>{data?.stats?.total || 0}</h3><p>Agendamentos Hoje</p></div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon green"><CheckCircle size={24} /></div>
                    <div className="stat-info"><h3>{data?.stats?.completed || 0}</h3><p>Concluídos</p></div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon gold"><DollarSign size={24} /></div>
                    <div className="stat-info">
                        <h3>{isAdmin ? formatPrice(data?.stats?.revenue) : formatPrice(data?.todayAppointments?.reduce((acc, apt) => acc + (apt.service_price * (user.commission_rate || 0) / 100), 0))}</h3>
                        <p>{isAdmin ? 'Faturamento Hoje' : 'Minha Comissão Hoje'}</p>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon blue"><Users size={24} /></div>
                    <div className="stat-info"><h3>{data?.stats?.totalClients || 0}</h3><p>Total de Clientes</p></div>
                </div>
            </div>

            {data?.stats?.lowStock > 0 && (
                <div style={{ padding: '14px 20px', background: 'var(--color-warning-bg)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-warning)' }}>
                    <AlertTriangle size={20} />
                    <span><strong>{data.stats.lowStock} produto(s)</strong> com estoque baixo. <a href="/admin/stock" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>Ver estoque →</a></span>
                </div>
            )}

            <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={22} className="text-accent" /> Agendamentos de Hoje
                </h2>
                {data?.todayAppointments?.length > 0 ? (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="table-header" style={{ display: 'grid', gridTemplateColumns: isAdmin ? '80px 1fr 1fr 1fr 100px 80px 120px' : '80px 1.5fr 1.5fr 100px 100px 120px', padding: '15px 24px', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                            <div>HR</div>
                            <div>CLIENTE</div>
                            <div>SERVIÇO</div>
                            {isAdmin && <div>BARBEIRO</div>}
                            <div style={{ textAlign: 'center' }}>STATUS</div>
                            <div style={{ textAlign: 'center' }}>VALOR</div>
                            <div style={{ textAlign: 'right' }}>AÇÕES</div>
                        </div>
                        {data.todayAppointments.map(apt => (
                            <div key={apt.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: isAdmin ? '80px 1fr 1fr 1fr 100px 80px 120px' : '80px 1.5fr 1.5fr 100px 100px 120px', padding: '15px 24px', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                <div className="appointment-time">
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{apt.time}</div>
                                    {apt.end_time && <div className="text-secondary" style={{ fontSize: '0.75rem' }}>até {apt.end_time}</div>}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{apt.client_name}</h4>
                                    <p style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, margin: 0, fontSize: '0.85rem', color: 'var(--color-accent)' }} onClick={() => openWhatsApp(apt.client_whatsapp, apt.client_name)} title="WhatsApp">
                                        <Phone size={12} /> {apt.client_whatsapp}
                                    </p>
                                </div>
                                <div className="appointment-service">
                                    <div style={{ fontWeight: 500 }}>{apt.service_name}</div>
                                    <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{formatDuration(apt.service_duration)}</div>
                                </div>
                                {isAdmin && (
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-accent)' }}>
                                        {apt.barber_name || 'Nenhum'}
                                    </div>
                                )}
                                <div style={{ textAlign: 'center' }}>{statusBadge(apt.status)}</div>
                                <div style={{ fontWeight: 700, textAlign: 'center', color: 'var(--color-primary-text)' }}>{formatPrice(apt.service_price)}</div>
                                <div className="flex-center" style={{ justifyContent: 'flex-end', gap: 6 }}>
                                    {apt.status === 'confirmed' && (
                                        <>
                                            <button className="btn btn-success btn-sm" style={{ padding: '6px' }} onClick={() => updateStatus(apt.id, 'completed')} title="Concluir"><CheckCircle size={16} /></button>
                                            <button className="btn btn-danger btn-sm" style={{ padding: '6px' }} onClick={() => updateStatus(apt.id, 'cancelled')} title="Cancelar"><XCircle size={16} /></button>
                                        </>
                                    )}
                                    {apt.status === 'cancelled' && <button className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }} onClick={() => updateStatus(apt.id, 'confirmed')}>Reconfirmar</button>}
                                    {apt.status === 'completed' && <span className="text-secondary" style={{ fontSize: '0.8rem' }}>✓ Feito</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card empty-state">
                        <Calendar size={48} /><h3>Nenhum agendamento hoje</h3><p>Seus agendamentos aparecerão aqui</p>
                    </div>
                )}
            </div>

            {data?.upcomingAppointments?.length > 0 && (
                <div>
                    <h2 style={{ fontSize: '1.3rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ChevronRight size={22} className="text-accent" /> Próximos Agendamentos
                    </h2>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="table-header" style={{ display: 'grid', gridTemplateColumns: isAdmin ? '80px 1fr 1fr 1fr 100px 80px 120px' : '80px 1.5fr 1.5fr 100px 100px 120px', padding: '15px 24px', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                            <div>HR</div>
                            <div>CLIENTE</div>
                            <div>SERVIÇO</div>
                            {isAdmin && <div>BARBEIRO</div>}
                            <div style={{ textAlign: 'center' }}>STATUS</div>
                            <div style={{ textAlign: 'center' }}>VALOR</div>
                            <div style={{ textAlign: 'right' }}>AÇÕES</div>
                        </div>
                        {data.upcomingAppointments.map(apt => (
                            <div key={apt.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: isAdmin ? '80px 1fr 1fr 1fr 100px 80px 120px' : '80px 1.5fr 1.5fr 100px 100px 120px', padding: '15px 24px', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                <div className="appointment-time">
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{apt.time}</div>
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{apt.client_name}</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        📅 {formatDateBR(apt.date)}
                                    </p>
                                </div>
                                <div className="appointment-service">
                                    <div style={{ fontWeight: 500 }}>{apt.service_name}</div>
                                    <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{formatDuration(apt.service_duration)}</div>
                                </div>
                                {isAdmin && (
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-accent)' }}>
                                        {apt.barber_name || '-'}
                                    </div>
                                )}
                                <div style={{ textAlign: 'center' }}>{statusBadge(apt.status)}</div>
                                <div style={{ fontWeight: 700, textAlign: 'center' }}>{formatPrice(apt.service_price)}</div>
                                <div className="flex-center" style={{ justifyContent: 'flex-end', gap: 6 }}>
                                    <button className="btn btn-danger btn-sm" style={{ padding: '6px' }} onClick={() => updateStatus(apt.id, 'cancelled')} title="Cancelar"><XCircle size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
