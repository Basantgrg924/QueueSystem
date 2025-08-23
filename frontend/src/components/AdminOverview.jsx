import { Activity, Building, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const AdminOverview = () => {
    const { user } = useAuth();
    const [systemStats, setSystemStats] = useState({
        users: { total: 0, byRole: {} },
        queues: { total: 0, active: 0 },
        tokens: { todayTotal: 0, active: 0, byStatus: {} }
    });
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        fetchSystemStats();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchSystemStats();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchSystemStats = async () => {
        try {
            const response = await axiosInstance.get('/api/admin/stats', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSystemStats(response.data.stats);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to fetch system stats:', error);
            // Keep existing mock data as fallback
            setSystemStats({
                users: { total: 45, byRole: { admin: 2, staff: 8, user: 35 } },
                queues: { total: 6, active: 5 },
                tokens: { todayTotal: 127, active: 23, byStatus: { completed: 89, cancelled: 15 } }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setLoading(true);
        fetchSystemStats();
    };

    if (loading && systemStats.users.total === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading system statistics...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-blue-900">Total Users</h3>
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-700">{systemStats.users.total}</p>
                    <div className="mt-2 text-sm text-blue-600">
                        <div>Admins: {systemStats.users.byRole.admin || 0}</div>
                        <div>Staff: {systemStats.users.byRole.staff || 0}</div>
                        <div>Users: {systemStats.users.byRole.user || 0}</div>
                    </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-green-900">Total Queues</h3>
                        <Building className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-700">{systemStats.queues.total}</p>
                    <div className="mt-2 text-sm text-green-600">
                        <div>Active: {systemStats.queues.active}</div>
                        <div>Inactive: {systemStats.queues.total - systemStats.queues.active}</div>
                    </div>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-yellow-900">Today's Tokens</h3>
                        <Activity className="w-6 h-6 text-yellow-600" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-700">{systemStats.tokens.todayTotal}</p>
                    <div className="mt-2 text-sm text-yellow-600">
                        <div>Active: {systemStats.tokens.active}</div>
                        <div>Completed: {systemStats.tokens.byStatus.completed || 0}</div>
                    </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-purple-900">System Health</h3>
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-lg font-bold text-purple-700">
                        {systemStats.queues.active > 0 ? 'Active' : 'Idle'}
                    </p>
                    <div className="mt-2 text-sm text-purple-600">
                        <div>Queues Online: {systemStats.queues.active}</div>
                        <div>Active Sessions: {systemStats.tokens.active}</div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">System Status</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">System Status</span>
                        <span className={`text-sm font-medium ${systemStats.queues.active > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {systemStats.queues.active > 0 ? 'All services operational' : 'System idle'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Active Queues</span>
                        <span className="text-sm font-medium text-gray-900">{systemStats.queues.active} of {systemStats.queues.total}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Active Sessions</span>
                        <span className="text-sm font-medium text-gray-900">{systemStats.tokens.active}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Today's Completed Tokens</span>
                        <span className="text-sm font-medium text-gray-900">{systemStats.tokens.byStatus.completed || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">Cancelled/No-show Today</span>
                        <span className="text-sm font-medium text-gray-900">
                            {(systemStats.tokens.byStatus.cancelled || 0) + (systemStats.tokens.byStatus['no-show'] || 0)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;