import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import { Clock, Save, Plus, Trash2, X, Ban } from 'lucide-react';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Schedule() {
    const [settings, setSettings] = useState({});
    const [blockedTimes, setBlockedTimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [blockDate, setBlockDate] = useState('');
    const [blockTime, setBlockTime] = useState('');
    const [blockReason, setBlockReason] = useState('');
    const toast = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [settingsData, blockedData] = await Promise.all([
                adminApi.getSettings(),
                adminApi.getBlockedTimes()
            ]);
            setSettings(settingsData);
            setBlockedTimes(blockedData);
        } catch (err) {
            toast.error('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            await adminApi.updateSettings(settings);
            toast.success('Configurações salvas!');
        } catch (err) {
            toast.error('Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (dayIndex) => {
        const days = (settings.working_days || '1,2,3,4,5,6').split(',').map(Number);
        const newDays = days.includes(dayIndex)
            ? days.filter(d => d !== dayIndex)
            : [...days, dayIndex].sort();
        setSettings({ ...settings, working_days: newDays.join(',') });
    };

    const addBlockedTime = async () => {
        if (!blockDate || !blockTime) {
            toast.error('Selecione data e horário');
            return;
        }
        try {
            await adminApi.blockTime({ date: blockDate, time: blockTime, reason: blockReason });
            toast.success('Horário bloqueado');
            setBlockDate('');
            setBlockTime('');
            setBlockReason('');
            loadData();
        } catch (err) {
            toast.error('Erro ao bloquear horário');
        }
    };

    const removeBlockedTime = async (id) => {
        try {
            await adminApi.unblockTime(id);
            toast.success('Horário desbloqueado');
            loadData();
        } catch (err) {
            toast.error('Erro ao desbloquear');
        }
    };

    const workingDays = (settings.working_days || '1,2,3,4,5,6').split(',').map(Number);

    const formatDateBR = (dateStr) => {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    // Generate available times for blocking
    const generateTimes = () => {
        const times = [];
        const openH = parseInt((settings.open_time || '08:00').split(':')[0]);
        const closeH = parseInt((settings.close_time || '19:00').split(':')[0]);
        const interval = parseInt(settings.interval_minutes || '30');

        let current = openH * 60;
        const end = closeH * 60;
        while (current < end) {
            const h = Math.floor(current / 60).toString().padStart(2, '0');
            const m = (current % 60).toString().padStart(2, '0');
            times.push(`${h}:${m}`);
            current += interval;
        }
        return times;
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
                    <h1>Agendamentos & Horários</h1>
                    <p className="text-secondary">Configure horários de funcionamento e bloqueios de agenda</p>
                </div>
                <div className="admin-header-actions">
                    <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
                        <Save size={18} />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>

            <div className="schedule-config">
                {/* Working Hours */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={20} className="text-accent" />
                        Horário de Funcionamento
                    </h3>

                    <div className="form-group">
                        <label className="form-label">Abertura</label>
                        <input
                            type="time"
                            className="form-input"
                            value={settings.open_time || '08:00'}
                            onChange={e => setSettings({ ...settings, open_time: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Fechamento</label>
                        <input
                            type="time"
                            className="form-input"
                            value={settings.close_time || '19:00'}
                            onChange={e => setSettings({ ...settings, close_time: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Intervalo entre atendimentos (min)</label>
                        <select
                            className="form-select"
                            value={settings.interval_minutes || '30'}
                            onChange={e => setSettings({ ...settings, interval_minutes: e.target.value })}
                        >
                            <option value="15">15 minutos</option>
                            <option value="20">20 minutos</option>
                            <option value="30">30 minutos</option>
                            <option value="45">45 minutos</option>
                            <option value="60">60 minutos</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Número WhatsApp</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="5511999999999"
                            value={settings.whatsapp_number || ''}
                            onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })}
                        />
                    </div>
                </div>

                {/* Working Days */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={20} className="text-accent" />
                        Dias de Funcionamento
                    </h3>

                    <div className="working-days">
                        {DAY_NAMES.map((day, index) => (
                            <button
                                key={index}
                                className={`day-toggle ${workingDays.includes(index) ? 'active' : ''}`}
                                onClick={() => toggleDay(index)}
                                type="button"
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '12px' }}>
                        Clique para ativar/desativar os dias de atendimento
                    </p>
                </div>

                {/* Block Specific Times */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Ban size={20} className="text-accent" />
                        Bloquear Horário Específico
                    </h3>

                    <div className="form-group">
                        <label className="form-label">Data</label>
                        <input
                            type="date"
                            className="form-input"
                            value={blockDate}
                            onChange={e => setBlockDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Horário</label>
                        <select className="form-select" value={blockTime} onChange={e => setBlockTime(e.target.value)}>
                            <option value="">Selecione</option>
                            {generateTimes().map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Motivo (opcional)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ex: Compromisso pessoal"
                            value={blockReason}
                            onChange={e => setBlockReason(e.target.value)}
                        />
                    </div>

                    <button className="btn btn-primary" onClick={addBlockedTime} style={{ width: '100%' }}>
                        <Plus size={18} />
                        Bloquear Horário
                    </button>
                </div>

                {/* Blocked Times List */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '1.1rem', padding: '24px', margin: 0, borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Ban size={20} className="text-accent" />
                        Horários Bloqueados
                    </h3>

                    {blockedTimes.length > 0 ? (
                        <div>
                            <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 100px', padding: '15px 24px', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                <div>DATA E HORA</div>
                                <div>MOTIVO</div>
                                <div style={{ textAlign: 'right' }}>AÇÃO</div>
                            </div>
                            {blockedTimes.map(bt => (
                                <div key={bt.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 100px', padding: '15px 24px', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                    <div style={{ fontWeight: 600 }}>
                                        {formatDateBR(bt.date)} às {bt.time}
                                    </div>
                                    <div className="text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {bt.reason || '-'}
                                    </div>
                                    <div className="flex-center" style={{ justifyContent: 'flex-end' }}>
                                        <button className="btn btn-danger btn-sm" style={{ padding: '6px 10px' }} onClick={() => removeBlockedTime(bt.id)} title="Remover Bloqueio">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-secondary" style={{ fontSize: '0.9rem', textAlign: 'center', padding: '30px' }}>
                            Nenhum horário bloqueado
                        </p>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
