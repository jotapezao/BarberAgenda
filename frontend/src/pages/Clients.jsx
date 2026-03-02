import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { Users, Search, Phone, Calendar, DollarSign, Edit3, Trash2, X, Eye } from 'lucide-react';

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const toast = useToast();

    useEffect(() => { loadClients(); }, []);

    const loadClients = async (searchTerm = '') => {
        try {
            const data = await adminApi.getClients(searchTerm ? { search: searchTerm } : {});
            setClients(data);
        } catch (err) { toast.error('Erro ao carregar clientes'); }
        finally { setLoading(false); }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadClients(search);
    };

    const viewClient = async (id) => {
        try {
            const data = await adminApi.getClient(id);
            setSelectedClient(data);
            setShowDetail(true);
        } catch (err) { toast.error('Erro ao carregar detalhes'); }
    };

    const deleteClient = async (id) => {
        if (!window.confirm('Remover este cliente?')) return;
        try { await adminApi.deleteClient(id); toast.success('Cliente removido'); loadClients(); }
        catch (err) { toast.error(err.message); }
    };

    const formatPrice = (p) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p || 0);
    const formatDateBR = (s) => { if (!s) return '-'; const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };

    const openWhatsApp = (phone, name) => {
        const clean = phone.replace(/\D/g, '');
        const full = clean.startsWith('55') ? clean : `55${clean}`;
        window.open(`https://wa.me/${full}?text=Olá, ${name}!`, '_blank');
    };

    if (loading) return <AdminLayout><div className="loading-spinner"><div className="spinner"></div></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="section-header-admin">
                <div>
                    <h1>Clientes</h1>
                    <p className="text-secondary">{clients.length} clientes cadastrados no sistema</p>
                </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" className="form-input" placeholder="Buscar por nome ou WhatsApp..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 44 }} />
                </div>
                <button type="submit" className="btn btn-primary">Buscar</button>
            </form>

            {/* Client list */}
            {clients.length > 0 ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px 100px 100px 80px', padding: '15px 24px', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        <div>CLIENTE</div>
                        <div>HISTÓRICO</div>
                        <div style={{ textAlign: 'center' }}>VISITAS</div>
                        <div style={{ textAlign: 'center' }}>GASTO</div>
                        <div style={{ textAlign: 'center' }}>STATUS</div>
                        <div style={{ textAlign: 'right' }}>AÇÕES</div>
                    </div>
                    {clients.map(client => (
                        <div key={client.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px 100px 100px 80px', padding: '15px 24px', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                            <div>
                                <h4 style={{ margin: 0 }}>{client.name}</h4>
                                <p style={{ margin: 0, cursor: 'pointer', color: 'var(--color-accent)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => openWhatsApp(client.whatsapp, client.name)}>
                                    <Phone size={12} /> {client.whatsapp}
                                </p>
                            </div>
                            <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                                <div style={{ marginBottom: 2 }}>📅 Último: {formatDateBR(client.last_visit)}</div>
                                <div>📆 Desde: {formatDateBR(client.created_at?.split('T')[0] || client.created_at?.split(' ')[0])}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{client.total_visits}</div>
                                <div className="text-secondary" style={{ fontSize: '0.75rem' }}>visitas</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{formatPrice(client.total_spent)}</div>
                                <div className="text-secondary" style={{ fontSize: '0.75rem' }}>gasto total</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <span className={`badge ${client.total_visits >= 10 ? 'badge-completed' : client.total_visits >= 5 ? 'badge-confirmed' : ''}`} style={{ fontSize: '0.7rem' }}>
                                    {client.total_visits >= 10 ? '⭐ VIP' : client.total_visits >= 5 ? '🔄 Freq' : '🆕 Novo'}
                                </span>
                            </div>
                            <div className="flex-center" style={{ justifyContent: 'flex-end', gap: 8 }}>
                                <button className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }} onClick={() => viewClient(client.id)} title="Detalhes"><Eye size={14} /></button>
                                <button className="btn btn-danger btn-sm" style={{ padding: '6px 10px' }} onClick={() => deleteClient(client.id)} title="Remover"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card empty-state">
                    <Users size={48} />
                    <h3>Nenhum cliente cadastrado</h3>
                    <p>Clientes serão cadastrados automaticamente ao agendar</p>
                </div>
            )}

            {/* Detail Modal */}
            {showDetail && selectedClient && (
                <div className="modal-overlay" onClick={() => setShowDetail(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2>{selectedClient.name}</h2>
                            <button className="btn-icon" onClick={() => setShowDetail(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                                <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedClient.total_visits}</div>
                                    <div className="text-secondary" style={{ fontSize: '0.8rem' }}>Visitas</div>
                                </div>
                                <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-accent)' }}>{formatPrice(selectedClient.total_spent)}</div>
                                    <div className="text-secondary" style={{ fontSize: '0.8rem' }}>Gasto Total</div>
                                </div>
                                <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatDateBR(selectedClient.last_visit)}</div>
                                    <div className="text-secondary" style={{ fontSize: '0.8rem' }}>Última Visita</div>
                                </div>
                            </div>
                            <p style={{ marginBottom: 4 }}><strong>WhatsApp:</strong> {selectedClient.whatsapp}</p>
                            {selectedClient.email && <p style={{ marginBottom: 4 }}><strong>Email:</strong> {selectedClient.email}</p>}
                            {selectedClient.notes && <p style={{ marginBottom: 16 }}><strong>Obs:</strong> {selectedClient.notes}</p>}

                            {selectedClient.appointments?.length > 0 && (
                                <>
                                    <h3 style={{ fontSize: '1rem', marginBottom: 12, marginTop: 16 }}>Histórico de Atendimentos</h3>
                                    <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                                        {selectedClient.appointments.map(apt => (
                                            <div key={apt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                                                <div>
                                                    <strong>{apt.service_name}</strong>
                                                    <span className="text-secondary" style={{ marginLeft: 8 }}>{formatDateBR(apt.date)} {apt.time}</span>
                                                </div>
                                                <div style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{formatPrice(apt.service_price)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
