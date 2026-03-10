import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api';
import { useToast } from '../components/Toast';
import AdminLayout from '../components/AdminLayout';
import {
    Download, Upload, Database, CheckCircle, AlertTriangle, Clock,
    RefreshCw, Shield, FileText, Info, Trash2, Eye
} from 'lucide-react';

const TABLE_LABELS = {
    users: { label: 'Usuários / Barbeiros', icon: '👤' },
    roles: { label: 'Perfis de Acesso', icon: '🔐' },
    role_permissions: { label: 'Permissões', icon: '🔑' },
    services: { label: 'Serviços', icon: '✂️' },
    clients: { label: 'Clientes', icon: '👥' },
    appointments: { label: 'Agendamentos', icon: '📅' },
    settings: { label: 'Configurações do Sistema', icon: '⚙️' },
    site_config: { label: 'Config do Site', icon: '🎨' },
    blocked_times: { label: 'Horários Bloqueados', icon: '🚫' },
    products: { label: 'Produtos', icon: '📦' },
    product_sales: { label: 'Vendas de Produtos', icon: '🛒' },
    payment_methods: { label: 'Métodos de Pagamento', icon: '💳' },
    reviews: { label: 'Avaliações', icon: '⭐' },
    barber_off_days: { label: 'Folgas dos Barbeiros', icon: '🏖️' },
};

export default function Backup() {
    const [dbInfo, setDbInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [restoreResult, setRestoreResult] = useState(null);
    const [backupPreview, setBackupPreview] = useState(null);
    const [restoreMode, setRestoreMode] = useState('merge');
    const [pendingBackup, setPendingBackup] = useState(null);
    const [confirmRestore, setConfirmRestore] = useState(false);
    const [localHistory, setLocalHistory] = useState([]);
    const fileInputRef = useRef();
    const toast = useToast();

    useEffect(() => {
        loadInfo();
        loadHistory();
    }, []);

    const loadInfo = async () => {
        setLoading(true);
        try { setDbInfo(await adminApi.getBackupInfo()); }
        catch (err) { toast.error('Erro ao carregar informações do banco'); }
        finally { setLoading(false); }
    };

    const loadHistory = () => {
        try {
            const stored = JSON.parse(localStorage.getItem('backup_history') || '[]');
            setLocalHistory(stored);
        } catch { setLocalHistory([]); }
    };

    const saveHistory = (entry) => {
        const stored = JSON.parse(localStorage.getItem('backup_history') || '[]');
        const updated = [entry, ...stored].slice(0, 10);
        localStorage.setItem('backup_history', JSON.stringify(updated));
        setLocalHistory(updated);
    };

    // ── Export ───────────────────────────────────────────────────────────────
    const handleExport = async () => {
        setExporting(true);
        try {
            const backup = await adminApi.exportBackup();
            const json = JSON.stringify(backup, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const dateStr = new Date().toISOString().replace('T', '_').split('.')[0].replace(/:/g, '-');
            a.href = url;
            a.download = `barber_backup_${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const totalRecords = Object.values(backup.tables).reduce((s, t) => s + t.length, 0);
            saveHistory({
                type: 'export',
                date: new Date().toISOString(),
                records: totalRecords,
                filename: a.download
            });
            toast.success('Backup exportado com sucesso!');
        } catch (err) {
            toast.error('Erro ao exportar backup: ' + err.message);
        } finally { setExporting(false); }
    };

    // ── Load file for preview ────────────────────────────────────────────────
    const handleFileLoad = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.endsWith('.json')) {
            toast.error('Selecione um arquivo .json válido');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (!parsed.tables || parsed.app !== 'BarberAgenda') {
                    toast.error('Arquivo inválido. Certifique-se de usar um backup gerado por este sistema.');
                    return;
                }
                setPendingBackup(parsed);
                setBackupPreview(parsed);
                setRestoreResult(null);
            } catch {
                toast.error('Arquivo JSON inválido ou corrompido');
            }
        };
        reader.readAsText(file);
    };

    // ── Restore ──────────────────────────────────────────────────────────────
    const handleRestore = async () => {
        if (!pendingBackup) return;
        setRestoring(true);
        setConfirmRestore(false);
        try {
            const result = await adminApi.restoreBackup({ backup: pendingBackup, mode: restoreMode });
            setRestoreResult(result);
            saveHistory({
                type: 'restore',
                date: new Date().toISOString(),
                mode: restoreMode,
                from: pendingBackup.exported_at,
                success: result.results.success.length,
                failed: result.results.failed.length
            });
            toast.success('Restore concluído! Recarregue a página para ver as atualizações.');
        } catch (err) {
            toast.error('Erro durante o restore: ' + err.message);
        } finally { setRestoring(false); }
    };

    const totalRecords = dbInfo ? Object.values(dbInfo.tables).reduce((s, v) => s + v, 0) : 0;

    return (
        <AdminLayout>
            <div className="animate-fade" style={{ maxWidth: 900, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Database size={26} className="text-accent" /> Backup & Restore
                    </h1>
                    <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Exporte todos os dados do sistema ou restaure a partir de um backup anterior
                    </p>
                </div>

                {/* Aviso de segurança */}
                <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Shield size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <strong style={{ color: 'var(--color-warning)', fontSize: '0.9rem' }}>Recomendação de segurança</strong>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                            Faça backups regularmente (recomendado diariamente). Armazene os arquivos em local seguro fora do servidor.
                            A restauração em modo <strong>Completo</strong> apaga os dados existentes antes de importar.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

                    {/* ── Card: Banco de Dados Atual ── */}
                    <div className="card" style={{ padding: '22px 24px', borderRadius: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Database size={18} className="text-accent" /> Banco Atual
                            </h3>
                            <button className="btn-icon" onClick={loadInfo} title="Atualizar">
                                <RefreshCw size={14} style={{ opacity: 0.6 }} />
                            </button>
                        </div>

                        {loading ? (
                            <div className="loading-spinner" style={{ height: 120 }}><div className="spinner"></div></div>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
                                    {Object.entries(dbInfo?.tables || {}).map(([table, count]) => (
                                        <div key={table} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <span>{TABLE_LABELS[table]?.icon || '📋'}</span>
                                                <span style={{ color: 'var(--color-text-muted)' }}>{TABLE_LABELS[table]?.label || table}</span>
                                            </span>
                                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: count > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>{count}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Total de registros</span>
                                    <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--color-accent)' }}>{totalRecords.toLocaleString('pt-BR')}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Card: Exportar ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="card" style={{ padding: '22px 24px', borderRadius: 18, flex: 1 }}>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Download size={18} style={{ color: '#22c55e' }} /> Exportar Backup
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
                                Exporta <strong>todos os dados</strong> do sistema em um arquivo <code>.json</code> organizado por tabelas.
                                Inclui clientes, agendamentos, serviços, configurações e financeiro.
                            </p>
                            <button className="btn btn-primary" style={{ width: '100%', gap: 10 }} onClick={handleExport} disabled={exporting || loading}>
                                {exporting ? (
                                    <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                                ) : (
                                    <><Download size={16} /> Baixar Backup Agora</>
                                )}
                            </button>
                        </div>

                        {/* Histórico local */}
                        {localHistory.length > 0 && (
                            <div className="card" style={{ padding: '16px 20px', borderRadius: 18 }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Clock size={14} /> Histórico Local
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {localHistory.slice(0, 5).map((h, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {h.type === 'export'
                                                    ? <Download size={11} color="#22c55e" />
                                                    : <Upload size={11} color="var(--color-accent)" />
                                                }
                                                <span style={{ color: h.type === 'export' ? '#22c55e' : 'var(--color-accent)', fontWeight: 700 }}>
                                                    {h.type === 'export' ? 'Export' : `Restore (${h.mode})`}
                                                </span>
                                            </div>
                                            <span style={{ color: 'var(--color-text-muted)' }}>
                                                {new Date(h.date).toLocaleDateString('pt-BR')} {new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {localHistory.length > 5 && (
                                    <button onClick={() => setLocalHistory(ls => ls.slice(0, 5))} style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Ver menos
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Card: Restore ── */}
                <div className="card" style={{ padding: '24px 28px', borderRadius: 20, marginBottom: 24 }}>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Upload size={20} className="text-accent" /> Restaurar Backup
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 22 }}>
                        Selecione um arquivo de backup (<code>.json</code>) gerado por este sistema para restaurar os dados.
                    </p>

                    {/* Modo de restore */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--color-text-secondary)' }}>Modo de Restauração</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[
                                {
                                    key: 'merge',
                                    title: '🔄 Mesclar (Recomendado)',
                                    desc: 'Adiciona novos registros sem apagar os existentes. Seguro para recuperar dados perdidos.',
                                    color: '#22c55e'
                                },
                                {
                                    key: 'full',
                                    title: '⚠️ Completo (Cuidado)',
                                    desc: 'Apaga os dados existentes e substitui pelo backup. Use apenas para migração total.',
                                    color: '#ef4444'
                                }
                            ].map(opt => (
                                <div key={opt.key}
                                    onClick={() => setRestoreMode(opt.key)}
                                    style={{
                                        padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                                        border: `2px solid ${restoreMode === opt.key ? opt.color : 'var(--color-border)'}`,
                                        background: restoreMode === opt.key ? `${opt.color}10` : 'rgba(255,255,255,0.02)',
                                        transition: 'all 0.2s'
                                    }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.87rem', marginBottom: 5 }}>{opt.title}</div>
                                    <div style={{ fontSize: '0.77rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{opt.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upload */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${backupPreview ? 'var(--color-accent)' : 'var(--color-border)'}`,
                            borderRadius: 14, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                            background: backupPreview ? 'var(--color-accent-subtle)' : 'rgba(255,255,255,0.02)',
                            transition: 'all 0.2s', marginBottom: 18
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = backupPreview ? 'var(--color-accent)' : 'var(--color-border)'}
                    >
                        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileLoad} />
                        {backupPreview ? (
                            <div>
                                <CheckCircle size={32} color="var(--color-accent)" style={{ marginBottom: 8 }} />
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-accent)' }}>Arquivo carregado!</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                                    Exportado em: {new Date(backupPreview.exported_at).toLocaleString('pt-BR')}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                                    {Object.values(backupPreview.tables).reduce((s, t) => s + t.length, 0).toLocaleString('pt-BR')} registros em {Object.keys(backupPreview.tables).length} tabelas
                                </div>
                                <button onClick={e => { e.stopPropagation(); setPendingBackup(null); setBackupPreview(null); }}
                                    style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    Trocar arquivo
                                </button>
                            </div>
                        ) : (
                            <div>
                                <Upload size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                                <div style={{ fontWeight: 600 }}>Clique para selecionar o arquivo de backup</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Formato suportado: .json gerado por este sistema</div>
                            </div>
                        )}
                    </div>

                    {/* Preview do backup */}
                    {backupPreview && (
                        <div style={{ marginBottom: 18, background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--color-border)' }}>
                            <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Eye size={14} /> Conteúdo do Backup
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                {Object.entries(backupPreview.tables).map(([table, rows]) => (
                                    <div key={table} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '6px 10px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                            {TABLE_LABELS[table]?.icon} {TABLE_LABELS[table]?.label || table}
                                        </span>
                                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: rows.length > 0 ? '#fff' : 'var(--color-text-muted)' }}>{rows.length}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button className={`btn ${restoreMode === 'full' ? 'btn-danger' : 'btn-primary'}`}
                        style={{ width: '100%' }}
                        disabled={!pendingBackup || restoring}
                        onClick={() => setConfirmRestore(true)}>
                        {restoring ? (
                            <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Restaurando...</>
                        ) : (
                            <><Upload size={16} /> {restoreMode === 'full' ? 'Restaurar (Modo Completo — Cuidado!)' : 'Restaurar Backup (Mesclar)'}</>
                        )}
                    </button>
                </div>

                {/* Resultado do restore */}
                {restoreResult && (
                    <div className="card animate-fade" style={{ padding: '22px 26px', borderRadius: 18, border: '1px solid var(--color-success)' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success)' }}>
                            <CheckCircle size={18} /> Restore Concluído
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                            {[
                                { label: '✅ Sucesso', items: restoreResult.results.success, color: '#22c55e' },
                                { label: '❌ Falhas', items: restoreResult.results.failed, color: '#ef4444' },
                                { label: '⏭️ Ignorados', items: restoreResult.results.skipped, color: '#888' }
                            ].map(col => (
                                <div key={col.label}>
                                    <div style={{ fontWeight: 700, color: col.color, marginBottom: 6, fontSize: '0.85rem' }}>{col.label} ({col.items.length})</div>
                                    {col.items.length > 0 ? (
                                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 10, maxHeight: 150, overflowY: 'auto' }}>
                                            {col.items.map((item, i) => (
                                                <div key={i} style={{ fontSize: '0.72rem', padding: '2px 0', color: 'var(--color-text-muted)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Nenhum</div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
                            ⏱️ Restaurado em: {new Date(restoreResult.restored_at).toLocaleString('pt-BR')} | Modo: <strong>{restoreResult.mode}</strong>
                        </div>
                        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => window.location.reload()}>
                            <RefreshCw size={14} /> Recarregar Página
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de confirmação */}
            {confirmRestore && (
                <div className="modal-overlay" onClick={() => setConfirmRestore(false)}>
                    <div className="modal animate-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, borderRadius: 20 }}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <AlertTriangle size={20} color={restoreMode === 'full' ? '#ef4444' : 'var(--color-warning)'} />
                                Confirmar Restore
                            </h2>
                        </div>
                        <div className="modal-body">
                            {restoreMode === 'full' ? (
                                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px 16px' }}>
                                    <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>⚠️ Atenção: Modo Completo</p>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                                        Esta operação irá <strong>apagar os dados existentes</strong> das tabelas antes de restaurar.
                                        Os dados dos usuários/barbeiros são protegidos e não serão apagados.
                                    </p>
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    O sistema irá mesclar os dados do backup com os dados existentes.
                                    Registros com conflito serão ignorados.
                                </p>
                            )}
                            <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', fontSize: '0.82rem' }}>
                                <div style={{ color: 'var(--color-text-muted)' }}>Backup de:</div>
                                <div style={{ fontWeight: 700 }}>{new Date(backupPreview?.exported_at).toLocaleString('pt-BR')}</div>
                                <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                                    {Object.values(backupPreview?.tables || {}).reduce((s, t) => s + t.length, 0).toLocaleString('pt-BR')} registros
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ border: 'none', display: 'flex', gap: 10 }}>
                            <button className="btn btn-ghost" style={{ flex: 1, border: '1px solid var(--color-border)' }} onClick={() => setConfirmRestore(false)}>Cancelar</button>
                            <button className={`btn ${restoreMode === 'full' ? 'btn-danger' : 'btn-primary'}`} style={{ flex: 2 }} onClick={handleRestore}>
                                Confirmar e Restaurar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </AdminLayout>
    );
}
