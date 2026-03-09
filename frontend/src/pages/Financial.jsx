import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { DollarSign, TrendingUp, Users, Activity } from 'lucide-react';
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

// Chart default options
const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: '#a0a0a0',
                font: { family: 'Inter', size: 12 },
            },
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

export default function Financial() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [barbers, setBarbers] = useState([]);
    const [paying, setPaying] = useState(false);

    // Filters logic
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(); monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        startDate: monthStartStr,
        endDate: today,
        barberId: ''
    });

    const toast = useToast();

    const handlePay = async (barberId, amount) => {
        if (!amount || amount <= 0) return;
        if (!window.confirm(`Confirmar registro de pagamento de ${formatPrice(amount)}?`)) return;
        setPaying(true);
        try {
            await adminApi.payCommission(barberId, amount);
            toast.success('Pagamento registrado!');
            loadFinancial();
        } catch (err) {
            toast.error('Erro ao registrar pagamento');
        } finally {
            setPaying(false);
        }
    };

    useEffect(() => {
        loadFinancial();
        loadBarbers();
    }, [filters]);

    const loadBarbers = async () => {
        try {
            const list = await adminApi.getBarbers();
            setBarbers(list);
        } catch (err) { console.error(err); }
    };

    const loadFinancial = async () => {
        try {
            const financial = await adminApi.getFinancial(filters);
            setData(financial);
        } catch (err) {
            toast.error('Erro ao carregar dados financeiros');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price || 0);
    };

    const userJson = localStorage.getItem('user');
    const userBuffer = userJson ? JSON.parse(userJson) : { role: 'admin' };
    const isAdmin = userBuffer.role === 'admin';

    if (loading) {
        return (
            <AdminLayout>
                <div className="loading-spinner"><div className="spinner"></div></div>
            </AdminLayout>
        );
    }

    // Prepare chart data
    const dailyChartData = {
        labels: (data?.dailyRevenue || []).map(d => {
            const [, m, day] = d.date.split('-');
            return `${day}/${m}`;
        }),
        datasets: [
            {
                label: 'Faturamento (R$)',
                data: (data?.dailyRevenue || []).map(d => d.revenue),
                backgroundColor: 'rgba(212, 165, 72, 0.3)',
                borderColor: '#d4a548',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#d4a548',
                pointBorderColor: '#d4a548',
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const monthlyChartData = {
        labels: (data?.monthlyRevenue || []).map(d => {
            const [y, m] = d.month.split('-');
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
        }),
        datasets: [
            {
                label: 'Faturamento (R$)',
                data: (data?.monthlyRevenue || []).map(d => d.revenue),
                backgroundColor: 'rgba(212, 165, 72, 0.6)',
                borderColor: '#d4a548',
                borderWidth: 1,
                borderRadius: 8,
                hoverBackgroundColor: '#d4a548',
            },
        ],
    };

    const serviceColors = [
        '#d4a548', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#ec4899', '#f97316',
    ];

    const servicesChartData = {
        labels: (data?.topServices || []).map(s => s.name),
        datasets: [
            {
                data: (data?.topServices || []).map(s => s.count),
                backgroundColor: serviceColors.slice(0, (data?.topServices || []).length),
                borderWidth: 0,
                hoverOffset: 8,
            },
        ],
    };

    const paymentMethodsChartData = {
        labels: (data?.paymentMethods || []).map(p => p.method),
        datasets: [
            {
                data: (data?.paymentMethods || []).map(p => p.revenue),
                backgroundColor: serviceColors.slice(0, (data?.paymentMethods || []).length),
                borderWidth: 0,
            }
        ]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#a0a0a0',
                    font: { family: 'Inter', size: 12 },
                    padding: 16,
                    usePointStyle: true,
                    pointStyleWidth: 10,
                },
            },
            tooltip: chartDefaults.plugins.tooltip,
        },
    };

    const exportToCSV = () => {
        if (!data?.transactions) return;
        const headers = ["Data", "Hora", "Cliente", "Serviço", "Valor", "Pagamento", "Barbeiro"];
        const rows = data.transactions.map(t => [
            t.date, t.time, t.client_name, t.service_name, t.amount, t.payment_method || 'N/A', t.barber_name
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `financeiro_${filters.startDate}_ate_${filters.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (
        <AdminLayout>
            <div className="section-header-admin" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1>Financeiro</h1>
                    <p className="text-secondary">Controle de faturamento e métricas de desempenho</p>
                </div>

                {/* Filter Bar */}
                <div className="card" style={{ padding: '12px 20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Início</label>
                        <input type="date" className="btn btn-sm" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: '#fff' }} value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Fim</label>
                        <input type="date" className="btn btn-sm" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: '#fff' }} value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>
                    {isAdmin && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Barbeiro</label>
                            <select className="btn btn-sm" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: '#fff', minWidth: '140px' }} value={filters.barberId} onChange={e => setFilters({ ...filters, barberId: e.target.value })}>
                                <option value="">Todos Barbeiros</option>
                                {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    )}
                    <button className="btn btn-sm" onClick={exportToCSV} style={{ marginTop: 'auto', marginBottom: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', height: '36px' }}>
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="financial-cards">
                <div className="card financial-card">
                    <h3>💰 Faturamento Bruto</h3>
                    <div className="value gold">{formatPrice(data?.month?.totalRevenue || data?.month?.revenue)}</div>
                    <p className="text-secondary" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                        Serviços + Produtos
                    </p>
                </div>

                <div className="card financial-card">
                    <h3>📦 Venda de Produtos</h3>
                    <div className="value">{formatPrice(data?.month?.productSales || 0)}</div>
                    <p className="text-secondary" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                        Lucro Prod: {formatPrice(data?.month?.productProfit || 0)}
                    </p>
                </div>

                <div className="card financial-card">
                    <h3>🎁 Descontos Aplicados</h3>
                    <div className="value" style={{ color: 'var(--color-info)' }}>{formatPrice(data?.month?.total_discounts)}</div>
                    <p className="text-secondary" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                        Cortesias e bonificações
                    </p>
                </div>

                {isAdmin ? (
                    <>
                        <div className="card financial-card">
                            <h3>💸 Comissões Totais</h3>
                            <div className="value" style={{ color: '#ef4444' }}>{formatPrice(data?.month?.totalCommissions)}</div>
                        </div>
                        <div className="card financial-card">
                            <h3>📈 Lucro Líquido Est.</h3>
                            <div className="value green">{formatPrice(data?.month?.estimatedNetProfit)}</div>
                            <p className="text-secondary" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                                Bruto - Comissões - Custos
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="card financial-card">
                            <h3>✂️ Meus Atendimentos</h3>
                            <div className="value" style={{ color: 'var(--color-info)' }}>{data?.month?.appointments || 0}</div>
                        </div>
                        <div className="card financial-card">
                            <h3>⭐ Minha Comissão</h3>
                            <div className="value gold">{formatPrice(data?.individualCommissions?.[0]?.period_commission)}</div>
                        </div>
                    </>
                )}
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="card chart-card" style={{ gridColumn: 'span 2' }}>
                    <h3>
                        <TrendingUp size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Evolução do Faturamento (Período)
                    </h3>
                    <div style={{ height: '300px' }}>
                        {(data?.dailyRevenue || []).length > 0 ? (
                            <Line data={dailyChartData} options={chartDefaults} />
                        ) : (
                            <div className="empty-state">
                                <p>Sem dados para exibir</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card chart-card">
                    <h3>
                        <DollarSign size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Serviços Mais Procurados
                    </h3>
                    <div style={{ height: '300px' }}>
                        {(data?.topServices || []).length > 0 ? (
                            <Doughnut data={servicesChartData} options={doughnutOptions} />
                        ) : (
                            <div className="empty-state">
                                <p>Sem dados para exibir</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card chart-card">
                    <h3>
                        <Activity size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Métodos de Pagamento
                    </h3>
                    <div style={{ height: '300px' }}>
                        {(data?.paymentMethods || []).length > 0 ? (
                            <Doughnut data={paymentMethodsChartData} options={doughnutOptions} />
                        ) : (
                            <div className="empty-state">
                                <p>Sem dados para exibir</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transaction list */}
                <div className="card chart-card" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3>
                            <Activity size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Últimas Transações
                        </h3>
                    </div>
                    {(data?.transactions || []).length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Data/Hora</th>
                                        <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Cliente</th>
                                        <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Serviço</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Método</th>
                                        <th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.transactions.map((t, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '12px 8px', fontSize: '0.85rem' }}>
                                                {t.date.split('-').reverse().join('/')} <span style={{ color: 'var(--color-text-muted)' }}>{t.time}</span>
                                            </td>
                                            <td style={{ padding: '12px 8px', fontWeight: 500 }}>{t.client_name}</td>
                                            <td style={{ padding: '12px 8px', color: 'var(--color-text-secondary)' }}>{t.service_name}</td>
                                            <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                                                <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                    {t.payment_method || 'PIX'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 700, color: 'var(--color-accent)' }}>{formatPrice(t.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>Sem transações no período</p>
                        </div>
                    )}
                </div>

                {/* Commission Ranking */}
                <div className="card chart-card" style={{ gridColumn: 'span 2' }}>
                    <h3>
                        <Users size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        {isAdmin ? 'Relatório de Comissões (Mês)' : 'Minha Performance (Mês)'}
                    </h3>
                    {(data?.individualCommissions || []).length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Barbeiro</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Serviços (Período)</th>
                                        <th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Comissão (Período)</th>
                                        <th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Total Acumulado</th>
                                        <th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Saldo a Pagar</th>
                                        {isAdmin && <th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Ação</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.individualCommissions.map((c, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '12px 8px', fontWeight: 600 }}>{c.barber_name}</td>
                                            <td style={{ textAlign: 'center', padding: '12px 8px' }}>{c.service_count}</td>
                                            <td style={{ textAlign: 'right', padding: '12px 8px' }}>{formatPrice(c.period_commission)}</td>
                                            <td style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--color-text-secondary)' }}>{formatPrice(c.total_commission_earned)}</td>
                                            <td style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 700, color: (c.total_commission_earned - c.total_commission_paid) > 0 ? '#ef4444' : '#22c55e' }}>
                                                {formatPrice(c.total_commission_earned - c.total_commission_paid)}
                                            </td>
                                            {isAdmin && (
                                                <td style={{ textAlign: 'right', padding: '12px 8px' }}>
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handlePay(c.id, c.total_commission_earned - c.total_commission_paid)}
                                                        disabled={paying || (c.total_commission_earned - c.total_commission_paid) <= 0}
                                                        style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                                    >
                                                        Liquidar
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>Sem dados de comissão para o período</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
