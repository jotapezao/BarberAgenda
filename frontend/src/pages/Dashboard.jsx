import { useState, useEffect, useRef } from 'react';
import { adminApi, publicApi, BASE_URL } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { Calendar, Users, CheckCircle, XCircle, Clock, Phone, Plus, Search, Scissors, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { maskPhone } from '../utils/mask';

// ── Componente de Recibo Térmico ─────────────────────────────────────────────
function ThermalReceipt({ apt, siteConfig, onClose }) {
    const receiptRef = useRef();

    const handlePrint = () => {
        const printContent = receiptRef.current.innerHTML;
        const win = window.open('', '_blank', 'width=320,height=600');
        win.document.write(`
            <!DOCTYPE html><html><head>
            <meta charset="utf-8">
            <title>Cupom - ${siteConfig.site_name || 'Barbearia'}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Roboto:wght@400;700;900&display=swap');
                * { margin:0; padding:0; box-sizing:border-box; }
                body { font-family:'Roboto',monospace; width:302px; padding:0; background:#fff; color:#000; }
                .receipt { width:100%; padding:8px 12px; }
                .logo-area { text-align:center; padding: 12px 0 8px; border-bottom:1px dashed #ccc; }
                .shop-name { font-size:18px; font-weight:900; letter-spacing:1px; text-transform:uppercase; }
                .shop-sub { font-size:10px; color:#555; margin-top:2px; }
                .divider { border:none; border-top:1px dashed #999; margin:8px 0; }
                .receipt-title { text-align:center; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2px; padding:4px 0; }
                .row { display:flex; justify-content:space-between; font-size:11px; padding:2px 0; }
                .row.bold { font-weight:700; font-size:12px; }
                .row.large { font-weight:900; font-size:14px; padding:4px 0; }
                .label { color:#555; }
                .value { text-align:right; font-weight:600; }
                .service-box { background:#f5f5f5; border-radius:4px; padding:8px 10px; margin:6px 0; }
                .service-name { font-size:13px; font-weight:700; }
                .service-price { font-size:12px; }
                .footer { text-align:center; padding:10px 0 6px; font-size:10px; color:#888; }
                .footer strong { color:#000; }
                .barcode { text-align:center; font-family:'Share Tech Mono',monospace; font-size:28px; letter-spacing:3px; padding:8px 0 4px; color:#333; }
                .total-area { border-top:2px solid #000; border-bottom:2px solid #000; padding:8px 0; margin:8px 0; }
                @media print {
                    @page { size: 80mm auto; margin: 0; }
                    body { width: 80mm; }
                }
            </style>
            </head><body><div class="receipt">${printContent}</div></body></html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    const today = new Date();
    const dateStr = apt.date ? apt.date.split('-').reverse().join('/') : today.toLocaleDateString('pt-BR');
    const timeStr = apt.time || today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const price = apt.service_price || 0;
    const discount = parseFloat(apt.discount_amount || 0);
    const total = Math.max(0, price - discount);
    const receiptNum = String(apt.id || 0).padStart(6, '0');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal animate-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, borderRadius: 20 }}>
                <div className="modal-header">
                    <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Printer size={18} className="text-accent" /> Comprovante de Atendimento
                    </h2>
                    <button className="btn-icon" onClick={onClose}><XCircle size={20} /></button>
                </div>
                <div className="modal-body" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Preview do recibo */}
                    <div style={{ background: '#f9f9f9', borderRadius: 12, margin: '8px 20px 16px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                        <div ref={receiptRef} style={{ fontFamily: "'Roboto', monospace", width: '100%', padding: '10px 14px', background: '#fff', color: '#000', fontSize: 12 }}>

                            {/* Cabeçalho */}
                            <div className="logo-area" style={{ textAlign: 'center', paddingBottom: 10, borderBottom: '1px dashed #ccc' }}>
                                {siteConfig.site_logo && (
                                    <img src={`${BASE_URL}${siteConfig.site_logo}`} alt="Logo" style={{ maxHeight: 50, maxWidth: 150, margin: '0 auto 6px', display: 'block' }} />
                                )}
                                <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>
                                    {siteConfig.site_name || 'BARBEARIA'}
                                </div>
                                {siteConfig.address && <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{siteConfig.address}</div>}
                                {siteConfig.phone && <div style={{ fontSize: 10, color: '#666' }}>Tel: {siteConfig.phone}</div>}
                            </div>

                            {/* Título */}
                            <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', padding: '8px 0 4px', color: '#444' }}>
                                ── COMPROVANTE DE SERVIÇO ──
                            </div>

                            {/* Dados do atendimento */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '1px 0' }}>
                                <span style={{ color: '#888' }}>Cupom Nº</span>
                                <span style={{ fontWeight: 700 }}>#{receiptNum}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '1px 0' }}>
                                <span style={{ color: '#888' }}>Data</span>
                                <span>{dateStr} às {timeStr}</span>
                            </div>

                            <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

                            {/* Cliente */}
                            <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>CLIENTE</div>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{apt.client_name}</div>
                            {apt.client_whatsapp && (
                                <div style={{ fontSize: 10, color: '#666', marginBottom: 6 }}>📱 {maskPhone(apt.client_whatsapp)}</div>
                            )}

                            <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

                            {/* Serviço */}
                            <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>SERVIÇO REALIZADO</div>
                            <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '8px 10px', marginBottom: 6 }}>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>{apt.service_name}</div>
                                {apt.barber_name && <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>Profissional: {apt.barber_name}</div>}
                                <div style={{ fontSize: 11, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Valor tabela</span>
                                    <span>R$ {parseFloat(price).toFixed(2).replace('.', ',')}</span>
                                </div>
                                {discount > 0 && (
                                    <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                                        <span>{apt.is_birthday_reward ? '🎂 Cortesia Aniversário' : 'Desconto'}</span>
                                        <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Total */}
                            <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '8px 0', margin: '6px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900 }}>
                                    <span>TOTAL</span>
                                    <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#666', marginTop: 2 }}>
                                    <span>Forma de pagamento</span>
                                    <span style={{ fontWeight: 700 }}>{apt.payment_method || '—'}</span>
                                </div>
                            </div>

                            {/* Código de barras visual */}
                            <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 24, letterSpacing: 3, padding: '6px 0 2px', color: '#333' }}>
                                |||||||||||||||||||
                            </div>
                            <div style={{ textAlign: 'center', fontSize: 9, color: '#aaa', marginBottom: 8 }}>
                                {receiptNum}
                            </div>

                            {/* Rodapé */}
                            <div style={{ borderTop: '1px dashed #ccc', paddingTop: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 2 }}>Obrigado pela preferência! 🙏</div>
                                <div style={{ fontSize: 9, color: '#888' }}>
                                    {siteConfig.site_name || 'Barbearia'} • {siteConfig.instagram ? `@${siteConfig.instagram}` : ''}
                                </div>
                                <div style={{ fontSize: 9, color: '#aaa', marginTop: 4 }}>
                                    Documento sem valor fiscal
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer" style={{ border: 'none', padding: '0 20px 20px', display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" style={{ flex: 1, border: '1px solid var(--color-border)' }} onClick={onClose}>Fechar</button>
                    <button className="btn btn-primary" style={{ flex: 2 }} onClick={handlePrint}>
                        <Printer size={16} /> Imprimir Cupom
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Dashboard Principal ───────────────────────────────────────────────────────
export default function Dashboard() {
    const [data, setData] = useState(null);
    const [barbers, setBarbers] = useState([]);
    const [services, setServices] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [siteConfig, setSiteConfig] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedBarber, setSelectedBarber] = useState('all');
    const [transferData, setTransferData] = useState({ id: null, barberId: '' });
    const [finishModal, setFinishModal] = useState({ id: null, discount_amount: '', is_birthday_reward: false, payment_method: 'PIX' });
    const [receiptApt, setReceiptApt] = useState(null);
    const [showNewApt, setShowNewApt] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newApt, setNewApt] = useState({ client_name: '', client_whatsapp: '', service_id: '', barber_id: '', date: '', time: '', notes: '' });
    const [clientSuggestions, setClientSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [savingApt, setSavingApt] = useState(false);
    const toast = useToast();

    const today = new Date().toISOString().split('T')[0];

    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : { role: 'admin' };
    const isAdmin = user.role === 'admin';

    useEffect(() => { loadDashboard(); }, [selectedBarber, selectedDate]);

    useEffect(() => {
        publicApi.getSiteConfig().then(setSiteConfig).catch(console.error);
    }, []);

    const loadDashboard = async () => {
        try {
            const params = { date: selectedDate };
            if (selectedBarber !== 'all') params.barberId = selectedBarber;
            const [dashboardData, svcData, barbersList, methodsList] = await Promise.all([
                adminApi.getDashboard(params),
                adminApi.getServices(),
                publicApi.getBarbers(),
                adminApi.getPaymentMethods()
            ]);
            setData(dashboardData);
            setServices(svcData);
            setBarbers(barbersList);
            setPaymentMethods(methodsList.filter(pm => pm.active === 1));
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
        // Find the apt for the receipt
        const aptForReceipt = (data?.todayAppointments || []).find(a => a.id === finishModal.id);
        try {
            await adminApi.updateAppointment(finishModal.id, {
                status: 'completed',
                discount_amount: parseFloat(finishModal.discount_amount) || 0,
                is_birthday_reward: finishModal.is_birthday_reward,
                payment_method: finishModal.payment_method
            });
            toast.success('Atendimento finalizado!');
            // Prepare receipt data
            if (aptForReceipt) {
                setReceiptApt({
                    ...aptForReceipt,
                    discount_amount: finishModal.discount_amount,
                    payment_method: finishModal.payment_method,
                    is_birthday_reward: finishModal.is_birthday_reward,
                });
            }
            setFinishModal({ id: null, discount_amount: '', is_birthday_reward: false, payment_method: 'PIX' });
            loadDashboard();
        } catch (err) { toast.error('Erro ao finalizar atendimento'); }
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

    const handleClientSearch = async (val) => {
        setNewApt({ ...newApt, client_name: val });
        if (val.length < 2) { setClientSuggestions([]); setShowSuggestions(false); return; }
        try {
            const clients = await adminApi.getClients({ search: val });
            setClientSuggestions(clients);
            setShowSuggestions(true);
        } catch (err) { console.error(err); }
    };

    const selectClient = (client) => {
        setNewApt({ ...newApt, client_name: client.name, client_whatsapp: client.whatsapp });
        setClientSuggestions([]); setShowSuggestions(false);
    };

    const statusBadge = (status) => {
        const labels = { confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' };
        return <span className={`badge badge-${status}`} style={{ fontSize: '0.65rem', textTransform: 'uppercase', padding: '2px 6px' }}>{labels[status]}</span>;
    };

    const formatDuration = (min) => {
        if (!min) return '';
        if (min < 60) return `${min}min`;
        const h = Math.floor(min / 60), m = min % 60;
        return m > 0 ? `${h}h${m}` : `${h}h`;
    };

    const openWhatsApp = (phone, name) => {
        const clean = (phone || '').replace(/\D/g, '');
        const full = clean.startsWith('55') ? clean : `55${clean}`;
        window.open(`https://wa.me/${full}?text=Olá, ${name}! Tudo bem? Gostaria de confirmar seu agendamento.`, '_blank');
    };

    const changeDate = (delta) => {
        const d = new Date(selectedDate + 'T12:00:00');
        d.setDate(d.getDate() + delta);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const filteredToday = (data?.todayAppointments || []).filter(apt =>
        apt.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const now = new Date();
    const isOverdue = (apt) => {
        if (apt.status !== 'confirmed') return false;
        return new Date(`${apt.date}T${apt.time}:00`) < now;
    };
    const overdueCount = (data?.todayAppointments || []).filter(isOverdue).length;
    const isPast = selectedDate < today;
    const isFuture = selectedDate > today;

    const formatDisplayDate = (dateStr) => {
        if (dateStr === today) return 'Hoje';
        const d = new Date(dateStr + 'T12:00:00');
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ontem';
        return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
    };

    if (loading) return <AdminLayout><div className="loading-spinner"><div className="spinner"></div></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="dashboard-container-v2" style={{ paddingBottom: 40 }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>Agenda</h1>
                    <button className="btn btn-primary btn-circle" onClick={() => { setNewApt({ ...newApt, date: selectedDate }); setShowNewApt(true); }} title="Novo Agendamento">
                        <Plus size={24} />
                    </button>
                </div>

                {/* Seletor de Data */}
                <div className="card glass-card" style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderRadius: 16 }}>
                    <button className="btn-icon" onClick={() => changeDate(-1)}><ChevronLeft size={20} /></button>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Calendar size={16} className="text-accent" />
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: isPast ? 'var(--color-text-muted)' : (isFuture ? 'var(--color-info)' : 'var(--color-accent)') }}>
                                {formatDisplayDate(selectedDate)}
                            </span>
                            {isPast && <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4, color: 'var(--color-text-muted)' }}>PASSADO</span>}
                        </div>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.72rem', outline: 'none', cursor: 'pointer', textAlign: 'center' }} />
                    </div>
                    <button className="btn-icon" onClick={() => changeDate(1)}><ChevronRight size={20} /></button>
                </div>

                {/* Filtro de Barbeiros */}
                <div className="barber-tabs" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 15, marginBottom: 15, scrollbarWidth: 'none' }}>
                    <button className={`tab-item ${selectedBarber === 'all' ? 'active' : ''}`} onClick={() => setSelectedBarber('all')}
                        style={{ padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap', border: '1px solid var(--color-border)', background: selectedBarber === 'all' ? 'var(--color-accent)' : 'transparent', color: selectedBarber === 'all' ? '#000' : '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
                        Todos
                    </button>
                    {barbers.map(b => (
                        <button key={b.id} className={`tab-item ${selectedBarber === b.id.toString() ? 'active' : ''}`} onClick={() => setSelectedBarber(b.id.toString())}
                            style={{ padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap', border: '1px solid var(--color-border)', background: selectedBarber === b.id.toString() ? 'var(--color-accent)' : 'transparent', color: selectedBarber === b.id.toString() ? '#000' : '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
                            {b.name}
                        </button>
                    ))}
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
                    <div className="card glass-card" style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Agendamentos</span>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-accent)', marginTop: 5 }}>{data?.stats?.total || 0}</div>
                    </div>
                    <div className="card glass-card" style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Concluídos</span>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-success)', marginTop: 5 }}>{data?.stats?.completed || 0}</div>
                    </div>
                </div>

                {/* Aviso de atrasados (apenas hoje) */}
                {selectedDate === today && overdueCount > 0 && (
                    <div style={{ background: 'rgba(255,152,0,0.12)', border: '1px solid #ff9800', borderRadius: 12, padding: '12px 15px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Clock size={22} color="#ff9800" />
                        <div>
                            <strong style={{ color: '#ff9800', fontSize: '0.95rem' }}>Atenção!</strong>
                            <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.9 }}>
                                {overdueCount} agendamento(s) com horário passado aguardando conclusão.
                            </p>
                        </div>
                    </div>
                )}

                {/* Busca */}
                <div style={{ marginBottom: 18, position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input type="text" className="form-input" placeholder="Pesquisar cliente..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: 38, borderRadius: 12, border: '1px solid var(--color-border)', height: 42, fontSize: '0.9rem' }} />
                </div>

                {/* Título da lista */}
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)' }}>
                    <Clock size={14} /> Agendamentos — {formatDisplayDate(selectedDate)}
                    {isPast && <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>(histórico)</span>}
                </h2>

                {/* Lista */}
                <div className="agenda-list-compact" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredToday.length > 0 ? filteredToday.map(apt => {
                        const overdue = selectedDate === today && isOverdue(apt);
                        const accentColor = apt.status === 'completed' ? 'var(--color-success)'
                            : apt.status === 'cancelled' ? 'var(--color-danger)'
                                : overdue ? '#ff9800' : 'var(--color-accent)';
                        return (
                            <div key={apt.id} className={`card apt-card-v2 ${apt.status}`}
                                style={{ padding: '12px 16px', position: 'relative', borderLeft: `4px solid ${accentColor}`, opacity: apt.status === 'cancelled' ? 0.7 : 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: accentColor, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 46 }}>
                                            {apt.time}
                                            {apt.status === 'confirmed' && <div style={{ width: 4, height: 4, borderRadius: '50%', background: accentColor, marginTop: 4 }}></div>}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>{apt.client_name}</h4>
                                            <div style={{ fontSize: '0.78rem', opacity: 0.7, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <Scissors size={11} /> {apt.service_name} • {formatDuration(apt.service_duration)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                        {statusBadge(apt.status)}
                                        {overdue && <span style={{ fontSize: '0.6rem', color: '#ff9800', fontWeight: 800, letterSpacing: 0.5 }}>ATRASADO</span>}
                                        {apt.barber_name && <span style={{ fontSize: '0.68rem', opacity: 0.5 }}>{apt.barber_name}</span>}
                                        {/* Imprimir recibo para concluídos */}
                                        {apt.status === 'completed' && (
                                            <button title="Imprimir recibo" onClick={() => setReceiptApt(apt)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2 }}>
                                                <Printer size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {apt.status === 'confirmed' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button className="btn-icon circle" onClick={() => openWhatsApp(apt.client_whatsapp, apt.client_name)} title="WhatsApp"><Phone size={15} /></button>
                                            <button className="btn-icon circle" onClick={() => setTransferData({ id: apt.id, barberId: apt.barber_id || '' })} title="Transferir"><Users size={15} /></button>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-sm btn-danger" onClick={() => updateStatus(apt.id, 'cancelled')} style={{ padding: '5px 10px' }}>
                                                <XCircle size={13} /> <span className="desk-only">Cancelar</span>
                                            </button>
                                            <button className="btn btn-sm btn-success" onClick={() => setFinishModal({ id: apt.id, discount_amount: '', is_birthday_reward: false, payment_method: paymentMethods[0]?.name || 'PIX' })} style={{ padding: '5px 10px' }}>
                                                <CheckCircle size={13} /> Concluir
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="card glass-card" style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.5 }}>
                            <Calendar size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
                            <p style={{ fontSize: '0.9rem' }}>
                                {isPast ? 'Nenhum registro encontrado para este dia.' : 'Nenhum agendamento para este filtro.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Novo Agendamento */}
            {showNewApt && (
                <div className="modal-overlay" onClick={() => setShowNewApt(false)}>
                    <div className="modal animate-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, borderRadius: 24 }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.2rem' }}>Novo Agendamento</h2>
                            <button className="btn-icon" onClick={() => setShowNewApt(false)}><XCircle size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group" style={{ position: 'relative' }}>
                                <label className="form-label">Cliente *</label>
                                <input type="text" className="form-input" value={newApt.client_name} onChange={e => handleClientSearch(e.target.value)} placeholder="Comece a digitar o nome..." autoComplete="off" />
                                {showSuggestions && clientSuggestions.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(30,30,30,0.98)', backdropFilter: 'blur(10px)', border: '1px solid var(--color-border)', borderRadius: 12, zIndex: 100, maxHeight: 200, overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', marginTop: 5 }}>
                                        {clientSuggestions.map(client => (
                                            <div key={client.id} onClick={() => selectClient(client)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}
                                                onMouseOver={e => e.currentTarget.style.background = 'rgba(212,165,72,0.15)'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                                <div style={{ fontWeight: 700 }}>{client.name}</div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{maskPhone(client.whatsapp)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                    <input type="date" className="form-input" value={newApt.date || selectedDate} onChange={e => setNewApt({ ...newApt, date: e.target.value })} />
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

            {/* Modal: Transferir Barbeiro */}
            {transferData.id && (
                <div className="modal-overlay" onClick={() => setTransferData({ id: null, barberId: '' })}>
                    <div className="modal animate-scale" onClick={e => e.stopPropagation()} style={{ borderRadius: 24, maxWidth: 400 }}>
                        <div className="modal-header">
                            <h2>Transferir Barbeiro</h2>
                            <button className="btn-icon" onClick={() => setTransferData({ id: null, barberId: '' })}><XCircle size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px 0' }}>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {barbers.map(b => (
                                    <button key={b.id} onClick={() => {
                                        adminApi.updateAppointment(transferData.id, { barber_id: b.id })
                                            .then(() => { toast.success('Transferido para ' + b.name); setTransferData({ id: null, barberId: '' }); loadDashboard(); })
                                            .catch(() => toast.error('Erro ao transferir'));
                                    }} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.03)', color: '#fff', textAlign: 'left', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.background = 'var(--color-accent-subtle)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: '0.8rem' }}>
                                            {b.name.charAt(0)}
                                        </div>
                                        {b.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer" style={{ border: 'none' }}>
                            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setTransferData({ id: null, barberId: '' })}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Finalizar Atendimento */}
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
                                <input type="number" className="form-input" value={finishModal.discount_amount}
                                    onChange={e => setFinishModal({ ...finishModal, discount_amount: e.target.value })} placeholder="0,00" inputMode="numeric" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Forma de Pagamento</label>
                                <select className="form-select" value={finishModal.payment_method} onChange={e => setFinishModal({ ...finishModal, payment_method: e.target.value })}>
                                    {paymentMethods.map(pm => <option key={pm.id} value={pm.name}>{pm.name}</option>)}
                                </select>
                            </div>
                            <label className="flex-center" style={{ gap: 10, cursor: 'pointer', justifyContent: 'flex-start', marginTop: 10 }}>
                                <input type="checkbox" checked={finishModal.is_birthday_reward} onChange={e => setFinishModal({ ...finishModal, is_birthday_reward: e.target.checked })} style={{ width: 18, height: 18 }} />
                                <span style={{ fontSize: '0.9rem' }}>🎂 Cortesia de Aniversário</span>
                            </label>
                        </div>
                        <div className="modal-footer" style={{ border: 'none' }}>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={finishAppointment}>
                                <CheckCircle size={16} /> Confirmar e Finalizar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Recibo Térmico */}
            {receiptApt && (
                <ThermalReceipt
                    apt={receiptApt}
                    siteConfig={siteConfig}
                    onClose={() => setReceiptApt(null)}
                />
            )}
        </AdminLayout>
    );
}
