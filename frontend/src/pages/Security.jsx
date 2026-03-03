import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { Shield, Plus, Edit2, Check, X, Lock, Unlock, Eye, Trash2 } from 'lucide-react';

export default function Security() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', permissions: {} });

    const toast = useToast();

    const resources = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'appointments', label: 'Agendamentos' },
        { id: 'financial', label: 'Financeiro' },
        { id: 'services', label: 'Serviços' },
        { id: 'barbers', label: 'Barbeiros / Equipe' },
        { id: 'clients', label: 'Clientes' },
        { id: 'stock', label: 'Estoque / Produtos' },
        { id: 'site_config', label: 'Configurações do Site' },
        { id: 'security', label: 'Segurança / Permissões' },
    ];

    const actions = [
        { id: 'none', label: 'Sem Acesso' },
        { id: 'view', label: 'Visualizar' },
        { id: 'manage', label: 'Gerenciar (Acesso Total)' },
    ];

    useEffect(() => { loadRoles(); }, []);

    const loadRoles = async () => {
        try {
            const data = await adminApi.getRoles();
            setRoles(data);
        } catch (err) { toast.error('Erro ao carregar perfis'); }
        finally { setLoading(false); }
    };

    const handleOpenModal = async (role = null) => {
        if (role) {
            setEditingRole(role);
            try {
                const perms = await adminApi.getRolePermissions(role.id);
                setFormData({
                    name: role.name,
                    description: role.description || '',
                    permissions: perms || {}
                });
            } catch (err) { toast.error('Erro ao carregar permissões'); }
        } else {
            setEditingRole(null);
            setFormData({ name: '', description: '', permissions: {} });
        }
        setIsModalOpen(true);
    };

    const handlePermissionChange = (resource, action) => {
        setFormData(prev => {
            const newPerms = { ...prev.permissions };
            if (action === 'none') {
                delete newPerms[resource];
            } else {
                newPerms[resource] = action;
            }
            return { ...prev, permissions: newPerms };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await adminApi.updateRole(editingRole.id, formData);
                toast.success('Perfil atualizado');
            } else {
                await adminApi.createRole(formData);
                toast.success('Perfil criado');
            }
            setIsModalOpen(false);
            loadRoles();
        } catch (err) { toast.error(err.message); }
    };

    if (loading) return <AdminLayout><div className="loading-spinner"><div className="spinner"></div></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="section-header-admin">
                <div>
                    <h1>Segurança & Acessos</h1>
                    <p className="text-secondary">Gerencie os níveis de acesso de cada membro da sua equipe</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Novo Perfil
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(role => (
                    <div key={role.id} className="card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ background: 'var(--color-bg-secondary)', padding: 10, borderRadius: 12, color: 'var(--color-accent)' }}>
                                    <Shield size={24} />
                                </div>
                                <h3 style={{ margin: 0 }}>{role.name}</h3>
                            </div>
                            {role.is_system && <span className="badge badge-confirmed" style={{ fontSize: '0.6rem' }}>SISTEMA</span>}
                        </div>
                        <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: 20 }}>{role.description || 'Sem descrição'}</p>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleOpenModal(role)}>
                                <Edit2 size={16} /> Editar Acesso
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 700 }}>
                        <div className="modal-header">
                            <h2>{editingRole ? `Editar Perfil: ${editingRole.name}` : 'Novo Perfil de Acesso'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                                <div className="form-group">
                                    <label className="form-label">Nome do Perfil</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        disabled={editingRole?.is_system && editingRole?.name === 'Admin'}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Descrição</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1rem', marginBottom: 15 }}>Permissões de Acesso</h3>
                            <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', padding: '12px 20px', background: 'var(--color-bg-secondary)', fontWeight: 700, fontSize: '0.85rem' }}>
                                    <div>Módulo / Funcionalidade</div>
                                    <div>Nível de Acesso</div>
                                </div>
                                {resources.map(res => (
                                    <div key={res.id} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', padding: '12px 20px', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{res.label}</div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            {actions.map(act => (
                                                <label key={act.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', cursor: (editingRole?.name === 'Admin' && act.id !== 'manage') ? 'not-allowed' : 'pointer', opacity: (editingRole?.name === 'Admin' && act.id !== 'manage') ? 0.5 : 1 }}>
                                                    <input
                                                        type="radio"
                                                        name={`res-${res.id}`}
                                                        value={act.id}
                                                        checked={(formData.permissions[res.id] || 'none') === act.id || (editingRole?.name === 'Admin' && act.id === 'manage')}
                                                        onChange={() => handlePermissionChange(res.id, act.id)}
                                                        disabled={editingRole?.name === 'Admin'}
                                                    />
                                                    {act.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                    <Check size={18} /> Salvar Configurações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
