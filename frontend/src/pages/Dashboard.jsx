import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { Calendar, Users, CheckCircle, XCircle, Clock, Phone, ChevronRight, DollarSign, Package, Plus, Gift, LayoutDashboard, Search, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [barbers, setBarbers] = useState([]);
    const [services, setServices] = useState([]);
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transferData, setTransferData] = useState({ id: null, barberId: '' });
    const [showNewApt, setShowNewApt] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newApt, setNewApt] = useState({ client_name: '', client_whatsapp: '', service_id: '', barber_id: '', date: '', time: '', notes: '' });
    const [savingApt, setSavingApt] = useState(false);
    const toast = useToast();

    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : { role: 'admin' };
    const isAdmin = user.role === 'admin';

    useEffect(() => { loadDashboard(); }, []);

    const loadDashboard = async () => {
        try {
            const curMonth = new Date().toISOString().substring(5, 7);
            const [dashboardData, barbersData, svcData, bdData] = await Promise.all([
                adminApi.getDashboard(),
                adminApi.getBarbers(),
                adminApi.getServices(),
                adminApi.getBirthdays(curMonth),
            ]);
            setData(dashboardData);
            setBarbers(barbersData);
            setServices(svcData);
            setBirthdays(bdData);
        }
        catch (err) { toast.error('Erro ao carregar dashboard'); }
        finally { setLoading(false); }
    };

    const updateStatus = async (id, status) => {
        try { await adminApi.updateAppointment(id, { status }); toast.success(`Status atualizado`); loadDashboard(); }
        catch (err) { toast.error('Erro ao atualizar'); }
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
        if (!newApt.client_name || !newApt.service_id || !newApt.date || !newApt.time) return toast.error('Preencha todos os campos obrigatórios');
        setSavingApt(true);
        try {
            await adminApi.createAppointmentAdmin(newApt);
            toast.success('Agendamento criado com sucesso!');
            setShowNewApt(false);
            setNewApt({ client_name: '', client_whatsapp: '', service_id: '', barber_id: '', date: '', time: '', notes: '' });
            loadDashboard();
        } catch (err) { toast.error(err.message || 'Erro ao criar agendamento'); }
        finally { setSavingApt(false); }
    };

    const statusLabels = { confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' };
    const statusBadge = (status) => <span className={`badge badge-${status}`}>{statusLabels[status] || status}</span>;
    const formatPrice = (p) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p || 0);
    const formatDateBR = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
    const formatDuration = (min) => { if (!min) return ''; if (min < 60) return `${min}min`; const h = Math.floor(min / 60); const m = min % 60; return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`; };

    const openWhatsApp = (phone, name) => {
        if (!phone) return;
        const clean = phone.replace(/\D/g, '');
        const full = clean.startsWith('55') ? clean : `55${clean}`;
        window.open(`https://wa.me/${full}?text=Olá, ${name}! Sobre seu agendamento na BarberPro.`, '_blank');
    };

    const filteredToday = (data?.todayAppointments || []).filter(apt =>
        apt.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUpcoming = (data?.upcomingAppointments || []).filter(apt =>
        apt.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <AdminLayout><div className="loading-spinner"><div className="spinner"></div></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="section-header-admin">
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Dashboard</h1>
                        <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem' }}>Gerencie suas atividades e acompanhe o desempenho</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="search-box desk-only" style={{ position: 'relative', width: 250 }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: 40, height: 40, fontSize: '0.85rem' }}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowNewApt(true)}>
                        <Plus size={18} /> Novo Agendamento
                    </button>
                </div>
            </div>

            {/* Mobile Search */}
            <div className="mobile-only" style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: 40, height: 44 }}
                    />
                </div>
            </div>

            <div className="dashboard-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, alignItems: 'start' }}>
                <div className="dashboard-main-col" style={{ minWidth: 0 }}>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 24 }}>
                        <div className="card stat-card">
                            <div className="stat-icon blue"><Calendar size={24} /></div>
                            <div className="stat-info"><h3>{data?.stats?.total || 0}</h3><p>Agenda Hoje</p></div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-icon green"><CheckCircle size={24} /></div>
                            <div className="stat-info"><h3>{data?.stats?.completed || 0}</h3><p>Concluídos</p></div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-icon gold"><DollarSign size={24} /></div>
                            <div className="stat-info">
                                <h3>{isAdmin ? formatPrice(data?.stats?.revenue) : formatPrice(data?.todayAppointments?.reduce((acc, apt) => (apt.status === 'completed' ? acc + (apt.service_price * (user.commission_rate || 0) / 100) : acc), 0))}</h3>
                                <p>{isAdmin ? 'Faturamento Hoje' : 'Minha Comissão'}</p>
                            </div>
                        </div>
                    </div>

                    {data?.stats?.lowStock > 0 && (
                        <div style={{ padding: '14px 20px', background: 'var(--color-warning-bg)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-warning)' }}>
                            <AlertTriangle size={20} />
                            <span style={{ fontSize: '0.9rem' }}><strong>{data.stats.lowStock} produto(s)</strong> com estoque baixo. <a href="/admin/stock" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>Ver estoque →</a></span>
                        </div>
                    )}

                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Clock size={20} className="text-secondary" /> Agenda de Hoje
                            </h2>
                        </div>
                        {filteredToday.length > 0 ? (
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div className={`table-header appointment-grid ${isAdmin ? 'admin-grid' : 'barber-grid'}`}>
                                    <div>HR</div>
                                    <div>CLIENTE</div>
                                    <div>SERVIÇO</div>
                                    {isAdmin && <div>BARBEIRO</div>}
                                    <div style={{ textAlign: 'center' }}>STATUS</div>
                                    <div style={{ textAlign: 'right' }}>AÇÕES</div>
                                </div>
                                {filteredToday.map(apt => (
                                    <div key={apt.id} className={`table-row appointment-grid ${isAdmin ? 'admin-grid' : 'barber-grid'}`}>
                                        <div className="appointment-time">
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{apt.time}</div>
                                            {apt.end_time && <div className="text-secondary" style={{ fontSize: '0.7rem' }}>{apt.end_time}</div>}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{apt.client_name}</h4>
                                            <p style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-accent)' }} onClick={() => openWhatsApp(apt.client_whatsapp, apt.client_name)}>
                                                <Phone size={10} /> {apt.client_whatsapp}
                                            </p>
                                        </div>
                                        <div className="appointment-service">
                                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{apt.service_name}</div>
                                            <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{formatDuration(apt.service_duration)} {isAdmin && `• ${formatPrice(apt.service_price)}`}</div>
                                        </div>
                                        {isAdmin && (
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                {apt.barber_name?.split(' ')[0] || '-'}
                                            </div>
                                        )}
                                        <div style={{ textAlign: 'center' }}>{statusBadge(apt.status)}</div>
                                        <div className="flex-center" style={{ justifyContent: 'flex-end', gap: 6 }}>
                                            {apt.status === 'confirmed' && (
                                                <>
                                                    <button className="btn btn-success btn-sm" style={{ padding: '5px' }} onClick={() => updateStatus(apt.id, 'completed')} title="Concluir"><CheckCircle size={14} /></button>
                                                    <button className="btn btn-secondary btn-sm" style={{ padding: '5px' }} onClick={() => setTransferData({ id: apt.id, barberId: apt.barber_id || '' })} title="Transferir"><Users size={14} /></button>
                                                    <button className="btn btn-danger btn-sm" style={{ padding: '5px' }} onClick={() => updateStatus(apt.id, 'cancelled')} title="Cancelar"><XCircle size={14} /></button>
                                                </>
                                            )}
                                            {apt.status === 'cancelled' && <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(apt.id, 'confirmed')} style={{ fontSize: '0.75rem' }}>Reabrir</button>}
                                            {apt.status === 'completed' && <CheckCircle size={16} className="text-success" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card empty-state" style={{ padding: '40px 20px' }}>
                                <Calendar size={40} className="text-secondary" style={{ opacity: 0.3, marginBottom: 12 }} />
                                <h3 style={{ fontSize: '1.1rem' }}>Tudo tranquilo por aqui</h3>
                                <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Nenhum agendamento {searchTerm ? 'encontrado com esse nome' : 'para hoje'}.</p>
                                {!searchTerm && <button className="btn btn-outline btn-sm" style={{ marginTop: 15 }} onClick={() => setShowNewApt(true)}>Agendar agora</button>}
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Calendar size={20} className="text-secondary" /> Próximos Atendimentos
                            </h2>
                            <a href="/admin/schedule" className="text-accent" style={{ fontSize: '0.9rem' }}>Ver agenda completa →</a>
                        </div>
                        {filteredUpcoming.length > 0 ? (
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div className={`table-header appointment-grid ${isAdmin ? 'admin-grid' : 'barber-grid'}`}>
                                    <div>DATA/HR</div>
                                    <div>CLIENTE</div>
                                    <div>SERVIÇO</div>
                                    <div style={{ textAlign: 'right' }}>AÇÕES</div>
                                </div>
                                {filteredUpcoming.slice(0, 5).map(apt => (
                                    <div key={apt.id} className={`table-row appointment-grid ${isAdmin ? 'admin-grid' : 'barber-grid'}`}>
                                        <div className="appointment-time">
                                            <div style={{ fontWeight: 700 }}>{formatDateBR(apt.date)}</div>
                                            <div className="text-secondary" style={{ fontSize: '0.8rem' }}>às {apt.time}</div>
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{apt.client_name}</h4>
                                            {isAdmin && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{apt.barber_name}</p>}
                                        </div>
                                        <div className="appointment-service">
                                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{apt.service_name}</div>
                                            <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{formatPrice(apt.service_price)}</div>
                                        </div>
                                        <div className="flex-center" style={{ justifyContent: 'flex-end' }}>
                                            <button className="btn btn-danger btn-sm" style={{ padding: '5px' }} onClick={() => updateStatus(apt.id, 'cancelled')}><XCircle size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                {filteredUpcoming.length > 5 && (
                                    <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                        <p className="text-secondary" style={{ fontSize: '0.85rem' }}>E mais {filteredUpcoming.length - 5} agendamentos...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-secondary" style={{ textAlign: 'center', padding: '20px' }}>Nenhum agendamento {searchTerm ? 'encontrado' : 'futuro'}.</p>
                        )}
                    </div>
                </div>

                <div className="dashboard-side-col">
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15, color: 'var(--color-accent)' }}>
                            <Gift size={20} />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Aniversariantes</h3>
                        </div>
                        <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: 20 }}>Clientes que fazem aniversário este mês.</p>

                        {birthdays.length > 0 ? (
                            <div className="birthday-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {birthdays.map(c => (
                                    <div key={c.id} className="birthday-item" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                                            {c.name.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{c.name}</h4>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Dia {c.birth_date ? c.birth_date.split('-')[2] : '-'}</p>
                                        </div>
                                        <button className="btn-icon" onClick={() => openWhatsApp(c.whatsapp, c.name)} title="Dar os parabéns">
                                            <Phone size={14} className="text-accent" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px 0', opacity: 0.5 }}>
                                <Gift size={32} style={{ marginBottom: 10 }} />
                                <p style={{ fontSize: '0.85rem' }}>Nenhum aniversariante em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}.</p>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ padding: 20, marginTop: 24, background: 'var(--color-bg-secondary)', border: '1px dashed var(--color-border)' }}>
                        <h4 style={{ fontSize: '0.95rem', marginBottom: 10 }}>Link de Agendamento</h4>
                        <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: 15 }}>Compartilhe com seus clientes para agendarem online.</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input readOnly value={window.location.origin} className="form-input" style={{ fontSize: '0.75rem', height: 32 }} />
                            <button className="btn btn-primary btn-sm" onClick={() => { navigator.clipboard.writeText(window.location.origin); toast.success('Link copiado!'); }}>Copiar</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL: NOVO AGENDAMENTO */}
            {showNewApt && (
                <div className="modal-overlay" onClick={() => setShowNewApt(false)}>
                    <div className="modal animate-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2>Novo Agendamento</h2>
                            <button className="btn-icon" onClick={() => setShowNewApt(false)}><XCircle size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                                    <label className="form-label">Nome do Cliente *</label>
                                    <input type="text" className="form-input" value={newApt.client_name} onChange={e => setNewApt({ ...newApt, client_name: e.target.value })} placeholder="Ex: João da Silva" />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                                    <label className="form-label">WhatsApp (Opcional)</label>
                                    <input type="text" className="form-input" value={newApt.client_whatsapp} onChange={e => setNewApt({ ...newApt, client_whatsapp: e.target.value })} placeholder="(00) 00000-0000" />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                                    <label className="form-label">Serviço *</label>
                                    <select className="form-select" value={newApt.service_id} onChange={e => setNewApt({ ...newApt, service_id: e.target.value })}>
                                        <option value="">Selecione um serviço...</option>
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name} - {formatPrice(s.price)}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Data *</label>
                                    <input type="date" className="form-input" value={newApt.date} onChange={e => setNewApt({ ...newApt, date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Hora *</label>
                                    <input type="time" className="form-input" value={newApt.time} onChange={e => setNewApt({ ...newApt, time: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                                    <label className="form-label">Barbeiro (Opcional)</label>
                                    <select className="form-select" value={newApt.barber_id} onChange={e => setNewApt({ ...newApt, barber_id: e.target.value })}>
                                        <option value="">Selecione...</option>
                                        {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                                    <label className="form-label">Observações (Opcional)</label>
                                    <textarea className="form-input" rows="2" value={newApt.notes} onChange={e => setNewApt({ ...newApt, notes: e.target.value })} placeholder="Ex: Cliente prefere corte baixo nas laterais..."></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowNewApt(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={saveNewAppointment} disabled={savingApt}>
                                {savingApt ? 'Salvando...' : 'Salvar Agendamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: TRANSFERIR */}
            {transferData.id && (
                <div className="modal-overlay" onClick={() => setTransferData({ id: null, barberId: '' })}>
                    <div className="modal animate-scale" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Transferir Agendamento</h2>
                            <button className="btn-icon" onClick={() => setTransferData({ id: null, barberId: '' })}><XCircle size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Selecione o novo barbeiro</label>
                                <select className="form-select" value={transferData.barberId} onChange={e => setTransferData({ ...transferData, barberId: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {barbers.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setTransferData({ id: null, barberId: '' })}>Cancelar</button>
                            <button className="btn btn-primary" onClick={transferAppointment}>Transferir</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
