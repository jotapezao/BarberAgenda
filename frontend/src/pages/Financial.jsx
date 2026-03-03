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
    const [paying, setPaying] = useState(false);
    const toast = useToast();

    const handlePay = async (barberId, amount) => {
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
    }, []);

    const loadFinancial = async () => {
        try {
            const financial = await adminApi.getFinancial();
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

    return (
        <AdminLayout>
            <div className="section-header-admin">
                <div>
                    <h1>Financeiro</h1>
                    <p className="text-secondary">Controle de faturamento e métricas de desempenho</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="financial-cards">
                <div className="card financial-card">
                    <h3>💰 Faturamento Hoje</h3>
                    <div className="value">{formatPrice(data?.today?.revenue)}</div>
                    <p className="text-secondary" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                        {data?.today?.appointments || 0} atendimentos
                    </p>
                </div>

                <div className="card financial-card">
                    <h3>📅 Faturamento do Mês</h3>
                    <div className="value green">{formatPrice(data?.month?.revenue)}</div>
                    <p className="text-secondary" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                        {data?.month?.appointments || 0} atendimentos
                    </p>
                </div>

                <div className="card financial-card">
                    <h3>👥 Atendimentos (Mês)</h3>
                    <div className="value" style={{ color: 'var(--color-info)' }}>{data?.month?.appointments || 0}</div>
                </div>

                {isAdmin ? (
                    <div className="card financial-card">
                        <h3>📊 Ticket Médio</h3>
                        <div className="value">{formatPrice(data?.month?.avgTicket)}</div>
                    </div>
                ) : (
                    <div className="card financial-card">
                        <h3>💸 Minha Comissão</h3>
                        <div className="value gold">{formatPrice(data?.individualCommissions?.[0]?.total_commission)}</div>
                    </div>
                )}
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="card chart-card">
                    <h3>
                        <TrendingUp size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Faturamento por Dia (últimos 30 dias)
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
                        <Activity size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Faturamento por Mês
                    </h3>
                    <div style={{ height: '300px' }}>
                        {(data?.monthlyRevenue || []).length > 0 ? (
                            <Bar data={monthlyChartData} options={chartDefaults} />
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
                        Serviços Mais Vendidos
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

                {/* Revenue table */}
                <div className="card chart-card">
                    <h3>
                        <Users size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Ranking de Serviços
                    </h3>
                    {(data?.topServices || []).length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Serviço</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Qtd</th>
                                        <th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Receita</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topServices.map((s, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: serviceColors[i], display: 'inline-block' }}></span>
                                                {s.name}
                                            </td>
                                            <td style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--color-text-secondary)' }}>{s.count}</td>
                                            <td style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 700, color: 'var(--color-accent)' }}>{formatPrice(s.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>Sem dados para exibir</p>
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
