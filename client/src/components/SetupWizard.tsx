import { useState } from 'react';
import { api } from '../api/client';

interface SetupWizardProps {
    onComplete: () => void;
}

type Step = 'welcome' | 'apikey' | 'channel' | 'testing' | 'done';

export default function SetupWizard({ onComplete }: SetupWizardProps) {
    const [step, setStep] = useState<Step>('welcome');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [channelAppId, setChannelAppId] = useState('');
    const [channelSecret, setChannelSecret] = useState('');
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState<{ valid: boolean; detail: string } | null>(null);
    const [error, setError] = useState('');

    const handleSaveAndTest = async () => {
        if (!apiKey.trim()) {
            setError('请输入 API Key');
            return;
        }

        setSaving(true);
        setError('');
        setStep('testing');

        try {
            // 1. 保存配置
            const saveData: Record<string, string> = { llm_api_key: apiKey.trim() };
            if (model.trim()) saveData.llm_model = model.trim();
            if (baseUrl.trim()) saveData.llm_base_url = baseUrl.trim();
            if (channelAppId.trim()) saveData.channel_appid = channelAppId.trim();
            if (channelSecret.trim()) saveData.channel_secret = channelSecret.trim();

            const saveRes = await api.saveSetup(saveData);
            if (saveRes.code !== 0) {
                setError(saveRes.message || '保存失败');
                setStep('apikey');
                setSaving(false);
                return;
            }

            // 2. 测试 API Key
            const testRes = await api.testApiKey();
            if (testRes.code === 0 && testRes.data) {
                setTestResult({
                    valid: testRes.data.valid,
                    detail: String(testRes.data.detail || ''),
                });
            }

            setStep('done');
        } catch {
            setError('请求失败，请重试');
            setStep('apikey');
        } finally {
            setSaving(false);
        }
    };

    const handleFinish = () => {
        localStorage.setItem('setup_complete', 'true');
        onComplete();
    };

    return (
        <div className="wizard-overlay">
            <div className="wizard-modal glass animate-fadeIn">
                {/* Progress */}
                <div className="wizard-progress">
                    {['欢迎', 'API Key', '渠道', '完成'].map((label, i) => {
                        const stepIndex = ['welcome', 'apikey', 'channel', 'done'].indexOf(step);
                        const idx = i;
                        return (
                            <div key={label} className={`wizard-progress-step ${idx <= stepIndex || step === 'testing' && idx <= 2 ? 'active' : ''}`}>
                                <div className="wizard-progress-dot">{idx < stepIndex || (step === 'done' && idx <= 3) ? '✓' : idx + 1}</div>
                                <span className="wizard-progress-label">{label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Step: Welcome */}
                {step === 'welcome' && (
                    <div className="wizard-step">
                        <div className="wizard-icon">🦞</div>
                        <h2>欢迎使用 OpenClaw</h2>
                        <p className="wizard-desc">
                            只需简单几步设置，即可开始使用 AI 对话。
                            <br />
                            您只需要准备好 <strong>API Key</strong> 即可。
                        </p>
                        <button className="btn btn-primary btn-lg" onClick={() => setStep('apikey')}>
                            开始设置
                        </button>
                    </div>
                )}

                {/* Step: API Key */}
                {step === 'apikey' && (
                    <div className="wizard-step">
                        <h2>🔑 设置 LLM API Key</h2>
                        <p className="wizard-desc">
                            输入您的 AI 服务 API Key（如 OpenAI、Claude 等）
                        </p>

                        {error && <div className="settings-message error">{error}</div>}

                        <div className="wizard-form">
                            <div className="form-group">
                                <label>API Key <span className="required">*</span></label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>模型 <span className="optional">(可选)</span></label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="如 gpt-4o, claude-3-5-sonnet 等，留空使用默认"
                                />
                            </div>

                            <div className="form-group">
                                <label>API Base URL <span className="optional">(可选)</span></label>
                                <input
                                    type="text"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    placeholder="自定义 API 地址，留空使用默认"
                                />
                            </div>
                        </div>

                        <div className="wizard-actions">
                            <button className="btn btn-ghost" onClick={() => setStep('welcome')}>
                                上一步
                            </button>
                            <button className="btn btn-primary" onClick={() => setStep('channel')}>
                                下一步
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Channel */}
                {step === 'channel' && (
                    <div className="wizard-step">
                        <h2>📡 渠道配置</h2>
                        <p className="wizard-desc">
                            如需接入即时通讯渠道（如微信、钉钉等），请填写以下信息。
                            <br />
                            <span className="optional">如不需要，可直接跳过。</span>
                        </p>

                        <div className="wizard-form">
                            <div className="form-group">
                                <label>Channel App ID <span className="optional">(可选)</span></label>
                                <input
                                    type="text"
                                    value={channelAppId}
                                    onChange={(e) => setChannelAppId(e.target.value)}
                                    placeholder="渠道 App ID"
                                />
                            </div>

                            <div className="form-group">
                                <label>Channel Secret <span className="optional">(可选)</span></label>
                                <input
                                    type="password"
                                    value={channelSecret}
                                    onChange={(e) => setChannelSecret(e.target.value)}
                                    placeholder="渠道密钥"
                                />
                            </div>
                        </div>

                        <div className="wizard-actions">
                            <button className="btn btn-ghost" onClick={() => setStep('apikey')}>
                                上一步
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveAndTest} disabled={saving}>
                                保存并测试
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Testing */}
                {step === 'testing' && (
                    <div className="wizard-step">
                        <div className="wizard-icon">
                            <div className="spinner" style={{ margin: '0 auto' }} />
                        </div>
                        <h2>正在验证配置...</h2>
                        <p className="wizard-desc">正在保存配置并测试 API Key 连通性</p>
                    </div>
                )}

                {/* Step: Done */}
                {step === 'done' && (
                    <div className="wizard-step">
                        <div className="wizard-icon">
                            {testResult?.valid ? '🎉' : '⚠️'}
                        </div>
                        <h2>{testResult?.valid ? '设置完成！' : '设置已保存'}</h2>
                        <p className="wizard-desc">
                            {testResult?.valid
                                ? 'API Key 验证成功，您可以开始使用了！'
                                : testResult?.detail || '配置已保存，但无法在线验证 API Key（Gateway 未连接或 Key 无效）。您仍可以继续使用。'
                            }
                        </p>
                        <button className="btn btn-primary btn-lg" onClick={handleFinish}>
                            开始使用
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
