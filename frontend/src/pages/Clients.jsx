import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { Users, Search, Phone, Calendar, DollarSign, Edit3, Trash2, X, Eye, UserPlus, Download, Upload, FileText } from 'lucide-react';
import { maskPhone, unmask } from '../utils/mask';

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({ name: '', whatsapp: '', email: '', birth_date: '', notes: '' });
    const [showBirthdays, setShowBirthdays] = useState(false);
    const [birthdayClients, setBirthdayClients] = useState([]);

    const toast = useToast();

    useEffect(() => { loadClients(); }, []);

    const loadClients = async (searchTerm = '') => {
        try {
            const data = await adminApi.getClients(searchTerm ? { search: searchTerm } : {});
            setClients(data);

            // Also load birthdays if not loaded
            const bdays = await adminApi.getBirthdays();
            setBirthdayClients(bdays);
        } catch (err) { toast.error('Erro ao carregar clientes'); }
        finally { setLoading(false); }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadClients(search);
    };

    const handleOpenModal = (client = null) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                name: client.name || '',
                whatsapp: client.whatsapp || '',
                email: client.email || '',
                birth_date: client.birth_date || '',
                notes: client.notes || ''
            });
        } else {
            setEditingClient(null);
            setFormData({ name: '', whatsapp: '', email: '', birth_date: '', notes: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            whatsapp: unmask(formData.whatsapp || '')
        };

        try {
            if (editingClient) {
                await adminApi.updateClient(editingClient.id, payload);
                toast.success('Cliente atualizado');
            } else {
                await adminApi.createClient(payload);
                toast.success('Cliente cadastrado');
            }
            setShowModal(false);
            loadClients();
        } catch (err) { toast.error(err.message); }
    };

    const deleteClient = async (id) => {
        if (!window.confirm('Remover este cliente?')) return;
        try { await adminApi.deleteClient(id); toast.success('Cliente removido'); loadClients(); }
        catch (err) { toast.error(err.message); }
    };

    const exportToCSV = () => {
        if (clients.length === 0) return toast.error('Nenhum cliente para exportar');

        const headers = ['Nome', 'WhatsApp', 'Email', 'Data Nascimento', 'Visitas', 'Gasto Total', 'Ultima Visita', 'Observacoes'];
        const rows = clients.map(c => [
            c.name,
            c.whatsapp,
            c.email || '',
            c.birth_date || '',
            c.total_visits,
            c.total_spent,
            c.last_visit || '',
            (c.notes || '').replace(/\n/g, ' ')
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(';')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `clientes_barbearia_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const importedClients = [];

            // Simple CSV parser (assuming name;whatsapp;email;birth_date;notes)
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(';');
                if (parts.length >= 2 && parts[0] && parts[1]) {
                    importedClients.push({
                        name: parts[0].trim(),
                        whatsapp: parts[1].trim(),
                        email: parts[2]?.trim() || '',
                        birth_date: parts[3]?.trim() || '',
                        notes: parts[4]?.trim() || ''
                    });
                }
            }

            if (importedClients.length === 0) return toast.error('Nenhum dado válido encontrado no arquivo');

            try {
                const res = await adminApi.importClients(importedClients);
                toast.success(`${res.imported} clientes importados! (${res.errors} erros)`);
                loadClients();
            } catch (err) { toast.error('Erro na importação'); }
        };
        reader.readAsText(file);
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
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className={`btn ${showBirthdays ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowBirthdays(!showBirthdays)} title="Aniversariantes do Mês">
                        <FileText size={18} /> {showBirthdays ? 'Ver Todos' : 'Aniversariantes'}
                    </button>
                    <button className="btn btn-secondary" onClick={exportToCSV} title="Exportar CSV">
                        <Download size={18} /> Exportar
                    </button>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        <Upload size={18} /> Importar
                        <input type="file" hidden accept=".csv" onChange={handleImport} />
                    </label>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <UserPlus size={18} /> Novo Cliente
                    </button>
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
            {(showBirthdays ? birthdayClients : clients).length > 0 ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px 100px 100px 120px', padding: '15px 24px', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        <div>CLIENTE</div>
                        <div>{showBirthdays ? 'ANIVERSÁRIO' : 'HISTÓRICO'}</div>
                        <div style={{ textAlign: 'center' }}>VISITAS</div>
                        <div style={{ textAlign: 'center' }}>GASTO</div>
                        <div style={{ textAlign: 'center' }}>STATUS</div>
                        <div style={{ textAlign: 'right' }}>AÇÕES</div>
                    </div>
                    {(showBirthdays ? birthdayClients : clients).map(client => (
                        <div key={client.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px 100px 100px 120px', padding: '15px 24px', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                            <div>
                                <h4 style={{ margin: 0 }}>{client.name}</h4>
                                <p style={{ margin: 0, cursor: 'pointer', color: 'var(--color-accent)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => openWhatsApp(client.whatsapp, client.name)}>
                                    <Phone size={12} /> {maskPhone(client.whatsapp)}
                                </p>
                            </div>
                            <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                                {showBirthdays ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent)', fontWeight: 700 }}>
                                        <Calendar size={14} /> Dia {client.birth_date?.split('-')[2]}
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ marginBottom: 2 }}>📅 Último: {formatDateBR(client.last_visit)}</div>
                                        <div>📆 Desde: {formatDateBR(client.created_at?.split('T')[0] || client.created_at?.split(' ')[0])}</div>
                                    </>
                                )}
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
                                <button className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }} onClick={() => setSelectedClient(client) || setShowDetail(true)} title="Detalhes"><Eye size={14} /></button>
                                <button className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }} onClick={() => handleOpenModal(client)} title="Editar"><Edit3 size={14} /></button>
                                <button className="btn btn-danger btn-sm" style={{ padding: '6px 10px' }} onClick={() => deleteClient(client.id)} title="Remover"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card empty-state">
                    <Users size={48} />
                    <h3>{showBirthdays ? 'Nenhum aniversariante este mês' : 'Nenhum cliente cadastrado'}</h3>
                    <p>{showBirthdays ? 'Fique de olho nos próximos meses!' : 'Clientes serão cadastrados automaticamente ao agendar'}</p>
                </div>
            )}

            {/* Form Modal (Add/Edit) */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
                            <div className="form-group">
                                <label className="form-label">Nome Completo</label>
                                <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">WhatsApp</label>
                                <input type="text" className="form-input" value={maskPhone(formData.whatsapp)} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="(00) 00000-0000" maxLength={15} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Data Nasc.</label>
                                    <input type="date" className="form-input" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Observações</label>
                                <textarea className="form-input" rows="3" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{editingClient ? 'Salvar' : 'Cadastrar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetail && selectedClient && (
                <div className="modal-overlay" onClick={() => setShowDetail(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2>{selectedClient.name}</h2>
                            <button onClick={() => setShowDetail(false)}><X size={20} /></button>
                        </div>
                        <div style={{ padding: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                                <div className="card" style={{ padding: 16, textAlign: 'center', background: 'var(--color-bg-secondary)' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedClient.total_visits}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Visitas</div>
                                </div>
                                <div className="card" style={{ padding: 16, textAlign: 'center', background: 'var(--color-bg-secondary)' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-accent)' }}>{formatPrice(selectedClient.total_spent)}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Gasto Total</div>
                                </div>
                                <div className="card" style={{ padding: 16, textAlign: 'center', background: 'var(--color-bg-secondary)' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatDateBR(selectedClient.last_visit)}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Última Visita</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                                <div>
                                    <p style={{ margin: '0 0 10px' }}><strong>WhatsApp:</strong> {selectedClient.whatsapp}</p>
                                    <p style={{ margin: '0 0 10px' }}><strong>Email:</strong> {selectedClient.email || '-'}</p>
                                    <p style={{ margin: '0 0 10px' }}><strong>Aniversário:</strong> {formatDateBR(selectedClient.birth_date)}</p>
                                </div>
                                <div>
                                    <strong>Observações:</strong>
                                    <p className="text-secondary" style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', marginTop: 8 }}>{selectedClient.notes || 'Sem observações'}</p>
                                </div>
                            </div>

                            {selectedClient.appointments?.length > 0 ? (
                                <>
                                    <h3 style={{ fontSize: '1rem', marginBottom: 12, marginTop: 24, borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>Histórico Recente</h3>
                                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                        {selectedClient.appointments.map(apt => (
                                            <div key={apt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                                                <div>
                                                    <span style={{ fontWeight: 600 }}>{apt.service_name}</span>
                                                    <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{formatDateBR(apt.date)} às {apt.time}</div>
                                                </div>
                                                <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{formatPrice(apt.service_price)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-center text-secondary" style={{ marginTop: 20 }}>Sem histórico de agendamentos</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
