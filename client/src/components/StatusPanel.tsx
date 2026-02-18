import { useState, useEffect } from 'react';
import { api } from '../api/client';

interface StatusData {
    webVersion: string;
    gateway: {
        connected: boolean;
        gatewayVersion?: string;
        status?: Record<string, unknown>;
        health?: Record<string, unknown>;
    };
}

export default function StatusPanel() {
    const [status, setStatus] = useState<StatusData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = () => {
        setLoading(true);
        api.getStatus().then((res) => {
            if (res.code === 0 && res.data) {
                setStatus(res.data as StatusData);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchStatus();
        // 每 30 秒轮询
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="status-panel">
            <div className="status-panel-header">
                <h3>系统状态</h3>
                <button className="btn btn-ghost btn-sm" onClick={fetchStatus} disabled={loading}>
                    {loading ? '刷新中...' : '刷新'}
                </button>
            </div>

            <div className="status-grid">
                {/* Web Panel */}
                <div className="status-item">
                    <div className="status-item-label">Web Panel 版本</div>
                    <div className="status-item-value">{status?.webVersion || '-'}</div>
                </div>

                {/* Gateway 连接 */}
                <div className="status-item">
                    <div className="status-item-label">Gateway 连接</div>
                    <div className="status-item-value">
                        <span className={`status-dot ${status?.gateway.connected ? 'online' : 'offline'}`} />
                        {status?.gateway.connected ? '已连接' : '未连接'}
                    </div>
                </div>

                {/* Gateway 版本 */}
                {status?.gateway.connected && status.gateway.gatewayVersion && (
                    <div className="status-item">
                        <div className="status-item-label">Gateway 版本</div>
                        <div className="status-item-value">{status.gateway.gatewayVersion}</div>
                    </div>
                )}

                {/* Gateway 详情 */}
                {status?.gateway.connected && status.gateway.status && (
                    <>
                        {Object.entries(status.gateway.status).map(([key, value]) => (
                            <div className="status-item" key={key}>
                                <div className="status-item-label">{key}</div>
                                <div className="status-item-value">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Gateway 未连接提示 */}
            {status && !status.gateway.connected && (
                <div className="gateway-hint">
                    <div className="gateway-hint-title">💡 连接指引</div>
                    <p>Web Panel 需要连接到 OpenClaw Gateway 才能使用对话和配置功能。</p>
                    <ol>
                        <li>确保 OpenClaw Gateway 正在运行（默认端口 <code>18789</code>）</li>
                        <li>检查 <code>.env</code> 中的 <code>OPENCLAW_GATEWAY_URL</code> 配置</li>
                        <li>如果 Gateway 在其他机器上，修改为 <code>ws://IP:18789</code></li>
                    </ol>
                    <p className="gateway-hint-note">
                        当前连接地址: <code>{window.location.protocol === 'https:' ? 'wss' : 'ws'}://127.0.0.1:18789</code>
                    </p>
                </div>
            )}
        </div>
    );
}
