import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { DollarSign, TrendingUp, Users, Activity, Settings, Plus, XCircle, Trash2, Calendar, BarChart2, Target, Scissors, CreditCard, Download } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: { color: '#a0a0a0', font: { family: 'Inter', size: 12 } },
        },
        tooltip: {
            backgroundColor: '#1a1a1a',
            borderColor: '#2a2a2a',
            borderWidth: 1,
            titleColor: '#f5f5f5',
            bodyColor: '#a0a0a0',
            titleFont: { family: 'Inter', weight: '600' },
            bodyFont: { family: 'Inter' },
            padding: 12,
            cornerRadius: 8,
        },
    },
    scales: {
        x: {
            ticks: { color: '#666', font: { family: 'Inter', size: 11 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: '#2a2a2a' },
        },
        y: {
            ticks: {
                color: '#666',
                font: { family: 'Inter', size: 11 },
                callback: (value) => `R$${value}`,
            },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: '#2a2a2a' },
        },
    },
};

const SERVICE_COLORS = ['#d4a548', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#ec4899', '#f97316', '#06b6d4'];

const formatPrice = (price) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price || 0);

function KpiCard({ icon: Icon, label, value, sub, color = 'var(--color-accent)', iconBg }) {
    return (
        <div className="card financial-card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: 'var(--color-text-muted)', lineHeight: 1.2 }}>{label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg || 'rgba(212,165,72,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
            {sub && <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>{sub}</p>}
        </div>
    );
}

export default function Financial() {
    const today = new Date().toISOString().split('T')[0];

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [barbers, setBarbers] = useState([]);
    const [paying, setPaying] = useState(false);
    const [showPaymentSettings, setShowPaymentSettings] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [newMethod, setNewMethod] = useState({ name: '', fee_percentage: '', fee_fixed: '', active: 1 });
    const [activePreset, setActivePreset] = useState('today');

    // Default: hoje (início e fim do dia)
    const [filters, setFilters] = useState({
        startDate: today,
        endDate: today,
        barberId: ''
    });

    const toast = useToast();

    const userJson = localStorage.getItem('user');
    const userBuffer = userJson ? JSON.parse(userJson) : { role: 'admin' };
    const isAdmin = userBuffer.role === 'admin';

    useEffect(() => {
        loadFinancial();
        loadBarbers();
    }, [filters]);

    const loadBarbers = async () => {
        try { setBarbers(await adminApi.getBarbers()); }
        catch (err) { console.error(err); }
    };

    const loadFinancial = async () => {
        setLoading(true);
        try { setData(await adminApi.getFinancial(filters)); }
        catch (err) { toast.error('Erro ao carregar dados financeiros'); }
        finally { setLoading(false); }
    };

    const loadPaymentMethods = async () => {
        try { setPaymentMethods(await adminApi.getPaymentMethods()); }
        catch (err) { console.error(err); }
    };

    const applyPreset = (preset) => {
        setActivePreset(preset);
        const now = new Date();
        const fmt = (d) => d.toISOString().split('T')[0];
        if (preset === 'today') {
            setFilters(f => ({ ...f, startDate: today, endDate: today }));
        } else if (preset === 'week') {
            const start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            setFilters(f => ({ ...f, startDate: fmt(start), endDate: today }));
        } else if (preset === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            setFilters(f => ({ ...f, startDate: fmt(start), endDate: today }));
        } else if (preset === 'lastmonth') {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            setFilters(f => ({ ...f, startDate: fmt(start), endDate: fmt(end) }));
        }
    };

    const handlePay = async (barberId, amount) => {
        if (!amount || amount <= 0) return;
        if (!window.confirm(`Confirmar registro de pagamento de ${formatPrice(amount)}?`)) return;
        setPaying(true);
        try {
            await adminApi.payCommission(barberId, amount);
            toast.success('Pagamento registrado!');
            loadFinancial();
        } catch (err) { toast.error('Erro ao registrar pagamento'); }
        finally { setPaying(false); }
    };

    const handleSavePaymentMethod = async (e) => {
        e.preventDefault();
        try {
            await adminApi.createPaymentMethod(newMethod);
            toast.success('Método adicionado');
            setNewMethod({ name: '', fee_percentage: '', fee_fixed: '', active: 1 });
            loadPaymentMethods();
        } catch (err) { toast.error(err.message || 'Erro ao adicionar método'); }
    };

    const togglePaymentMethodStatus = async (pm) => {
        try {
            await adminApi.updatePaymentMethod(pm.id, { ...pm, active: pm.active === 1 ? 0 : 1 });
            loadPaymentMethods();
        } catch (err) { toast.error('Erro ao atualizar'); }
    };

    const handleDeletePaymentMethod = async (id) => {
        if (!window.confirm('Excluir este método?')) return;
        try {
            await adminApi.deletePaymentMethod(id);
            toast.success('Método excluído');
            loadPaymentMethods();
        } catch (err) { toast.error('Erro ao excluir'); }
    };

    const exportToCSV = () => {
        if (!data?.transactions) return;
        const headers = ["Data", "Hora", "Cliente", "Serviço", "Barbeiro", "Método", "Desconto", "Valor Líquido"];
        const rows = data.transactions.map(t => [
            t.date, t.time, `"${t.client_name}"`, `"${t.service_name}"`,
            t.barber_name || 'N/A', t.payment_method || 'N/A',
            t.discount || '0', t.amount
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `financeiro_${filters.startDate}_ate_${filters.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Chart Data ---
    const dailyChartData = {
        labels: (data?.dailyRevenue || []).map(d => { const [, m, day] = d.date.split('-'); return `${day}/${m}`; }),
        datasets: [{
            label: 'Faturamento (R$)',
            data: (data?.dailyRevenue || []).map(d => d.revenue),
            backgroundColor: 'rgba(212, 165, 72, 0.2)',
            borderColor: '#d4a548',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#d4a548',
            pointRadius: 4,
            pointHoverRadius: 7,
        }],
    };

    const servicesRevenueChartData = {
        labels: (data?.topServices || []).map(s => s.name),
        datasets: [{
            label: 'Receita (R$)',
            data: (data?.topServices || []).map(s => s.revenue),
            backgroundColor: SERVICE_COLORS.slice(0, (data?.topServices || []).length),
            borderRadius: 6,
            borderWidth: 0,
        }],
    };

    const servicesCountChartData = {
        labels: (data?.topServices || []).map(s => s.name),
        datasets: [{
            data: (data?.topServices || []).map(s => s.count),
            backgroundColor: SERVICE_COLORS.slice(0, (data?.topServices || []).length),
            borderWidth: 0,
            hoverOffset: 8,
        }],
    };

    const paymentMethodsChartData = {
        labels: (data?.paymentMethods || []).map(p => p.method),
        datasets: [{
            data: (data?.paymentMethods || []).map(p => p.revenue),
            backgroundColor: SERVICE_COLORS.slice(0, (data?.paymentMethods || []).length),
            borderWidth: 0,
        }],
    };

    const barberPerformanceChartData = {
        labels: (data?.individualCommissions || []).map(c => c.barber_name),
        datasets: [
            {
                label: 'Receita Gerada (R$)',
                data: (data?.individualCommissions || []).map(c => c.total_revenue),
                backgroundColor: 'rgba(212, 165, 72, 0.8)',
                borderRadius: 6,
                borderWidth: 0,
            },
            {
                label: 'Comissão (R$)',
                data: (data?.individualCommissions || []).map(c => c.period_commission),
                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                borderRadius: 6,
                borderWidth: 0,
            }
        ],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#a0a0a0', font: { family: 'Inter', size: 11 }, padding: 14, usePointStyle: true },
            },
            tooltip: chartDefaults.plugins.tooltip,
        },
    };

    const barOptions = {
        ...chartDefaults,
        plugins: {
            ...chartDefaults.plugins,
            legend: { display: false },
        },
    };

    const isToday = filters.startDate === today && filters.endDate === today;
    const periodLabel = filters.startDate === filters.endDate
        ? `${filters.startDate.split('-').reverse().join('/')}`
        : `${filters.startDate.split('-').reverse().join('/')} até ${filters.endDate.split('-').reverse().join('/')}`;

    const month = data?.month || {};

    return (
        <AdminLayout>
            {/* ── Header + Filtros ── */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Financeiro</h1>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                            Período: <strong style={{ color: 'var(--color-accent)' }}>{periodLabel}</strong>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-sm" onClick={exportToCSV} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Download size={14} /> CSV
                        </button>
                        {isAdmin && (
                            <button className="btn btn-sm btn-primary" onClick={() => { setShowPaymentSettings(true); loadPaymentMethods(); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Settings size={14} /> Taxas
                            </button>
                        )}
                    </div>
                </div>

                {/* Presets de período */}
                <div className="card" style={{ padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                            { key: 'today', label: '📅 Hoje' },
                            { key: 'week', label: '📆 Semana' },
                            { key: 'month', label: '🗓 Mês Atual' },
                            { key: 'lastmonth', label: '📁 Mês Anterior' },
                        ].map(p => (
                            <button key={p.key}
                                onClick={() => applyPreset(p.key)}
                                className="btn btn-sm"
                                style={{
                                    background: activePreset === p.key ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)',
                                    color: activePreset === p.key ? '#000' : '#fff',
                                    border: '1px solid var(--color-border)',
                                    fontWeight: activePreset === p.key ? 700 : 500,
                                    fontSize: '0.8rem',
                                }}
                            >{p.label}</button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>De</label>
                            <input type="date" className="btn btn-sm" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: '#fff' }}
                                value={filters.startDate}
                                onChange={e => { setActivePreset('custom'); setFilters({ ...filters, startDate: e.target.value }); }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Até</label>
                            <input type="date" className="btn btn-sm" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: '#fff' }}
                                value={filters.endDate}
                                onChange={e => { setActivePreset('custom'); setFilters({ ...filters, endDate: e.target.value }); }} />
                        </div>
                        {isAdmin && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Barbeiro</label>
                                <select className="btn btn-sm" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: '#fff', minWidth: 130 }}
                                    value={filters.barberId}
                                    onChange={e => setFilters({ ...filters, barberId: e.target.value })}>
                                    <option value="">Todos</option>
                                    {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : (
                <>
                    {/* ── KPI Cards ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                        <KpiCard
                            icon={DollarSign}
                            label="Faturamento Bruto"
                            value={formatPrice(month.totalRevenue || month.revenue)}
                            sub="Serviços + Produtos"
                            color="var(--color-accent)"
                            iconBg="rgba(212,165,72,0.15)"
                        />
                        <KpiCard
                            icon={Scissors}
                            label="Atendimentos"
                            value={month.appointments || 0}
                            sub={`Ticket médio: ${formatPrice(month.avgTicket)}`}
                            color="#3b82f6"
                            iconBg="rgba(59,130,246,0.15)"
                        />
                        <KpiCard
                            icon={Activity}
                            label="Venda de Produtos"
                            value={formatPrice(month.productSales || 0)}
                            sub={`Lucro prod.: ${formatPrice(month.productProfit || 0)}`}
                            color="#22c55e"
                            iconBg="rgba(34,197,94,0.15)"
                        />
                        <KpiCard
                            icon={Target}
                            label="Descontos"
                            value={formatPrice(month.total_discounts)}
                            sub="Cortesias e bonificações"
                            color="#f97316"
                            iconBg="rgba(249,115,22,0.15)"
                        />
                        {isAdmin ? (
                            <>
                                <KpiCard
                                    icon={Users}
                                    label="Comissões"
                                    value={formatPrice(month.totalCommissions)}
                                    sub={`Taxas pgto: ${formatPrice(month.totalPaymentFees)}`}
                                    color="#ef4444"
                                    iconBg="rgba(239,68,68,0.15)"
                                />
                                <KpiCard
                                    icon={TrendingUp}
                                    label="Lucro Líquido Est."
                                    value={formatPrice(month.estimatedNetProfit)}
                                    sub="Bruto − Comissões − Taxas"
                                    color={month.estimatedNetProfit >= 0 ? '#22c55e' : '#ef4444'}
                                    iconBg={month.estimatedNetProfit >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}
                                />
                            </>
                        ) : (
                            <>
                                <KpiCard icon={Scissors} label="Meus Atendimentos" value={month.appointments || 0} color="#3b82f6" iconBg="rgba(59,130,246,0.15)" />
                                <KpiCard icon={DollarSign} label="Minha Comissão" value={formatPrice(data?.individualCommissions?.[0]?.period_commission)} color="var(--color-accent)" iconBg="rgba(212,165,72,0.15)" />
                            </>
                        )}
                    </div>

                    {/* ── Gráficos ── */}
                    <div className="charts-grid">

                        {/* Evolução do Faturamento */}
                        <div className="card chart-card" style={{ gridColumn: 'span 2' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <TrendingUp size={18} /> Evolução do Faturamento
                            </h3>
                            <div style={{ height: 260 }}>
                                {(data?.dailyRevenue || []).length > 0 ? (
                                    <Line data={dailyChartData} options={chartDefaults} />
                                ) : (
                                    <div className="empty-state"><p>Sem dados para o período</p></div>
                                )}
                            </div>
                        </div>

                        {/* Serviços mais procurados — Donut */}
                        <div className="card chart-card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Scissors size={18} /> Serviços (Qtd.)</h3>
                            <div style={{ height: 260 }}>
                                {(data?.topServices || []).length > 0 ? (
                                    <Doughnut data={servicesCountChartData} options={doughnutOptions} />
                                ) : (
                                    <div className="empty-state"><p>Sem dados</p></div>
                                )}
                            </div>
                        </div>

                        {/* Serviços — Receita Bar */}
                        <div className="card chart-card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChart2 size={18} /> Receita por Serviço</h3>
                            <div style={{ height: 260 }}>
                                {(data?.topServices || []).length > 0 ? (
                                    <Bar data={servicesRevenueChartData} options={barOptions} />
                                ) : (
                                    <div className="empty-state"><p>Sem dados</p></div>
                                )}
                            </div>
                        </div>

                        {/* Métodos de Pagamento */}
                        <div className="card chart-card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CreditCard size={18} /> Métodos de Pagamento</h3>
                            <div style={{ height: 260 }}>
                                {(data?.paymentMethods || []).length > 0 ? (
                                    <Doughnut data={paymentMethodsChartData} options={doughnutOptions} />
                                ) : (
                                    <div className="empty-state"><p>Sem dados</p></div>
                                )}
                            </div>
                            {/* Tabela de métodos com taxas */}
                            {(data?.paymentMethods || []).length > 0 && (
                                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {data.paymentMethods.map((pm, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: SERVICE_COLORS[i % SERVICE_COLORS.length], display: 'inline-block' }}></span>
                                                {pm.method} <span style={{ opacity: 0.5 }}>({pm.count}x)</span>
                                            </span>
                                            <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{formatPrice(pm.revenue)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Performance por barbeiro — apenas admin */}
                        {isAdmin && (data?.individualCommissions || []).length > 0 && (
                            <div className="card chart-card">
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} /> Performance por Barbeiro</h3>
                                <div style={{ height: 260 }}>
                                    <Bar data={barberPerformanceChartData} options={{
                                        ...chartDefaults,
                                        plugins: { ...chartDefaults.plugins, legend: { ...chartDefaults.plugins.legend, display: true } }
                                    }} />
                                </div>
                            </div>
                        )}

                        {/* Transações */}
                        <div className="card chart-card" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}><Activity size={18} /> Transações do Período</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{(data?.transactions || []).length} registros</span>
                            </div>
                            {(data?.transactions || []).length > 0 ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                {['Data/Hora', 'Cliente', 'Serviço', 'Barbeiro', 'Método', 'Desconto', 'Valor'].map(h => (
                                                    <th key={h} style={{ textAlign: h === 'Valor' || h === 'Desconto' ? 'right' : 'left', padding: '10px 8px', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.transactions.map((t, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                                                        {t.date.split('-').reverse().join('/')} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{t.time}</span>
                                                    </td>
                                                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{t.client_name}</td>
                                                    <td style={{ padding: '10px 8px', color: 'var(--color-text-secondary)' }}>{t.service_name}</td>
                                                    <td style={{ padding: '10px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{t.barber_name || '—'}</td>
                                                    <td style={{ padding: '10px 8px' }}>
                                                        <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.07)', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                                                            {t.payment_method || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#f97316', fontSize: '0.8rem' }}>
                                                        {t.discount > 0 ? `-${formatPrice(t.discount)}` : '—'}
                                                    </td>
                                                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--color-accent)' }}>
                                                        {formatPrice(t.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ borderTop: '2px solid var(--color-border)' }}>
                                                <td colSpan={5} style={{ padding: '10px 8px', fontWeight: 700, fontSize: '0.85rem' }}>Total do período</td>
                                                <td style={{ padding: '10px 8px', textAlign: 'right', color: '#f97316', fontWeight: 700 }}>
                                                    -{formatPrice(month.total_discounts)}
                                                </td>
                                                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 900, color: 'var(--color-accent)', fontSize: '1rem' }}>
                                                    {formatPrice(month.totalRevenue || month.revenue)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-state"><p>Sem transações no período</p></div>
                            )}
                        </div>

                        {/* Comissões */}
                        {isAdmin && (
                            <div className="card chart-card" style={{ gridColumn: 'span 2' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} /> Relatório de Comissões</h3>
                                {(data?.individualCommissions || []).length > 0 ? (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                    {['Barbeiro', 'Atend.', 'Receita Gerada', 'Comissão (Período)', 'Total Acumulado', 'Saldo a Pagar', ''].map(h => (
                                                        <th key={h} style={{ textAlign: h === 'Barbeiro' || h === '' ? 'left' : 'right', padding: '10px 8px', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.individualCommissions.map((c, i) => {
                                                    const balance = c.total_commission_earned - c.total_commission_paid;
                                                    return (
                                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                            <td style={{ padding: '10px 8px', fontWeight: 700 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: '0.8rem' }}>
                                                                        {c.barber_name?.charAt(0)}
                                                                    </div>
                                                                    {c.barber_name}
                                                                </div>
                                                            </td>
                                                            <td style={{ textAlign: 'right', padding: '10px 8px' }}>{c.service_count}</td>
                                                            <td style={{ textAlign: 'right', padding: '10px 8px' }}>{formatPrice(c.total_revenue)}</td>
                                                            <td style={{ textAlign: 'right', padding: '10px 8px', color: '#ef4444', fontWeight: 600 }}>{formatPrice(c.period_commission)}</td>
                                                            <td style={{ textAlign: 'right', padding: '10px 8px', color: 'var(--color-text-muted)' }}>{formatPrice(c.total_commission_earned)}</td>
                                                            <td style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 800, color: balance > 0 ? '#ef4444' : '#22c55e' }}>
                                                                {formatPrice(balance)}
                                                            </td>
                                                            <td style={{ textAlign: 'right', padding: '10px 8px' }}>
                                                                <button className="btn btn-sm btn-primary"
                                                                    onClick={() => handlePay(c.id, balance)}
                                                                    disabled={paying || balance <= 0}
                                                                    style={{ padding: '4px 14px', fontSize: '0.75rem', opacity: balance <= 0 ? 0.4 : 1 }}>
                                                                    Liquidar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-state"><p>Sem dados de comissão para o período</p></div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal: Taxas e Pagamentos */}
            {showPaymentSettings && (
                <div className="modal-overlay" onClick={() => setShowPaymentSettings(false)}>
                    <div className="modal animate-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: 650, borderRadius: 24 }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Settings size={20} className="text-accent" /> Taxas e Métodos de Pagamento
                            </h2>
                            <button className="btn-icon" onClick={() => setShowPaymentSettings(false)}><XCircle size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                Configure as taxas de cada método de pagamento. O sistema usa esses valores para calcular o <strong>Lucro Líquido Real</strong>.
                            </p>
                            <form onSubmit={handleSavePaymentMethod} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 12, border: '1px solid var(--color-border)' }}>
                                <div style={{ flex: 2 }}>
                                    <label className="form-label">Método</label>
                                    <input type="text" className="form-input btn-sm" placeholder="Ex: Cartão de Crédito" value={newMethod.name} onChange={e => setNewMethod({ ...newMethod, name: e.target.value })} required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="form-label">Taxa (%)</label>
                                    <input type="number" step="0.01" className="form-input btn-sm" placeholder="3.5" value={newMethod.fee_percentage} onChange={e => setNewMethod({ ...newMethod, fee_percentage: e.target.value })} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="form-label">Taxa (R$)</label>
                                    <input type="number" step="0.01" className="form-input btn-sm" placeholder="0.00" value={newMethod.fee_fixed} onChange={e => setNewMethod({ ...newMethod, fee_fixed: e.target.value })} />
                                </div>
                                <button type="submit" className="btn btn-sm btn-primary" style={{ padding: '0 15px' }}><Plus size={18} /></button>
                            </form>
                            <div style={{ maxHeight: 350, overflowY: 'auto', paddingRight: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {paymentMethods.map(pm => (
                                    <div key={pm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: pm.active ? '#fff' : 'var(--color-text-muted)', textDecoration: pm.active ? 'none' : 'line-through' }}>{pm.name}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                                                {parseFloat(pm.fee_percentage) > 0 ? `${pm.fee_percentage}% ` : 'Sem taxa (%) '}
                                                {parseFloat(pm.fee_fixed) > 0 && `| Fixo: R$ ${pm.fee_fixed}`}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className={`btn btn-sm ${pm.active ? 'btn-danger' : 'btn-success'}`} onClick={() => togglePaymentMethodStatus(pm)} style={{ padding: '4px 12px' }}>
                                                {pm.active ? 'Desativar' : 'Ativar'}
                                            </button>
                                            <button className="btn-icon text-danger" onClick={() => handleDeletePaymentMethod(pm.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
