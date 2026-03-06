import { useState, useEffect } from 'react';
import { adminApi, publicApi } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { Calendar, Users, CheckCircle, XCircle, Clock, Phone, Plus, Search, Scissors, Filter } from 'lucide-react';
import { maskPhone } from '../utils/mask';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [barbers, setBarbers] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBarber, setSelectedBarber] = useState('all');
    const [transferData, setTransferData] = useState({ id: null, barberId: '' });
    const [finishModal, setFinishModal] = useState({ id: null, discount_amount: '', is_birthday_reward: false });
    const [showNewApt, setShowNewApt] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newApt, setNewApt] = useState({ client_name: '', client_whatsapp: '', service_id: '', barber_id: '', date: '', time: '', notes: '' });
    const [savingApt, setSavingApt] = useState(false);
    const toast = useToast();

    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : { role: 'admin' };
    const isAdmin = user.role === 'admin';

    useEffect(() => { loadDashboard(); }, [selectedBarber]);

    const loadDashboard = async () => {
        try {
            const [dashboardData, svcData, barbersList] = await Promise.all([
                adminApi.getDashboard({ barberId: selectedBarber !== 'all' ? selectedBarber : undefined }),
                adminApi.getServices(),
                publicApi.getBarbers()
            ]);
            setData(dashboardData);
            setServices(svcData);
            setBarbers(barbersList);
        }
        catch (err) {
            console.error('Erro no Dashboard:', err);
            toast.error('Erro ao carregar dashboard');
        }
        finally { setLoading(false); }
    };

    const updateStatus = async (id, status) => {
        try {
            await adminApi.updateAppointment(id, { status });
            toast.success(`Status atualizado`);
            loadDashboard();
        } catch (err) { toast.error('Erro ao atualizar'); }
    };

    const finishAppointment = async () => {
        if (!finishModal.id) return;
        try {
            await adminApi.updateAppointment(finishModal.id, {
                status: 'completed',
                discount_amount: parseFloat(finishModal.discount_amount) || 0,
                is_birthday_reward: finishModal.is_birthday_reward
            });
            toast.success('Atendimento finalizado!');
            setFinishModal({ id: null, discount_amount: '', is_birthday_reward: false });
            loadDashboard();
        } catch (err) { toast.error('Erro ao finalizar atendimento'); }
    };

    const transferAppointment = async () => {
        if (!transferData.barberId) return toast.error('Selecione um barbeiro');
        try {
            await adminApi.updateAppointment(transferData.id, { barber_id: transferData.barberId });
            toast.success('Agendamento transferido com sucesso');
            setTransferData({ id: null, barberId: '' });
            loadDashboard();
        } catch (err) { toast.error('Erro ao transferir'); }
    };

    const saveNewAppointment = async () => {
        if (!newApt.client_name || !newApt.service_id || !newApt.date || !newApt.time) return toast.error('Preencha os campos obrigatórios');
        setSavingApt(true);
        try {
            await adminApi.createAppointmentAdmin(newApt);
            toast.success('Agendamento criado!');
            setShowNewApt(false);
            setNewApt({ client_name: '', client_whatsapp: '', service_id: '', barber_id: '', date: '', time: '', notes: '' });
            loadDashboard();
        } catch (err) { toast.error('Erro ao criar agendamento'); }
        finally { setSavingApt(false); }
    };

    const statusBadge = (status) => {
        const labels = { confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' };
        return <span className={`badge badge-${status}`} style={{ fontSize: '0.65rem', textTransform: 'uppercase', padding: '2px 6px' }}>{labels[status]}</span>;
    };

    const formatDuration = (min) => {
        if (!min) return '';
        if (min < 60) return `${min}min`;
        const h = Math.floor(min / 60);
        const m = min % 60;
        return m > 0 ? `${h}h${m}` : `${h}h`;
    };

    const openWhatsApp = (phone, name) => {
        const clean = (phone || '').replace(/\D/g, '');
        const full = clean.startsWith('55') ? clean : `55${clean}`;
        window.open(`https://wa.me/${full}?text=Olá, ${name}! Tudo bem? Gostaria de confirmar seu agendamento.`, '_blank');
    };

    const filteredToday = (data?.todayAppointments || []).filter(apt =>
        apt.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <AdminLayout><div className="loading-spinner"><div className="spinner"></div></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="dashboard-container-v2" style={{ paddingBottom: 40 }}>
                {/* Header Simplificado */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>Portal Barbeiro</h1>
                    <button className="btn btn-primary btn-circle" onClick={() => setShowNewApt(true)} title="Novo Agendamento">
                        <Plus size={24} />
                    </button>
                </div>

                {/* Filtro de Barbeiros (Scroll Horizontal no Mobile) */}
                <div className="barber-tabs" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 15, marginBottom: 15, scrollbarWidth: 'none' }}>
                    <button
                        className={`tab-item ${selectedBarber === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedBarber('all')}
                        style={{ padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap', border: '1px solid var(--color-border)', background: selectedBarber === 'all' ? 'var(--color-accent)' : 'transparent', color: selectedBarber === 'all' ? '#000' : '#fff', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                        Todos
                    </button>
                    {barbers.map(b => (
                        <button
                            key={b.id}
                            className={`tab-item ${selectedBarber === b.id.toString() ? 'active' : ''}`}
                            onClick={() => setSelectedBarber(b.id.toString())}
                            style={{ padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap', border: '1px solid var(--color-border)', background: selectedBarber === b.id.toString() ? 'var(--color-accent)' : 'transparent', color: selectedBarber === b.id.toString() ? '#000' : '#fff', fontWeight: 600, fontSize: '0.85rem' }}
                        >
                            {b.name}
                        </button>
                    ))}
                </div>

                {/* Stats Simplificados */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 25 }}>
                    <div className="card glass-card" style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Agendamentos</span>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-accent)', marginTop: 5 }}>{data?.stats?.total || 0}</div>
                    </div>
                    <div className="card glass-card" style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Concluídos</span>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-success)', marginTop: 5 }}>{data?.stats?.completed || 0}</div>
                    </div>
                </div>

                {/* Busca Mobile */}
                <div style={{ marginBottom: 20, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Pesquisar cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: 40, borderRadius: 12, border: '1px solid var(--color-border)', height: 44, fontSize: '0.9rem' }}
                    />
                </div>

                {/* Lista de Agenda de Hoje */}
                <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={18} className="text-secondary" /> Agenda de Hoje
                </h2>

                <div className="agenda-list-compact" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredToday.length > 0 ? filteredToday.map(apt => (
                        <div key={apt.id} className={`card apt-card-v2 ${apt.status}`} style={{ padding: '12px 16px', position: 'relative', borderLeft: '4px solid', borderLeftColor: apt.status === 'completed' ? 'var(--color-success)' : (apt.status === 'cancelled' ? 'var(--color-danger)' : 'var(--color-accent)') }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-accent)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        {apt.time}
                                        {apt.status === 'confirmed' && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent)', marginTop: 4 }}></div>}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{apt.client_name}</h4>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <Scissors size={12} /> {apt.service_name} • {formatDuration(apt.service_duration)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                                    {statusBadge(apt.status)}
                                    {apt.barber_name && <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{apt.barber_name}</span>}
                                </div>
                            </div>

                            {apt.status === 'confirmed' && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button className="btn-icon circle" onClick={() => openWhatsApp(apt.client_whatsapp, apt.client_name)} title="WhatsApp">
                                            <Phone size={16} />
                                        </button>
                                        <button className="btn-icon circle" onClick={() => setTransferData({ id: apt.id, barberId: apt.barber_id || '' })} title="Transferir Barbeiro">
                                            <Users size={16} />
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-sm btn-danger" onClick={() => updateStatus(apt.id, 'cancelled')} style={{ padding: '6px 12px' }}>
                                            <XCircle size={14} /> <span className="desk-only">Zelar</span>
                                        </button>
                                        <button className="btn btn-sm btn-success" onClick={() => setFinishModal({ id: apt.id, discount_amount: '', is_birthday_reward: false })} style={{ padding: '6px 12px' }}>
                                            <CheckCircle size={14} /> Concluir
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="card glass-card" style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.6 }}>
                            <Calendar size={40} style={{ marginBottom: 15, opacity: 0.2 }} />
                            <p>Nenhum agendamento para este filtro hoje.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            {showNewApt && (
                <div className="modal-overlay" onClick={() => setShowNewApt(false)}>
                    <div className="modal animate-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, borderRadius: 24 }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.2rem' }}>Novo Agendamento</h2>
                            <button className="btn-icon" onClick={() => setShowNewApt(false)}><XCircle size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Cliente *</label>
                                <input type="text" className="form-input" value={newApt.client_name} onChange={e => setNewApt({ ...newApt, client_name: e.target.value })} placeholder="Nome..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">WhatsApp</label>
                                <input type="text" className="form-input" value={maskPhone(newApt.client_whatsapp)} onChange={e => setNewApt({ ...newApt, client_whatsapp: e.target.value })} placeholder="(00) 00000-0000" inputMode="numeric" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Serviço *</label>
                                <select className="form-select" value={newApt.service_id} onChange={e => setNewApt({ ...newApt, service_id: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div className="form-group">
                                    <label className="form-label">Data *</label>
                                    <input type="date" className="form-input" value={newApt.date} onChange={e => setNewApt({ ...newApt, date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Hora *</label>
                                    <input type="time" className="form-input" value={newApt.time} onChange={e => setNewApt({ ...newApt, time: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Barbeiro</label>
                                <select className="form-select" value={newApt.barber_id} onChange={e => setNewApt({ ...newApt, barber_id: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ border: 'none' }}>
                            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setShowNewApt(false)}>Cancelar</button>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={saveNewAppointment} disabled={savingApt}>
                                {savingApt ? 'Salvando...' : 'Criar Agendamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {transferData.id && (
                <div className="modal-overlay" onClick={() => setTransferData({ id: null, barberId: '' })}>
                    <div className="modal animate-scale" onClick={e => e.stopPropagation()} style={{ borderRadius: 24 }}>
                        <div className="modal-header">
                            <h2>Transferir Barbeiro</h2>
                            <button className="btn-icon" onClick={() => setTransferData({ id: null, barberId: '' })}><XCircle size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <select className="form-select" value={transferData.barberId} onChange={e => setTransferData({ ...transferData, barberId: e.target.value })}>
                                <option value="">Selecione novo barbeiro...</option>
                                {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="modal-footer" style={{ border: 'none' }}>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={transferAppointment}>Concluir Transferência</button>
                        </div>
                    </div>
                </div>
            )}

            {finishModal.id && (
                <div className="modal-overlay" onClick={() => setFinishModal({ id: null, discount_amount: '', is_birthday_reward: false })}>
                    <div className="modal animate-scale" onClick={e => e.stopPropagation()} style={{ borderRadius: 24, maxWidth: 400 }}>
                        <div className="modal-header">
                            <h2>Finalizar Atendimento</h2>
                            <button className="btn-icon" onClick={() => setFinishModal({ id: null, discount_amount: '', is_birthday_reward: false })}><XCircle size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Desconto aplicado (R$)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={finishModal.discount_amount}
                                    onChange={e => setFinishModal({ ...finishModal, discount_amount: e.target.value })}
                                    placeholder="0,00"
                                    inputMode="numeric"
                                />
                            </div>
                            <label className="flex-center" style={{ gap: 10, cursor: 'pointer', justifyContent: 'flex-start', marginTop: 15 }}>
                                <input
                                    type="checkbox"
                                    checked={finishModal.is_birthday_reward}
                                    onChange={e => setFinishModal({ ...finishModal, is_birthday_reward: e.target.checked })}
                                    style={{ width: 18, height: 18 }}
                                />
                                <span style={{ fontSize: '0.9rem' }}>Cortesia de Aniversário</span>
                            </label>
                        </div>
                        <div className="modal-footer" style={{ border: 'none' }}>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={finishAppointment}>Confirmar e Finalizar</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
