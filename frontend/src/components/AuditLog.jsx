import {
    Activity,
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Filter,
    RefreshCw,
    Search,
    Shield,
    User,
    XCircle
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const AuditLog = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        action: '',
        userId: '',
        targetType: '',
        status: '',
        startDate: '',
        endDate: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalLogs: 0,
        limit: 20
    });
    const [filterOptions, setFilterOptions] = useState({
        actions: [],
        users: [],
        targetTypes: [],
        statuses: []
    });
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const selectedTimeRange = '7d';

    const fetchAuditLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.currentPage,
                limit: pagination.limit,
                ...filters
            });

            // Remove empty values
            for (const [key, value] of params.entries()) {
                if (!value) {
                    params.delete(key);
                }
            }

            const response = await axiosInstance.get(`/api/audit?${params}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setLogs(response.data.data.logs);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, pagination.limit, filters, user.token]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axiosInstance.get(`/api/audit/stats?timeRange=${selectedTimeRange}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch audit stats:', error);
        }
    }, [selectedTimeRange, user.token]);

    const fetchFilterOptions = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/api/audit/filters', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFilterOptions(response.data.data);
        } catch (error) {
            console.error('Failed to fetch filter options:', error);
        }
    }, [user.token]);

    useEffect(() => {
        fetchAuditLogs();
        fetchFilterOptions();
        fetchStats();
    }, [fetchAuditLogs, fetchFilterOptions, fetchStats]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            action: '',
            userId: '',
            targetType: '',
            status: '',
            startDate: '',
            endDate: '',
            search: ''
        });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    };

    const getActionIcon = (iconName) => {
        const iconMap = {
            'plus-circle': <CheckCircle className="w-4 h-4" />,
            'edit': <RefreshCw className="w-4 h-4" />,
            'trash-2': <XCircle className="w-4 h-4" />,
            'play-circle': <CheckCircle className="w-4 h-4" />,
            'pause-circle': <XCircle className="w-4 h-4" />,
            'ticket': <Activity className="w-4 h-4" />,
            'bell': <Activity className="w-4 h-4" />,
            'refresh-cw': <RefreshCw className="w-4 h-4" />,
            'x-circle': <XCircle className="w-4 h-4" />,
            'user-plus': <User className="w-4 h-4" />,
            'user-check': <User className="w-4 h-4" />,
            'user-x': <User className="w-4 h-4" />,
            'shield': <Shield className="w-4 h-4" />,
            'log-in': <Activity className="w-4 h-4" />,
            'log-out': <Activity className="w-4 h-4" />,
            'shield-check': <Shield className="w-4 h-4" />,
            'settings': <Activity className="w-4 h-4" />,
            'download': <Download className="w-4 h-4" />,
            'upload': <Download className="w-4 h-4" />,
            'file-down': <Download className="w-4 h-4" />,
            'file-up': <Download className="w-4 h-4" />,
            'activity': <Activity className="w-4 h-4" />
        };
        return iconMap[iconName] || <Activity className="w-4 h-4" />;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'FAILED':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'PARTIAL':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getActionColor = (color) => {
        const colorMap = {
            'blue': 'bg-blue-100 text-blue-800 border-blue-200',
            'green': 'bg-green-100 text-green-800 border-green-200',
            'red': 'bg-red-100 text-red-800 border-red-200',
            'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'purple': 'bg-purple-100 text-purple-800 border-purple-200',
            'orange': 'bg-orange-100 text-orange-800 border-orange-200',
            'indigo': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'gray': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Shield className="w-6 h-6 mr-2" />
                        Audit Log
                    </h2>
                    <p className="text-gray-600 mt-1">Monitor all system activities and user actions</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                        <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={fetchAuditLogs}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Actions</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalActions}</p>
                            </div>
                            <Activity className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Failed Actions</p>
                                <p className="text-2xl font-bold text-600">{stats.statusStats.failed || 0}</p>
                            </div>
                            <XCircle className="w-5 h-5 text-red-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Users</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.actionsByUser.length}</p>
                            </div>
                            <User className="w-5 h-5 text-purple-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            {showFilters && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Search descriptions..."
                                    className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                            <select
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Actions</option>
                                {filterOptions.actions.map(action => (
                                    <option key={action} value={action}>{action.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                            <select
                                value={filters.userId}
                                onChange={(e) => handleFilterChange('userId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Users</option>
                                {filterOptions.users.map(user => (
                                    <option key={user._id} value={user._id}>{user.name} ({user.role})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="SUCCESS">Success</option>
                                <option value="FAILED">Failed</option>
                                <option value="PARTIAL">Partial</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Log Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Loading audit logs...</span>
                    </div>
                ) : logs.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`p-2 rounded-full ${getActionColor(log.actionColor)} mr-3`}>
                                                        {getActionIcon(log.actionIcon)}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {log.action.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{log.user.name}</div>
                                                <div className="text-sm text-gray-500">{log.user.role}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{log.description}</div>
                                                {log.errorMessage && (
                                                    <div className="text-sm text-red-600 mt-1">
                                                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                                                        {log.errorMessage}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {formatDate(log.createdAt)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={!pagination.hasPrevPage}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                                        <span className="font-medium">
                                            {Math.min(pagination.currentPage * pagination.limit, pagination.totalLogs)}
                                        </span>{' '}
                                        of <span className="font-medium">{pagination.totalLogs}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={!pagination.hasPrevPage}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                            Page {pagination.currentPage} of {pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={!pagination.hasNextPage}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">
                            <Shield className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Audit Logs Found
                        </h3>
                        <p className="text-gray-600">
                            No audit logs match your current filters. Try adjusting your search criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLog;