import { useState, useEffect } from 'react';
import { adminApi, BASE_URL } from '../api';
import { UserPlus, Edit2, Trash2, Check, X, Shield, Percent, User, Info, CalendarX } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '../components/Toast';
import { maskCPF, maskPhone, validateCPF, unmask } from '../utils/mask';

export default function Barbers() {
    const [barbers, setBarbers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOffDaysModalOpen, setIsOffDaysModalOpen] = useState(false);
    const [editingBarber, setEditingBarber] = useState(null);
    const [offDays, setOffDays] = useState([]);
    const [newOffDate, setNewOffDate] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        commission_rate: 0,
        is_active: 1,
        cpf: '',
        birth_date: '',
        phone: '',
        photo_url: '',
        role_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [barbersData, rolesData] = await Promise.all([
                adminApi.getBarbers(),
                adminApi.getRoles()
            ]);
            setBarbers(barbersData);
            setRoles(rolesData);
        } catch (e) {
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }

    async function handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const { url } = await adminApi.uploadImage(file);
            setFormData(prev => ({ ...prev, photo_url: url }));
            toast.success('Foto carregada!');
        } catch (err) {
            toast.error('Erro no upload da foto');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        // Basic CPF Validation
        if (formData.cpf && unmask(formData.cpf).length > 0 && !validateCPF(formData.cpf)) {
            return toast.error('CPF inválido!');
        }

        const payload = {
            ...formData,
            cpf: unmask(formData.cpf || ''),
            phone: unmask(formData.phone || '')
        };

        try {
            if (editingBarber) {
                await adminApi.updateBarber(editingBarber.id, payload);
                toast.success('Barbeiro atualizado');
            } else {
                await adminApi.createBarber(payload);
                toast.success('Barbeiro cadastrado');
            }
            setIsModalOpen(false);
            setEditingBarber(null);
            resetForm();
            loadData();
        } catch (e) {
            toast.error(e.message || 'Erro ao salvar');
        }
    }

    function resetForm() {
        setFormData({ username: '', password: '', name: '', commission_rate: 0, is_active: 1, cpf: '', birth_date: '', phone: '', photo_url: '', role_id: roles[0]?.id || '' });
    }

    function handleEdit(barber) {
        setEditingBarber(barber);
        setFormData({
            username: barber.username,
            name: barber.name,
            commission_rate: barber.commission_rate,
            is_active: barber.is_active,
            cpf: barber.cpf || '',
            birth_date: barber.birth_date || '',
            phone: barber.phone || '',
            photo_url: barber.photo_url || '',
            role_id: barber.role_id || '',
            password: ''
        });
        setIsModalOpen(true);
    }

    async function openOffDays(barber) {
        setEditingBarber(barber);
        try {
            const days = await adminApi.getBarberOffDays(barber.id);
            setOffDays(days);
            setIsOffDaysModalOpen(true);
        } catch (e) { toast.error('Erro ao carregar folgas'); }
    }

    async function addOffDay() {
        if (!newOffDate) return;
        try {
            await adminApi.saveBarberOffDays({ barber_id: editingBarber.id, dates: [newOffDate] });
            const days = await adminApi.getBarberOffDays(editingBarber.id);
            setOffDays(days);
            setNewOffDate('');
            toast.success('Folga adicionada');
        } catch (e) { toast.error('Erro ao salvar'); }
    }

    async function removeOffDay(id) {
        try {
            await adminApi.deleteBarberOffDay(id);
            setOffDays(offDays.filter(d => d.id !== id));
            toast.success('Folga removida');
        } catch (e) { toast.error('Erro ao remover'); }
    }

    return (
        <AdminLayout>
            <div className="admin-page">
                <div className="admin-header">
                    <div>
                        <h1>Barbeiros & Equipe</h1>
                        <p>Gerencie sua equipe, folgas e permissões</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingBarber(null); resetForm(); setIsModalOpen(true); }}>
                        <UserPlus size={18} /> Novo Barbeiro
                    </button>
                </div>

                {loading ? (
                    <div className="loading-spinner"><div className="spinner"></div></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {barbers.map(barber => (
                            <div key={barber.id} className={`card ${!barber.is_active ? 'opacity-60' : ''}`} style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{
                                        width: 64, height: 64, borderRadius: '50%', background: 'var(--color-bg-secondary)', color: 'var(--color-accent)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--color-accent-subtle)'
                                    }}>
                                        {barber.photo_url ? (
                                            <img src={`${BASE_URL}${barber.photo_url}`} alt={barber.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (<User size={30} />)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{barber.name}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Shield size={12} /> {roles.find(r => r.id === barber.role_id)?.name || 'Barbeiro'}
                                        </p>
                                    </div>
                                    <span className={`badge ${barber.is_active ? 'badge-success' : 'badge-error'}`}>
                                        {barber.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>

                                <div className="barber-details" style={{ fontSize: '0.85rem', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {barber.phone && <p style={{ color: 'var(--color-text-muted)' }}><strong>WhatsApp:</strong> {barber.phone}</p>}
                                    {barber.cpf && <p style={{ color: 'var(--color-text-muted)' }}><strong>CPF:</strong> {barber.cpf}</p>}
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent)' }}>
                                        <Percent size={16} />
                                        <span style={{ fontWeight: 600 }}>Comissão</span>
                                    </div>
                                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{barber.commission_rate}%</span>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleEdit(barber)}>
                                        <Edit2 size={16} /> Detalhes
                                    </button>
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => openOffDays(barber)}>
                                        <CalendarX size={16} /> Folgas
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Modal */}
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '650px' }}>
                            <div className="modal-header">
                                <h2>{editingBarber ? 'Dados do Barbeiro' : 'Novo Barbeiro'}</h2>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div className="form-group" style={{ textAlign: 'center' }}>
                                            <label className="form-label">Foto Perfil</label>
                                            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--color-bg-secondary)', margin: '10px auto', overflow: 'hidden', border: '2px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                {formData.photo_url ? (<img src={`${BASE_URL}${formData.photo_url}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (<User size={40} style={{ opacity: 0.2 }} />)}
                                                <input type="file" onChange={handlePhotoUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} accept="image/*" />
                                            </div>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Clique para alterar</p>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Perfil de Acesso</label>
                                            <select className="form-input" value={formData.role_id} onChange={e => setFormData({ ...formData, role_id: e.target.value })} required>
                                                <option value="">Selecione...</option>
                                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Comissão (%)</label>
                                            <input type="number" className="form-input" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })} required />
                                        </div>
                                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input type="checkbox" id="is_active" checked={formData.is_active === 1} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })} />
                                            <label htmlFor="is_active" className="form-label" style={{ marginBottom: 0 }}>Conta Ativa</label>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Nome Completo</label>
                                            <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Usuário (Login)</label>
                                                <input type="text" className="form-input" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required disabled={editingBarber} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Senha</label>
                                                <input type="password" className="form-input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={editingBarber ? 'Manter atual' : 'Senha'} required={!editingBarber} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="form-group">
                                                <label className="form-label">CPF</label>
                                                <input type="text" className="form-input" value={maskCPF(formData.cpf || '')} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} placeholder="000.000.000-00" maxLength={14} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Data Nasc.</label>
                                                <input type="date" className="form-input" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">WhatsApp</label>
                                            <input type="text" className="form-input" value={maskPhone(formData.phone || '')} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 00000-0000" maxLength={15} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                        <Check size={18} /> {editingBarber ? 'Salvar Alterações' : 'Cadastrar Membro'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Off Days Modal */}
                {isOffDaysModalOpen && editingBarber && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '400px' }}>
                            <div className="modal-header">
                                <h2>Folgas: {editingBarber.name}</h2>
                                <button onClick={() => setIsOffDaysModalOpen(false)}><X size={20} /></button>
                            </div>
                            <div style={{ padding: 24 }}>
                                <div className="form-group">
                                    <label className="form-label">Data de Folga ou Falta</label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <input type="date" className="form-input" value={newOffDate} onChange={e => setNewOffDate(e.target.value)} style={{ flex: 1 }} />
                                        <button className="btn btn-primary" onClick={addOffDay} disabled={!newOffDate}>Agendar Folga</button>
                                    </div>
                                    <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 8 }}>Agende folgas para remover este barbeiro da lista de horários públicos.</p>
                                </div>

                                <div style={{ marginTop: 30 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                        <List size={18} className="text-accent" />
                                        <h4 style={{ margin: 0 }}>Histórico de Datas</h4>
                                    </div>
                                    {offDays.length === 0 ? (
                                        <div className="card" style={{ background: 'var(--color-bg-secondary)', textAlign: 'center', padding: 30, border: '1px dashed var(--color-border)' }}>
                                            <CalendarX size={32} style={{ opacity: 0.1, marginBottom: 10 }} />
                                            <p className="text-secondary text-sm">Nenhuma folga ou falta registrada no histórico.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {offDays.sort((a, b) => b.date.localeCompare(a.date)).map(d => {
                                                const isPast = new Date(d.date) < new Date(new Date().toISOString().split('T')[0]);
                                                return (
                                                    <div key={d.id} className="table-row-compact" style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        background: 'var(--color-bg-secondary)', padding: '12px 16px', borderRadius: 12,
                                                        border: '1px solid var(--color-border)',
                                                        opacity: isPast ? 0.6 : 1
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isPast ? 'var(--color-text-muted)' : 'var(--color-accent)' }}></div>
                                                            <div>
                                                                <div style={{ fontWeight: 600 }}>{d.date.split('-').reverse().join('/')}</div>
                                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{isPast ? 'Data Passada' : 'Agendado'}</div>
                                                            </div>
                                                        </div>
                                                        <button className="btn-icon text-danger" onClick={() => removeOffDay(d.id)} title="Remover"><Trash2 size={16} /></button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: 30, display: 'flex', gap: 12 }}>
                                    <button className="btn btn-secondary w-full" onClick={() => setIsOffDaysModalOpen(false)}>Fechar Janela</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
