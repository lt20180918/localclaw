import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
    const { isAuthenticated, isLoading } = useAuth();

    // 加载中 — Token 验证
    if (isLoading) {
        return (
            <div className="login-page">
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto var(--space-md)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>验证中...</p>
                </div>
            </div>
        );
    }

    // 未认证 → 登录页
    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // 已认证 → 仪表盘
    return <DashboardPage />;
}
