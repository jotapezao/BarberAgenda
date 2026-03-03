import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { UserPlus, Edit2, Trash2, Check, X, Shield, Percent, User, Info } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '../components/Toast';

export default function Barbers() {
    const [barbers, setBarbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBarber, setEditingBarber] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        commission_rate: 0,
        is_active: 1
    });

    useEffect(() => {
        loadBarbers();
    }, []);

    async function loadBarbers() {
        try {
            const data = await adminApi.getBarbers();
            setBarbers(data);
        } catch (e) {
            toast.error('Erro ao carregar barbeiros');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            if (editingBarber) {
                await adminApi.updateBarber(editingBarber.id, formData);
                toast.success('Barbeiro atualizado');
            } else {
                await adminApi.createBarber(formData);
                toast.success('Barbeiro cadastrado');
            }
            setIsModalOpen(false);
            setEditingBarber(null);
            setFormData({ username: '', password: '', name: '', commission_rate: 0, is_active: 1 });
            loadBarbers();
        } catch (e) {
            toast.error(e.message || 'Erro ao salvar');
        }
    }

    function handleEdit(barber) {
        setEditingBarber(barber);
        setFormData({
            username: barber.username,
            name: barber.name,
            commission_rate: barber.commission_rate,
            is_active: barber.is_active,
            password: '' // Don't show password
        });
        setIsModalOpen(true);
    }
    const toast = useToast();

    return (
        <AdminLayout>
            <div className="admin-page">
                <div className="admin-header">
                    <div>
                        <h1>Barbeiros & Comissões</h1>
                        <p>Gerencie sua equipe e parâmetros de ganhos</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingBarber(null); setFormData({ username: '', password: '', name: '', commission_rate: 0, is_active: 1 }); setIsModalOpen(true); }}>
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
                                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={24} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{barber.name}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>@{barber.username}</p>
                                    </div>
                                    <span className={`badge ${barber.is_active ? 'badge-success' : 'badge-error'}`}>
                                        {barber.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
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
                                        <Edit2 size={16} /> Editar
                                    </button>
                                </div>
                            </div>
                        ))}
                        {barbers.length === 0 && (
                            <div className="col-span-full" style={{ textAlign: 'center', padding: '40px' }}>
                                <p style={{ color: 'var(--color-text-muted)' }}>Nenhum barbeiro cadastrado.</p>
                            </div>
                        )}
                    </div>
                )}

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '450px' }}>
                            <div className="modal-header">
                                <h2>{editingBarber ? 'Editar Barbeiro' : 'Cadastrar Barbeiro'}</h2>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Nome Completo</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Usuário (Login)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        disabled={editingBarber}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{editingBarber ? 'Nova Senha (deixe vazio para manter)' : 'Senha'}</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={editingBarber ? 'Mantenha em branco para não alterar' : 'Digite a senha'}
                                        required={!editingBarber}
                                    />
                                    <div className="info-box" style={{ marginTop: 10, background: 'rgba(59, 130, 246, 0.05)', padding: 12, borderRadius: 6, fontSize: '0.8rem', border: '1px solid rgba(59, 130, 246, 0.2)', color: 'var(--color-info)' }}>
                                        <p><Info size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Certifique-se de salvar ou anotar o usuário e senha do barbeiro antes de cadastrá-lo.</p>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Percentual de Comissão (%)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.commission_rate}
                                            onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                                            required
                                            min="0"
                                            max="100"
                                        />
                                        <Percent size={18} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                        O valor será calculado sobre o preço bruto de cada serviço finalizado.
                                    </p>
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItem: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active === 1}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                                    />
                                    <label htmlFor="is_active" className="form-label" style={{ marginBottom: 0 }}>Conta Ativa</label>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                        <Check size={18} /> {editingBarber ? 'Salvar Alterações' : 'Cadastrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
