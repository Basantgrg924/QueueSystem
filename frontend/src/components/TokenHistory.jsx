import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import { ClipboardList } from 'lucide-react';

const TokenHistory = () => {
    const { user } = useAuth();
    const [tokens, setTokens] = useState([]);
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalTokens: 0,
        hasNextPage: false,
        hasPrevPage: false
    });

    // Filters
    const [filters, setFilters] = useState({
        status: 'all',
        queueId: 'all',
        dateFrom: '',
        dateTo: '',
        page: 1,
        limit: 10
    });

    useEffect(() => {
        fetchQueues();
    }, []);

    const fetchQueues = async () => {
        try {
            const response = await axiosInstance.get('/api/queues');
            setQueues(response.data.queues || []);
        } catch (error) {
            console.error('Failed to fetch queues:', error);
        }
    };

    const fetchTokenHistory = useCallback(async () => {
        if (!user?.token) return;

        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key] && filters[key] !== 'all') {
                    params.append(key, filters[key]);
                }
            });

            const response = await axiosInstance.get(`/api/tokens/my-history?${params}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setTokens(response.data.data.tokens || []);
            setPagination(response.data.data.pagination || {});
        } catch (error) {
            console.error('Failed to fetch token history:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, user?.token]);

    useEffect(() => {
        fetchTokenHistory();
    }, [fetchTokenHistory]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1 // Reset to first page when filters change
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const clearFilters = () => {
        setFilters({
            status: 'all',
            queueId: 'all',
            dateFrom: '',
            dateTo: '',
            page: 1,
            limit: 10
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'no-show': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes) => {
        if (!minutes || minutes === 0) return '-';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Token History</h2>
                <div className="text-sm text-gray-600">
                    Total: {pagination.totalTokens} tokens
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no-show">No Show</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Queue
                        </label>
                        <select
                            value={filters.queueId}
                            onChange={(e) => handleFilterChange('queueId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Queues</option>
                            {queues.map(queue => (
                                <option key={queue._id} value={queue._id}>
                                    {queue.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Date
                        </label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            To Date
                        </label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <button
                            onClick={clearFilters}
                            className="w-full px-4 py-3 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading history...</span>
                </div>
            )}

            {/* Tokens Table */}
            {!loading && (
                <>
                    {tokens.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Token
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Queue
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Wait Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Service Time
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {tokens.map((token) => (
                                            <tr key={token.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {token.tokenNumber}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{token.queueName}</div>
                                                    <div className="text-xs text-gray-500">{token.queueDescription}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(token.status)}`}>
                                                        {token.status.charAt(0).toUpperCase() + token.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDateTime(token.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDuration(token.totalWaitTime)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDuration(token.serviceDuration)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={!pagination.hasPrevPage}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={!pagination.hasNextPage}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing page{' '}
                                                <span className="font-medium">{pagination.currentPage}</span> of{' '}
                                                <span className="font-medium">{pagination.totalPages}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                <button
                                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                                    disabled={!pagination.hasPrevPage}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                                    disabled={!pagination.hasNextPage}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">
                                <ClipboardList className="w-16 h-16 mx-auto" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Token History Found
                            </h3>
                            <p className="text-gray-600">
                                {filters.status !== 'all' || filters.queueId !== 'all' || filters.dateFrom || filters.dateTo
                                    ? 'No tokens match your current filters.'
                                    : 'Your completed tokens will appear here.'}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TokenHistory;