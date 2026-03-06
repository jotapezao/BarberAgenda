import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi, BASE_URL } from '../api';
import { useToast } from '../components/Toast';
import { Star, Eye, EyeOff, Trash2, CheckCircle, Clock } from 'lucide-react';

export default function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            const data = await adminApi.getReviews();
            setReviews(data);
            setLoading(false);
        } catch (err) { toast.error('Erro ao carregar avaliações'); }
    };

    const toggleHome = async (id, current) => {
        try {
            await adminApi.updateReview(id, { show_on_home: !current });
            setReviews(reviews.map(r => r.id === id ? { ...r, show_on_home: !current ? 1 : 0 } : r));
            toast.success('Status atualizado');
        } catch (err) { toast.error('Erro ao atualizar'); }
    };

    const markRead = async (id) => {
        try {
            await adminApi.updateReview(id, { is_read: 1 });
            setReviews(reviews.map(r => r.id === id ? { ...r, is_read: 1 } : r));
        } catch (err) { console.error(err); }
    };

    const deleteReview = async (id) => {
        if (!window.confirm('Excluir esta avaliação?')) return;
        try {
            await adminApi.deleteReview(id);
            setReviews(reviews.filter(r => r.id !== id));
            toast.success('Avaliação excluída');
        } catch (err) { toast.error('Erro ao excluir'); }
    };

    const renderStars = (rating) => {
        return [...Array(10)].map((_, i) => (
            <Star key={i} size={14} fill={i < rating ? "var(--color-accent)" : "none"} stroke={i < rating ? "var(--color-accent)" : "currentColor"} style={{ opacity: i < rating ? 1 : 0.3 }} />
        ));
    };

    return (
        <AdminLayout>
            <div className="animate-fade">
                <div className="section-header-admin">
                    <div>
                        <h1>Avaliações dos Clientes</h1>
                        <p>Gerencie os feedbacks recebidos e selecione os destaques para a Home</p>
                    </div>
                </div>

                {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : (
                    <div className="grid grid-cols-1 gap-20">
                        {reviews.length > 0 ? reviews.map(r => (
                            <div key={r.id}
                                className={`card review-card ${r.is_read ? '' : 'unread'}`}
                                style={{
                                    position: 'relative',
                                    borderLeft: r.is_read ? '4px solid transparent' : '4px solid var(--color-accent)',
                                    opacity: r.is_read ? 0.9 : 1
                                }}
                                onMouseEnter={() => !r.is_read && markRead(r.id)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {r.client_name}
                                            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </span>
                                        </h3>
                                        <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                                            {renderStars(r.rating)}
                                            <span style={{ marginLeft: 8, fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent)' }}>{r.rating}/10</span>
                                        </div>
                                    </div>
                                    <div className="flex-center" style={{ gap: 8 }}>
                                        <button
                                            className={`btn-icon ${r.show_on_home ? 'text-accent' : 'text-muted'}`}
                                            onClick={() => toggleHome(r.id, r.show_on_home)}
                                            title={r.show_on_home ? "Remover da Home" : "Exibir na Home"}
                                        >
                                            {r.show_on_home ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                        <button className="btn-icon text-danger" onClick={() => deleteReview(r.id)} title="Excluir">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <p style={{ fontStyle: 'italic', color: 'var(--color-text-main)', marginBottom: 15, fontSize: '0.95rem' }}>"{r.comment || 'Sem comentário'}"</p>
                                <div style={{ display: 'flex', gap: 15, fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 8 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={12} /> {r.service_info || 'Serviço não informado'}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} /> {r.barber_name ? `Com ${r.barber_name}` : 'Sem barbeiro'}</span>
                                </div>
                                {r.show_on_home === 1 && <div style={{ position: 'absolute', top: -10, right: 20, background: 'var(--color-accent)', color: '#000', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20, transform: 'rotate(5deg)' }}>DESTAQUE HOME</div>}
                            </div>
                        )) : (
                            <div className="card empty-state">
                                <Star size={48} style={{ opacity: 0.1, marginBottom: 15 }} />
                                <p>Nenhuma avaliação recebida ainda.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
