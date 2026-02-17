import StatusPanel from '../components/StatusPanel';

export default function DashboardPage() {
    return (
        <div className="dashboard-page animate-fadeIn">
            <h2 className="page-title">📊 仪表盘</h2>
            <StatusPanel />
        </div>
    );
}
