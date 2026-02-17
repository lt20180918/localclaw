import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

interface StatusData {
    webVersion: string;
    gateway: {
        connected: boolean;
        gatewayVersion?: string;
    };
}

export default function DashboardPage() {
    const { logout } = useAuth();
    const [status, setStatus] = useState<StatusData | null>(null);

    useEffect(() => {
        api.getStatus().then((res) => {
            if (res.code === 0 && res.data) {
                setStatus(res.data as StatusData);
            }
        });
    }, []);

    return (
        <div className="app-layout">
            <div className="main-content animate-fadeIn">
                <div className="dashboard-header">
                    <h2>🦞 OpenClaw Control Panel</h2>
                    <button className="btn btn-ghost" onClick={logout}>
                        退出登录
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
                    {/* Web Panel 版本 */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Web Panel</span>
                        </div>
                        <div className="card-value">
                            {status?.webVersion || '...'}
                        </div>
                    </div>

                    {/* Gateway 状态 */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">OpenClaw Gateway</span>
                        </div>
                        <div className="card-value" style={{ display: 'flex', alignItems: 'center' }}>
                            <span className={`status-dot ${status?.gateway.connected ? 'online' : 'offline'}`} />
                            {status?.gateway.connected ? '已连接' : '未连接'}
                        </div>
                    </div>

                    {/* 占位: 更多卡片将在后续 Phase 添加 */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">对话</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Phase 3 实现
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
