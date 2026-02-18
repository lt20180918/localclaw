import { useState, useEffect } from 'react';
import { api } from '../api/client';

interface SetupConfig {
    llm_api_key: string;
    llm_api_key_set: boolean;
    llm_model: string;
    llm_base_url: string;
    channel_appid: string;
    channel_secret: string;
    channel_secret_set: boolean;
    setup_complete: boolean;
}

export default function ConfigPage() {
    const [config, setConfig] = useState<SetupConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [testing, setTesting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // 表单状态
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [channelAppId, setChannelAppId] = useState('');
    const [channelSecret, setChannelSecret] = useState('');

    const fetchConfig = () => {
        setLoading(true);
        api.getSetupConfig().then((res) => {
            if (res.code === 0 && res.data) {
                setConfig(res.data);
                setModel(res.data.llm_model || '');
                setBaseUrl(res.data.llm_base_url || '');
                setChannelAppId(res.data.channel_appid || '');
                // 不回填敏感字段 (apiKey, channelSecret)
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { fetchConfig(); }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        const updates: Record<string, string> = {};
        if (apiKey.trim()) updates.llm_api_key = apiKey.trim();
        if (model.trim() !== (config?.llm_model || '')) updates.llm_model = model.trim();
        if (baseUrl.trim() !== (config?.llm_base_url || '')) updates.llm_base_url = baseUrl.trim();
        if (channelAppId.trim() !== (config?.channel_appid || '')) updates.channel_appid = channelAppId.trim();
        if (channelSecret.trim()) updates.channel_secret = channelSecret.trim();

        if (Object.keys(updates).length === 0) {
            setMessage('没有需要更新的内容');
            setMessageType('error');
            setSaving(false);
            return;
        }

        try {
            const res = await api.saveSetup(updates);
            if (res.code === 0) {
                setMessage('配置已保存');
                setMessageType('success');
                setApiKey('');
                setChannelSecret('');
                fetchConfig();
            } else {
                setMessage(res.message || '保存失败');
                setMessageType('error');
            }
        } catch {
            setMessage('请求失败');
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setMessage('');

        try {
            const res = await api.testApiKey();
            if (res.code === 0 && res.data) {
                setMessage(res.data.valid
                    ? '✅ API Key 验证通过'
                    : `❌ ${res.data.detail || 'API Key 验证失败'}`);
                setMessageType(res.data.valid ? 'success' : 'error');
            } else {
                setMessage(res.message || '测试失败');
                setMessageType('error');
            }
        } catch {
            setMessage('请求失败');
            setMessageType('error');
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="config-page animate-fadeIn" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <div className="spinner" style={{ margin: '0 auto var(--space-md)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>加载配置...</p>
            </div>
        );
    }

    return (
        <div className="config-page animate-fadeIn">
            <h2 className="page-title">🔧 配置管理</h2>

            {message && (
                <div className={`settings-message ${messageType}`}>
                    {message}
                </div>
            )}

            {/* API Key 卡片 */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">🔑 LLM API Key</span>
                    <div className="card-header-right">
                        {config?.llm_api_key_set && (
                            <span className="badge badge-success">已配置</span>
                        )}
                        {!config?.llm_api_key_set && (
                            <span className="badge badge-warning">未配置</span>
                        )}
                    </div>
                </div>

                {config?.llm_api_key_set && (
                    <p className="config-current">当前 Key: <code>{config.llm_api_key}</code></p>
                )}

                <div className="form-group">
                    <label>{config?.llm_api_key_set ? '更换 API Key' : 'API Key'}</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                </div>

                <div className="form-group">
                    <label>模型 <span className="optional">(可选)</span></label>
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="gpt-4o, claude-3-5-sonnet 等，留空使用默认"
                    />
                </div>

                <div className="config-actions">
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? '保存中...' : '保存'}
                    </button>
                    {config?.llm_api_key_set && (
                        <button className="btn btn-ghost" onClick={handleTest} disabled={testing}>
                            {testing ? '测试中...' : '测试连接'}
                        </button>
                    )}
                </div>
            </div>

            {/* 渠道配置 */}
            <div className="card" style={{ marginTop: 'var(--space-md)' }}>
                <div className="card-header">
                    <span className="card-title">📡 渠道配置</span>
                    <div className="card-header-right">
                        {config?.channel_secret_set && (
                            <span className="badge badge-success">已配置</span>
                        )}
                    </div>
                </div>

                <p className="config-desc">接入即时通讯渠道（微信、钉钉等），不需要可留空。</p>

                <div className="form-group">
                    <label>App ID</label>
                    <input
                        type="text"
                        value={channelAppId}
                        onChange={(e) => setChannelAppId(e.target.value)}
                        placeholder="渠道 App ID"
                    />
                </div>

                <div className="form-group">
                    <label>Secret</label>
                    <input
                        type="password"
                        value={channelSecret}
                        onChange={(e) => setChannelSecret(e.target.value)}
                        placeholder={config?.channel_secret_set ? '已设置，留空不修改' : '渠道密钥'}
                    />
                </div>
            </div>

            {/* 高级设置 */}
            <div className="card" style={{ marginTop: 'var(--space-md)' }}>
                <button
                    className="advanced-toggle"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    <span>{showAdvanced ? '▾' : '▸'} 高级设置</span>
                </button>

                {showAdvanced && (
                    <div className="advanced-section animate-fadeIn">
                        <div className="form-group">
                            <label>API Base URL</label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                placeholder="自定义 API 地址，如 https://api.openai.com/v1"
                            />
                            <span className="form-hint">只有使用代理或自建服务时才需要修改</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
