import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import ConfigPage from './pages/ConfigPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';
import SetupWizard from './components/SetupWizard';

export default function App() {
    const { isAuthenticated, isLoading, logout } = useAuth();
    const [activePage, setActivePage] = useState('dashboard');
    const [showWizard, setShowWizard] = useState(false);
    const [checkingSetup, setCheckingSetup] = useState(false);

    // 登录后检查是否需要 Setup Wizard
    useEffect(() => {
        if (!isAuthenticated) return;

        // 本地已完成过就跳过
        if (localStorage.getItem('setup_complete') === 'true') return;

        setCheckingSetup(true);
        api.getSetupStatus().then((res) => {
            if (res.code === 0 && res.data && !res.data.setupComplete) {
                setShowWizard(true);
            }
            setCheckingSetup(false);
        }).catch(() => setCheckingSetup(false));
    }, [isAuthenticated]);

    const handleWizardComplete = () => {
        setShowWizard(false);
        setActivePage('chat'); // 完成后跳转到对话
    };

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

    const token = localStorage.getItem('token');

    // 已认证 → 带侧边栏的主界面
    return (
        <>
            {/* Setup Wizard (首次使用弹窗) */}
            {(showWizard || checkingSetup) && (
                showWizard
                    ? <SetupWizard onComplete={handleWizardComplete} />
                    : (
                        <div className="wizard-overlay">
                            <div style={{ textAlign: 'center' }}>
                                <div className="spinner" style={{ margin: '0 auto var(--space-md)' }} />
                                <p style={{ color: 'var(--text-secondary)' }}>检查配置...</p>
                            </div>
                        </div>
                    )
            )}

            <div className="app-layout">
                <Sidebar activePage={activePage} onNavigate={setActivePage} />

                <main className="main-content">
                    <div className="main-header">
                        <button className="btn btn-ghost btn-sm mobile-menu-btn" onClick={() => {
                            document.querySelector('.sidebar')?.classList.toggle('sidebar-open');
                        }}>
                            ☰
                        </button>
                        <div className="main-header-right">
                            <button className="btn btn-ghost btn-sm" onClick={logout}>
                                退出登录
                            </button>
                        </div>
                    </div>

                    <div className="page-container">
                        {activePage === 'dashboard' && <DashboardPage />}
                        {activePage === 'chat' && <ChatPage token={token} />}
                        {activePage === 'config' && <ConfigPage />}
                        {activePage === 'settings' && <SettingsPage />}
                    </div>
                </main>
            </div>
        </>
    );
}
