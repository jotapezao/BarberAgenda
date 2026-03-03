import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { Package, Plus, Search, Filter, AlertTriangle, TrendingUp, DollarSign, Edit2, Trash2, ShoppingBag, List, Grid } from 'lucide-react';

export default function Stock() {
    const [products, setProducts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showProductModal, setShowProductModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [sellingProduct, setSellingProduct] = useState(null);
    const [sellQty, setSellQty] = useState(1);
    const [productForm, setProductForm] = useState({
        name: '', description: '', price: 0, cost_price: 0, stock_quantity: 0, min_stock: 5, category: 'Geral', image: ''
    });

    const toast = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [prodData, sumData] = await Promise.all([adminApi.getProducts(), adminApi.getStockSummary()]);
            setProducts(prodData);
            setSummary(sumData);
            setLoading(false);
        } catch (err) { toast.error('Erro ao carregar estoque'); }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await adminApi.updateProduct(editingProduct.id, productForm);
                toast.success('Produto atualizado');
            } else {
                await adminApi.createProduct(productForm);
                toast.success('Produto criado');
            }
            setShowProductModal(false);
            loadData();
        } catch (err) { toast.error('Erro ao salvar produto'); }
    };

    const handleSellSubmit = async (e) => {
        e.preventDefault();
        try {
            await adminApi.sellProduct(sellingProduct.id, { quantity: sellQty });
            toast.success('Venda registrada');
            setShowSellModal(false);
            loadData();
        } catch (err) { toast.error(err.message); }
    };

    const deleteProduct = async (id) => {
        if (!window.confirm('Excluir este produto?')) return;
        try {
            await adminApi.deleteProduct(id);
            toast.success('Removido');
            loadData();
        } catch (err) { toast.error('Erro ao remover'); }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const { url } = await adminApi.uploadImage(file);
            setProductForm(prev => ({ ...prev, image: url }));
            toast.success('Imagem carregada!');
        } catch (err) { toast.error('Erro no upload'); }
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

    const formatPrice = (p) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p || 0);

    if (loading) return <AdminLayout><div className="loading-spinner"><div className="spinner"></div></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="animate-fade">
                <div className="section-header-admin">
                    <div>
                        <h1>Gestão de Estoque</h1>
                        <p>Controle de produtos, estoque e vendas</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: 0, cost_price: 0, stock_quantity: 0, min_stock: 5, category: 'Geral', image: '' }); setShowProductModal(true); }}>
                        <Plus size={20} /> Novo Produto
                    </button>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon"><Package color="var(--color-accent)" /></div>
                        <div className="stat-info">
                            <span className="stat-label">Total de Itens</span>
                            <span className="stat-value">{summary?.totalProducts || 0}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><DollarSign color="var(--color-success)" /></div>
                        <div className="stat-info">
                            <span className="stat-label">Valor em Gôndola</span>
                            <span className="stat-value">{formatPrice(summary?.totalValue)}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><TrendingUp color="var(--color-accent)" /></div>
                        <div className="stat-info">
                            <span className="stat-label">Vendas do Mês</span>
                            <span className="stat-value">{formatPrice(summary?.monthSalesTotal)}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><AlertTriangle color={summary?.lowStock?.length > 0 ? "var(--color-danger)" : "var(--color-success)"} /></div>
                        <div className="stat-info">
                            <span className="stat-label">Baixo Estoque</span>
                            <span className="stat-value">{summary?.lowStock?.length || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
                    <div className="table-filters" style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
                        <div className="search-box">
                            <Search size={18} />
                            <input type="text" placeholder="Buscar produto por nome, SKU ou categoria..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <div className="stock-table-container">
                        <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 120px 120px 150px', padding: '15px 24px', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                            <div>SKU</div>
                            <div>PRODUTO / CATEGORIA</div>
                            <div style={{ textAlign: 'center' }}>CUSTO</div>
                            <div style={{ textAlign: 'center' }}>VENDA</div>
                            <div style={{ textAlign: 'center' }}>ESTOQUE</div>
                            <div style={{ textAlign: 'right' }}>AÇÕES</div>
                        </div>
                        {filteredProducts.map(product => (
                            <div key={product.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 120px 120px 150px', padding: '15px 24px', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{product.sku || 'N/A'}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--color-bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {product.image ? (
                                            <img src={`${BASE_URL}${product.image}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Package size={20} style={{ opacity: 0.2 }} />
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{product.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{product.category}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{formatPrice(product.cost_price)}</div>
                                <div style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>{formatPrice(product.price)}</div>
                                <div style={{ textAlign: 'center' }}>
                                    <span className={`badge ${product.stock_quantity <= product.min_stock ? 'badge-cancelled' : 'badge-confirmed'}`} style={{ fontSize: '0.8rem', minWidth: 60 }}>
                                        {product.stock_quantity} un
                                    </span>
                                    {product.stock_quantity <= product.min_stock && <div style={{ fontSize: '0.65rem', color: 'var(--color-danger)', marginTop: 4 }}>REPOR ESTOQUE</div>}
                                </div>
                                <div className="flex-center" style={{ justifyContent: 'flex-end', gap: 8 }}>
                                    <button className="btn btn-secondary btn-sm" title="Vender" onClick={() => { setSellingProduct(product); setSellQty(1); setShowSellModal(true); }}><ShoppingBag size={14} /></button>
                                    <button className="btn btn-secondary btn-sm" title="Editar" onClick={() => { setEditingProduct(product); setProductForm(product); setShowProductModal(true); }}><Edit2 size={14} /></button>
                                    <button className="btn btn-danger btn-sm" title="Excluir" onClick={() => deleteProduct(product.id)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                        {filteredProducts.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
                                <Package size={48} style={{ opacity: 0.1, marginBottom: 15 }} />
                                <p>Nenhum produto encontrado.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Modal */}
                {showProductModal && (
                    <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                            </div>
                            <form onSubmit={handleProductSubmit}>
                                <div className="modal-body">
                                    <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                                        <div style={{ width: 100, height: 100, borderRadius: 8, background: 'var(--color-bg-secondary)', border: '2px dashed var(--color-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                            {productForm.image ? (
                                                <img src={`${BASE_URL}${productForm.image}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <ImageIcon size={30} style={{ opacity: 0.2 }} />
                                            )}
                                            <input type="file" onChange={handlePhotoUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} accept="image/*" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="form-group">
                                                <label className="form-label">Nome do Produto</label>
                                                <input type="text" className="form-input" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">SKU / Cód. Barras</label>
                                                <input type="text" className="form-input" placeholder="Ex: PROD-001" value={productForm.sku || ''} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Categoria</label>
                                        <input type="text" className="form-input" placeholder="Ex: Cabelo, Barba, Acessórios" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label className="form-label">Preço de Venda (R$)</label>
                                            <input type="number" step="0.01" className="form-input" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Preço de Custo (R$)</label>
                                            <input type="number" step="0.01" className="form-input" value={productForm.cost_price} onChange={e => setProductForm({ ...productForm, cost_price: e.target.value })} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label className="form-label">Qtd em Estoque</label>
                                            <input type="number" className="form-input" value={productForm.stock_quantity} onChange={e => setProductForm({ ...productForm, stock_quantity: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Estoque Mínimo</label>
                                            <input type="number" className="form-input" value={productForm.min_stock} onChange={e => setProductForm({ ...productForm, min_stock: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Descrição</label>
                                        <textarea className="form-input" rows="3" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })}></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Salvar Produto</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Sell Modal */}
                {showSellModal && (
                    <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                            <div className="modal-header">
                                <h2>Registrar Venda</h2>
                            </div>
                            <form onSubmit={handleSellSubmit}>
                                <div className="modal-body">
                                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                        <h3 style={{ color: 'var(--color-accent)' }}>{sellingProduct.name}</h3>
                                        <p className="text-secondary">{formatPrice(sellingProduct.price)} / un</p>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Quantidade</label>
                                        <input type="number" min="1" max={sellingProduct.stock_quantity} className="form-input" value={sellQty} onChange={e => setSellQty(parseInt(e.target.value))} required />
                                    </div>
                                    <div className="card" style={{ background: 'var(--color-bg-secondary)', textAlign: 'center' }}>
                                        <span className="text-secondary">Total da Venda</span>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>{formatPrice(sellingProduct.price * sellQty)}</div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowSellModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Finalizar Venda</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
