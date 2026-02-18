import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function ConfigPage() {
    const [config, setConfig] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [editKey, setEditKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const fetchConfig = () => {
        setLoading(true);
        setError('');
        api.getConfig().then((res) => {
            if (res.code === 0 && res.data) {
                setConfig(res.data);
            } else {
                setError(res.message || '获取配置失败');
            }
            setLoading(false);
        }).catch(() => {
            setError('请求失败');
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleEdit = (key: string, value: unknown) => {
        setEditKey(key);
        setEditValue(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
        setSaveMsg('');
    };

    const handleSave = async () => {
        if (!editKey) return;
        setSaving(true);
        setSaveMsg('');

        let parsedValue: unknown = editValue;
        try {
            parsedValue = JSON.parse(editValue);
        } catch {
            // 保留原始字符串
        }

        try {
            const res = await api.setConfig({ [editKey]: parsedValue });
            if (res.code === 0) {
                setSaveMsg('保存成功');
                setEditKey(null);
                fetchConfig(); // 刷新
            } else {
                setSaveMsg(res.message || '保存失败');
            }
        } catch {
            setSaveMsg('请求失败');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditKey(null);
        setEditValue('');
        setSaveMsg('');
    };

    return (
        <div className="config-page animate-fadeIn">
            <div className="page-title-row">
                <h2 className="page-title">🔧 OpenClaw 配置</h2>
                <button className="btn btn-ghost btn-sm" onClick={fetchConfig} disabled={loading}>
                    {loading ? '加载中...' : '刷新'}
                </button>
            </div>

            {error && (
                <div className="config-notice warning">
                    <span className="config-notice-icon">⚠️</span>
                    <div>
                        <strong>{error}</strong>
                        <p>请确保 OpenClaw Gateway 正在运行并且 Web Panel 已连接到 Gateway。</p>
                        <p className="config-notice-hint">
                            连接地址可在 <code>.env</code> 文件中设置 <code>OPENCLAW_GATEWAY_URL</code>
                        </p>
                    </div>
                </div>
            )}

            {saveMsg && (
                <div className={`settings-message ${saveMsg === '保存成功' ? 'success' : 'error'}`}>
                    {saveMsg}
                </div>
            )}

            {config && (
                <div className="config-grid">
                    {Object.entries(config).map(([key, value]) => (
                        <div className="config-card" key={key}>
                            <div className="config-card-header">
                                <span className="config-key">{key}</span>
                                {editKey !== key && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleEdit(key, value)}
                                    >
                                        编辑
                                    </button>
                                )}
                            </div>

                            {editKey === key ? (
                                <div className="config-edit">
                                    <textarea
                                        className="config-textarea"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        rows={editValue.split('\n').length + 1}
                                    />
                                    <div className="config-edit-actions">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={handleSave}
                                            disabled={saving}
                                        >
                                            {saving ? '保存中...' : '保存'}
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={handleCancelEdit}
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="config-value">
                                    {typeof value === 'object'
                                        ? JSON.stringify(value, null, 2)
                                        : String(value)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!config && !loading && !error && (
                <div className="config-notice info">
                    <span className="config-notice-icon">ℹ️</span>
                    <p>暂无配置数据</p>
                </div>
            )}
        </div>
    );
}
