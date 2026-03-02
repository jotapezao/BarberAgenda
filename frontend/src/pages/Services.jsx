import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, X, Scissors, Image as ImageIcon, Upload } from 'lucide-react';

export default function Services() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', duration: 30, show_on_home: 1, image_url: '' });
    const toast = useToast();

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const data = await adminApi.getServices();
            setServices(data);
        } catch (err) {
            toast.error('Erro ao carregar serviços');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (service = null) => {
        if (service) {
            setEditingService(service);
            setFormData({ name: service.name, price: service.price, duration: service.duration, show_on_home: service.show_on_home, image_url: service.image_url });
        } else {
            setEditingService(null);
            setFormData({ name: '', price: '', duration: 30, show_on_home: 1, image_url: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingService) {
                await adminApi.updateService(editingService.id, {
                    ...formData,
                    price: parseFloat(formData.price),
                    active: editingService.active
                });
                toast.success('Serviço atualizado!');
            } else {
                await adminApi.createService({
                    ...formData,
                    price: parseFloat(formData.price)
                });
                toast.success('Serviço criado!');
            }
            setShowModal(false);
            loadServices();
        } catch (err) {
            toast.error(err.message || 'Erro ao salvar serviço');
        }
    };

    const handleFileUpload = async (file) => {
        try {
            const { url } = await adminApi.uploadImage(file);
            setFormData(prev => ({ ...prev, image_url: url }));
            toast.success('Imagem carregada!');
        } catch (err) { toast.error('Erro no upload'); }
    };

    const toggleActive = async (service) => {
        try {
            await adminApi.updateService(service.id, {
                ...service,
                active: !service.active
            });
            toast.success(service.active ? 'Serviço desativado' : 'Serviço ativado');
            loadServices();
        } catch (err) {
            toast.error('Erro ao alterar status');
        }
    };

    const deleteService = async (id) => {
        if (!window.confirm('Tem certeza que deseja remover este serviço?')) return;
        try {
            await adminApi.deleteService(id);
            toast.success('Serviço removido');
            loadServices();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="loading-spinner"><div className="spinner"></div></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="section-header-admin">
                <div>
                    <h1>Serviços</h1>
                    <p className="text-secondary">Gerencie os serviços oferecidos no seu site</p>
                </div>
                <div className="admin-header-actions">
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        Novo Serviço
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 150px 180px', padding: '15px 24px', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    <div>IMAGEM</div>
                    <div>SERVIÇO</div>
                    <div style={{ textAlign: 'center' }}>DURAÇÃO</div>
                    <div style={{ textAlign: 'center' }}>STATUS</div>
                    <div style={{ textAlign: 'right' }}>AÇÕES</div>
                </div>
                {services.map(service => (
                    <div key={service.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 150px 180px', padding: '15px 24px', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--color-bg-secondary)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                            {service.image_url ? (
                                <img src={`${API_BASE}${service.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Scissors size={20} style={{ margin: 12, opacity: 0.2 }} />
                            )}
                        </div>
                        <div>
                            <h4 style={{ margin: 0 }}>{service.name}</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700 }}>{formatPrice(service.price)}</p>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>{service.duration} min</div>
                        <div style={{ textAlign: 'center' }}>
                            <span className={`badge ${service.active ? 'badge-confirmed' : 'badge-cancelled'}`} style={{ fontSize: '0.75rem' }}>
                                {service.active ? 'ATIVO' : 'INATIVO'}
                            </span>
                            {service.show_on_home === 1 && <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Exibindo na Home</div>}
                        </div>
                        <div className="flex-center" style={{ justifyContent: 'flex-end', gap: 10 }}>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }} onClick={() => openModal(service)}><Edit3 size={14} /></button>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }} onClick={() => toggleActive(service)}>
                                {service.active ? <ToggleRight size={14} color="var(--color-success)" /> : <ToggleLeft size={14} />}
                            </button>
                            <button className="btn btn-danger btn-sm" style={{ padding: '6px 10px' }} onClick={() => deleteService(service.id)}><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}

                {services.length === 0 && (
                    <div className="card empty-state" style={{ padding: 60 }}>
                        <Scissors size={48} />
                        <h3>Nenhum serviço cadastrado</h3>
                        <p>Comece adicionando os serviços da barbearia</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Nome do Serviço</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: Corte Degradê"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Preço (R$)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Duração (minutos)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="30"
                                        min="5"
                                        step="5"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="flex-center" style={{ gap: 10, cursor: 'pointer', justifyContent: 'flex-start' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.show_on_home === 1}
                                            onChange={e => setFormData({ ...formData, show_on_home: e.target.checked ? 1 : 0 })}
                                            style={{ width: 18, height: 18 }}
                                        />
                                        <span>Exibir este serviço na página inicial do site</span>
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Imagem do Serviço (Opcional)</label>
                                    <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                                        <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--color-bg-secondary)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                                            {formData.image_url ? <img src={`${API_BASE}${formData.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={20} style={{ margin: 20, opacity: 0.3 }} />}
                                        </div>
                                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                                            <Upload size={14} /> Carregar Imagem
                                            <input type="file" hidden accept="image/*" onChange={e => handleFileUpload(e.target.files[0])} />
                                        </label>
                                        {formData.image_url && <button type="button" className="btn btn-danger btn-sm" onClick={() => setFormData({ ...formData, image_url: '' })}>Remover</button>}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
