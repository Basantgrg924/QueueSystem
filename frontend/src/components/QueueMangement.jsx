import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Building2 } from 'lucide-react';

const QueueManagement = () => {
    const { user } = useAuth();
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [showQueueForm, setShowQueueForm] = useState(false);
    const [editingQueue, setEditingQueue] = useState(null);
    const [queueForm, setQueueForm] = useState({
        name: '',
        description: '',
        maxCapacity: 50,
        avgServiceTime: 10
    });

    useEffect(() => {
        fetchQueues();
    }, []);

    const fetchQueues = async () => {
        try {
            // Use admin endpoint to get both active and inactive queues
            const response = await axiosInstance.get('/api/queues/admin/manage', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            console.log('Admin queue management fetch response:', response.data);
            setQueues(response.data.queues || []);
        } catch (error) {
            console.error('Failed to fetch admin queues:', error);
            console.error('Error details:', error.response?.data);
            
            // Fallback to public endpoint
            try {
                console.log('Falling back to public endpoint...');
                const fallbackResponse = await axiosInstance.get('/api/queues');
                console.log('Fallback response:', fallbackResponse.data);
                setQueues(fallbackResponse.data.queues || []);
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                setQueues([]);
            }
        } finally {
            setPageLoading(false);
        }
    };

    const handleCreateQueue = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosInstance.post('/api/queues', queueForm, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Queue created successfully!');
            setShowQueueForm(false);
            setQueueForm({ name: '', description: '', maxCapacity: 50, avgServiceTime: 10 });
            fetchQueues();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create queue');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQueue = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosInstance.put(`/api/queues/${editingQueue._id}`, queueForm, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Queue updated successfully!');
            setEditingQueue(null);
            setShowQueueForm(false);
            setQueueForm({ name: '', description: '', maxCapacity: 50, avgServiceTime: 10 });
            fetchQueues();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update queue');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQueue = async (queueId, queueName) => {
        if (!window.confirm(`Are you sure you want to delete "${queueName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await axiosInstance.delete(`/api/queues/${queueId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Queue deleted successfully!');
            fetchQueues();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete queue');
        }
    };

    const handleEditQueue = (queue) => {
        setEditingQueue(queue);
        setQueueForm({
            name: queue.name,
            description: queue.description,
            maxCapacity: queue.maxCapacity,
            avgServiceTime: queue.avgServiceTime
        });
        setShowQueueForm(true);
    };

    const handleToggleQueueStatus = async (queueId, currentStatus) => {
        try {
            await axiosInstance.put(`/api/queues/${queueId}`, {
                isActive: !currentStatus
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchQueues();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update queue status');
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

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Queue Management</h2>
                <button
                    onClick={() => {
                        setShowQueueForm(true);
                        setEditingQueue(null);
                        setQueueForm({ name: '', description: '', maxCapacity: 50, avgServiceTime: 10 });
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm"
                >
                    + Create New Queue
                </button>
            </div>
            {/* Queue Form Modal */}
            {showQueueForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingQueue ? 'Edit Queue' : 'Create New Queue'}
                        </h3>
                        <form onSubmit={editingQueue ? handleUpdateQueue : handleCreateQueue}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Queue Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={queueForm.name}
                                        onChange={(e) => setQueueForm({ ...queueForm, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Document Verification"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={queueForm.description}
                                        onChange={(e) => setQueueForm({ ...queueForm, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Brief description of the service..."
                                        rows="3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Maximum Capacity *
                                    </label>
                                    <input
                                        type="number"
                                        value={queueForm.maxCapacity}
                                        onChange={(e) => setQueueForm({ ...queueForm, maxCapacity: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="1"
                                        max="500"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Maximum number of people allowed in queue</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Average Service Time (minutes) *
                                    </label>
                                    <input
                                        type="number"
                                        value={queueForm.avgServiceTime}
                                        onChange={(e) => setQueueForm({ ...queueForm, avgServiceTime: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="1"
                                        max="120"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Average time to serve one customer</p>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowQueueForm(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? 'Saving...' : (editingQueue ? 'Update Queue' : 'Create Queue')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Queues List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {queues.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Queue Information
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Utilization
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Service Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {queues.map((queue) => (
                                    <tr key={queue._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{queue.name}</div>
                                                <div className="text-sm text-gray-500">{queue.description || 'No description'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className={`px-3 py-2 rounded-full text-sm font-semibold ${queue.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {queue.isActive ? 'Active' : 'Deactivated'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {queue.currentCount}/{queue.maxCapacity}
                                            </div>
                                            <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{
                                                        width: `${Math.min((queue.currentCount / queue.maxCapacity) * 100, 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {queue.avgServiceTime} min
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDateTime(queue.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => handleEditQueue(queue)}
                                                    className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                                                >
                                                    Edit
                                                </button>
                                                
                                                {/* Toggle Status Button */}
                                                <button
                                                    onClick={() => handleToggleQueueStatus(queue._id, queue.isActive)}
                                                    className={`px-3 py-2 text-sm rounded-lg transition-colors font-medium ${
                                                        queue.isActive 
                                                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }`}
                                                >
                                                    {queue.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                
                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDeleteQueue(queue._id, queue.name)}
                                                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                                    disabled={queue.currentCount > 0}
                                                    title={queue.currentCount > 0 ? `Cannot delete: ${queue.currentCount} active tokens` : 'Delete Queue'}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                            {queue.currentCount > 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Cannot delete: {queue.currentCount} active tokens
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">
                            <Building2 className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Queues Created Yet
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Create your first queue to start managing customer flow.
                        </p>
                        <button
                            onClick={() => {
                                setShowQueueForm(true);
                                setEditingQueue(null);
                                setQueueForm({ name: '', description: '', maxCapacity: 50, avgServiceTime: 10 });
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Create Your First Queue
                        </button>
                    </div>
                )}
            </div>

            {/* Queue Statistics Summary */}
            {queues.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900">Total Queues</h4>
                        <p className="text-2xl font-bold text-blue-700">{queues.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-900">Active Queues</h4>
                        <p className="text-2xl font-bold text-green-700">
                            {queues.filter(q => q.isActive).length}
                        </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-yellow-900">Total Capacity</h4>
                        <p className="text-2xl font-bold text-yellow-700">
                            {queues.reduce((sum, q) => sum + q.maxCapacity, 0)}
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-purple-900">Current Utilization</h4>
                        <p className="text-2xl font-bold text-purple-700">
                            {queues.reduce((sum, q) => sum + q.currentCount, 0)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QueueManagement;