import { useAuth } from '../context/AuthContext';
import StatusPanel from '../components/StatusPanel';

export default function DashboardPage() {
    const { logout } = useAuth();

    return (
        <div className="app-layout">
            <div className="main-content animate-fadeIn">
                <div className="dashboard-header">
                    <h2>🦞 OpenClaw Control Panel</h2>
                    <button className="btn btn-ghost" onClick={logout}>
                        退出登录
                    </button>
                </div>

                <StatusPanel />

                {/* Phase 3 将添加对话界面 */}
                <div className="card" style={{ marginTop: 'var(--space-md)' }}>
                    <div className="card-header">
                        <span className="card-title">对话</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        对话功能将在 Phase 3 实现
                    </p>
                </div>
            </div>
        </div>
    );
}
