import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Hash,
  Building2
} from 'lucide-react';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const { socket, isConnected, joinQueueRoom, leaveQueueRoom } = useSocket();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState('');
  const [queueDetails, setQueueDetails] = useState(null);
  const [waitingTokens, setWaitingTokens] = useState([]);
  const [currentlyServing, setCurrentlyServing] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Filters for activity logs
  const [logFilters, setLogFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'all'
  });

  useEffect(() => {
    fetchInitialData();

    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      if (selectedQueue) {
        fetchQueueDetails(selectedQueue);
        fetchActivityLogs();
      }
    }, 15000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedQueue, logFilters]);

  // Socket.IO event listeners for real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      // Listen for queue updates
      socket.on('queue-updated', (data) => {
        console.log('Queue updated:', data);
        // Refresh queue data if it matches the selected queue
        if (selectedQueue && data.queueId === selectedQueue) {
          fetchQueueDetails(selectedQueue);
          fetchActivityLogs();
        }
        fetchQueues(); // Always refresh queue list for updated counts
      });

      return () => {
        socket.off('queue-updated');
      };
    }
  }, [socket, isConnected, selectedQueue]);

  // Join selected queue room for real-time updates
  useEffect(() => {
    if (selectedQueue && socket && isConnected) {
      joinQueueRoom(selectedQueue);
      
      return () => {
        leaveQueueRoom(selectedQueue);
      };
    }
  }, [selectedQueue, socket, isConnected, joinQueueRoom, leaveQueueRoom]);

  const fetchInitialData = async () => {
    setPageLoading(true);
    try {
      await Promise.all([
        fetchQueues(),
        fetchActivityLogs()
      ]);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchQueues = async () => {
    try {
      const response = await axiosInstance.get('/api/queues');
      setQueues(response.data.queues || []);
    } catch (error) {
      console.error('Failed to fetch queues:', error);
    }
  };

  const fetchQueueDetails = async (queueId) => {
    try {
      const response = await axiosInstance.get(`/api/queues/${queueId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setQueueDetails(response.data.queue);

      // Fetch currently serving token
      const servingResponse = await axiosInstance.get(`/api/tokens/queue/${queueId}/history`, {
        headers: { Authorization: `Bearer ${user.token}` },
        params: {
          status: 'serving',
          limit: 1
        }
      });

      // If no serving token, check for called tokens
      if (!servingResponse.data.tokens || servingResponse.data.tokens.length === 0) {
        const calledResponse = await axiosInstance.get(`/api/tokens/queue/${queueId}/history`, {
          headers: { Authorization: `Bearer ${user.token}` },
          params: {
            status: 'called',
            limit: 1
          }
        });
        setCurrentlyServing(calledResponse.data.tokens?.[0] || null);
      } else {
        setCurrentlyServing(servingResponse.data.tokens[0]);
      }

      // Fetch queue position to get waiting tokens with current positions
      const positionResponse = await axiosInstance.get(`/api/queues/${queueId}/position`);
      setWaitingTokens(positionResponse.data.waitingTokens || []);
    } catch (error) {
      console.error('Failed to fetch queue details:', error);
    }
  };

  const fetchActivityLogs = async () => {
    if (!selectedQueue) return;

    try {
      const response = await axiosInstance.get(`/api/tokens/queue/${selectedQueue}/history`, {
        headers: { Authorization: `Bearer ${user.token}` },
        params: {
          date: logFilters.date,
          status: logFilters.status === 'all' ? undefined : logFilters.status,
          limit: 50
        }
      });
      setActivityLogs(response.data.tokens || []);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    }
  };

  const handleQueueSelect = (queueId) => {
    setSelectedQueue(queueId);
    if (queueId) {
      fetchQueueDetails(queueId);
      fetchActivityLogs();
    } else {
      setQueueDetails(null);
      setWaitingTokens([]);
      setCurrentlyServing(null);
      setActivityLogs([]);
    }
  };

  const handleCallNext = async () => {
    if (!selectedQueue) return;

    setLoading(true);
    try {
      const response = await axiosInstance.post(`/api/tokens/queue/${selectedQueue}/call-next`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      alert(`Called token: ${response.data.token.tokenNumber}`);
      fetchQueueDetails(selectedQueue);
      fetchActivityLogs();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to call next token';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTokenStatus = async (tokenId, status, notes = '') => {
    setLoading(true);
    try {
      await axiosInstance.patch(`/api/tokens/${tokenId}/status`, {
        status,
        notes
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      alert(`Token status updated to ${status}`);
      fetchQueueDetails(selectedQueue);
      fetchActivityLogs();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update token status';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'called': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'serving': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no-show': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">QueueMS Staff</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Real-time connection status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600">
                  {isConnected ? 'Live Updates' : 'Offline'}
                </span>
              </div>
              <span className="text-gray-700">Staff: {user?.name}</span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Queue Selection */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Select Queue to Manage</h2>
          <select
            value={selectedQueue}
            onChange={(e) => handleQueueSelect(e.target.value)}
            className="w-full max-w-md p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a queue...</option>
            {queues.map((queue) => (
              <option key={queue._id} value={queue._id}>
                {queue.name} ({queue.currentCount} waiting)
              </option>
            ))}
          </select>
        </div>

        {/* Tab Navigation */}
        {selectedQueue && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'dashboard'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Queue Control
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'activity'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Activity Logs
                </button>
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'statistics'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Statistics
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Queue Control Tab */}
              {activeTab === 'dashboard' && queueDetails && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Current Status & Controls */}
                  <div className="space-y-6">
                    {/* Queue Info */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 text-lg">{queueDetails.name}</h3>
                      <p className="text-blue-700 text-sm mb-3">{queueDetails.description}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600 font-medium">Waiting:</span>
                          <p className="text-xl font-bold text-blue-900">{queueDetails.currentCount}</p>
                        </div>
                        <div>
                          <span className="text-blue-600 font-medium">Capacity:</span>
                          <p className="text-xl font-bold text-blue-900">{queueDetails.maxCapacity}</p>
                        </div>
                        <div>
                          <span className="text-blue-600 font-medium">Avg Service:</span>
                          <p className="text-xl font-bold text-blue-900">{queueDetails.avgServiceTime}m</p>
                        </div>
                      </div>
                    </div>

                    {/* Currently Serving */}
                    <div>
                      <h3 className="font-semibold mb-3 text-lg">Currently Serving</h3>
                      {currentlyServing ? (
                        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-2xl font-bold text-green-900">
                                {currentlyServing.tokenNumber}
                              </p>
                              <p className="text-green-700 font-medium">
                                Customer: {currentlyServing.userId.name}
                              </p>
                              <p className="text-green-600 text-sm">
                                Email: {currentlyServing.userId.email}
                              </p>
                              {currentlyServing.calledAt && (
                                <p className="text-green-600 text-sm">
                                  Called at: {formatTime(currentlyServing.calledAt)}
                                </p>
                              )}
                            </div>
                            <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(currentlyServing.status)}`}>
                              {currentlyServing.status.charAt(0).toUpperCase() + currentlyServing.status.slice(1)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {currentlyServing.status === 'called' && (
                              <button
                                onClick={() => handleUpdateTokenStatus(currentlyServing._id, 'serving')}
                                disabled={loading}
                                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors flex items-center"
                              >
                                <Play className="w-4 h-4 mr-1" /> Start Serving
                              </button>
                            )}
                            {(currentlyServing.status === 'serving' || currentlyServing.status === 'called') && (
                              <button
                                onClick={() => handleUpdateTokenStatus(currentlyServing._id, 'completed')}
                                disabled={loading}
                                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium transition-colors flex items-center"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Mark Completed
                              </button>
                            )}
                            {(currentlyServing.status === 'serving' || currentlyServing.status === 'called') && (
                              <button
                                onClick={() => handleUpdateTokenStatus(currentlyServing._id, 'no-show')}
                                disabled={loading}
                                className="bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 font-medium transition-colors flex items-center"
                              >
                                <XCircle className="w-4 h-4 mr-1" /> No Show
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-lg text-center">
                          <p className="text-gray-600 text-lg">No one is currently being served</p>
                          <p className="text-gray-500 text-sm mt-1">Call the next token to start serving</p>
                        </div>
                      )}
                    </div>

                    {/* Call Next Button */}
                    <div>
                      <button
                        onClick={handleCallNext}
                        disabled={loading || waitingTokens.length === 0}
                        className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors flex items-center justify-center"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Processing...
                          </span>
                        ) : (
                          <><Hash className="w-5 h-5 mr-2" /> Call Next Token ({waitingTokens.length} waiting)</>
                        )}
                      </button>

                      {waitingTokens.length === 0 && (
                        <p className="text-sm text-gray-500 text-center mt-2">
                          No tokens waiting in queue
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Waiting Queue */}
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">
                      Waiting Queue ({waitingTokens.length})
                    </h3>

                    <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {waitingTokens.length > 0 ? (
                        waitingTokens.slice(0, 10).map((token, index) => (
                          <div key={token.tokenNumber} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-lg">
                                  #{token.position || index + 1} - {token.tokenNumber}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Est. Call: {formatTime(token.estimatedCallTime)}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                                  Position {token.position || index + 1}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No tokens waiting</p>
                        </div>
                      )}

                      {waitingTokens.length > 10 && (
                        <div className="text-center py-2 text-sm text-gray-500">
                          ... and {waitingTokens.length - 10} more tokens waiting
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Logs Tab */}
              {activeTab === 'activity' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>

                    {/* Filters */}
                    <div className="flex space-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={logFilters.date}
                          onChange={(e) => setLogFilters({ ...logFilters, date: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={logFilters.status}
                          onChange={(e) => setLogFilters({ ...logFilters, status: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Status</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="no-show">No Show</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Activity Table */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Token
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Completed
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Service Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {activityLogs.length > 0 ? (
                            activityLogs.map((log) => (
                              <tr key={log._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {log.tokenNumber}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{log.userId.name}</div>
                                  <div className="text-sm text-gray-500">{log.userId.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDateTime(log.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {log.completedAt ? formatDateTime(log.completedAt) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {log.servedAt && log.completedAt ? (
                                    `${Math.round((new Date(log.completedAt) - new Date(log.servedAt)) / 60000)} min`
                                  ) : '-'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                No activity logs found for the selected criteria
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics Tab */}
              {activeTab === 'statistics' && queueDetails && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Queue Statistics</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Today's Stats */}
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-2">Today's Tokens</h3>
                      <p className="text-3xl font-bold text-blue-700">
                        {activityLogs.length}
                      </p>
                    </div>

                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-2">Completed</h3>
                      <p className="text-3xl font-bold text-green-700">
                        {activityLogs.filter(log => log.status === 'completed').length}
                      </p>
                    </div>

                    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold text-yellow-900 mb-2">Currently Waiting</h3>
                      <p className="text-3xl font-bold text-yellow-700">
                        {waitingTokens.length}
                      </p>
                    </div>

                    <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                      <h3 className="font-semibold text-red-900 mb-2">No Shows</h3>
                      <p className="text-3xl font-bold text-red-700">
                        {activityLogs.filter(log => log.status === 'no-show').length}
                      </p>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Average Service Time</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {queueDetails.avgServiceTime} min
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {activityLogs.length > 0
                            ? Math.round((activityLogs.filter(log => log.status === 'completed').length / activityLogs.length) * 100)
                            : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Queue Utilization</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round((queueDetails.currentCount / queueDetails.maxCapacity) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Queue Selected */}
        {!selectedQueue && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">
              <Building2 className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Select a Queue to Get Started
            </h3>
            <p className="text-gray-600">
              Choose a queue from the dropdown above to begin managing tokens and serving customers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;