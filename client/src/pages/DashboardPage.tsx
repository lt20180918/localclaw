import { useAuth } from '../context/AuthContext';
import StatusPanel from '../components/StatusPanel';
import ChatWindow from '../components/ChatWindow';

export default function DashboardPage() {
    const { logout } = useAuth();

    const token = localStorage.getItem('token');

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

                <ChatWindow token={token} />
            </div>
        </div>
    );
}
