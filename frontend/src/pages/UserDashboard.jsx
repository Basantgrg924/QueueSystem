import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const UserDashboard = () => {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('queues');
  const [queues, setQueues] = useState([]);
  const [activeTokens, setActiveTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();

    const interval = setInterval(() => {
      if (activeTab === 'tokens' || activeTab === 'queues') {
        fetchTokens();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  const fetchInitialData = async () => {
    setPageLoading(true);
    try {
      await Promise.all([fetchQueues(), fetchTokens()]);
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

  const fetchTokens = async () => {
    if (!user?.token) return;

    try {
      const response = await axiosInstance.get('/api/tokens/my-tokens', {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const tokens = response.data.tokens || [];
      const active = tokens.filter((token) =>
        ['waiting', 'called', 'serving'].includes(token.status)
      );

      setActiveTokens(active);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    }
  };

  const handleJoinQueue = async (queueId) => {
    if (!user?.token) return;

    setLoading(true);
    try {
      const response = await axiosInstance.post(
        '/api/tokens/generate',
        { queueId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      alert(
        `Token generated successfully! Your token: ${response.data.token.tokenNumber}`
      );
      fetchTokens();
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to join queue';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelToken = async (tokenId) => {
    if (!user?.token) return;

    if (!window.confirm('Are you sure you want to cancel this token?')) {
      return;
    }

    try {
      await axiosInstance.patch(
        `/api/tokens/${tokenId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      alert('Token cancelled successfully');
      fetchTokens();
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to cancel token';
      alert(message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'called':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'serving':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no-show':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstimatedWaitTime = (estimatedCallTime) => {
    const now = new Date();
    const callTime = new Date(estimatedCallTime);
    const diffMinutes = Math.max(
      0,
      Math.floor((callTime - now) / (1000 * 60))
    );

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes`;
    }
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getPositionDisplay = (token) => {
    if (token.status === 'serving') return 'Being Served';
    if (token.status === 'called') return 'Called - Go Now!';
    if (
      token.currentPosition !== null &&
      token.currentPosition !== undefined
    ) {
      return `#${token.currentPosition}`;
    }
    return 'N/A';
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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
              <h1 className="text-2xl font-bold text-blue-600">QueueMS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.name || 'User'}
              </span>
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
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('queues')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'queues'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Available Queues
              </button>
              <button
                onClick={() => setActiveTab('tokens')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'tokens'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                My Tokens ({activeTokens.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Available Queues Tab */}
            {activeTab === 'queues' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Available Queues
                </h2>
                {queues.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {queues.map((queue) => (
                      <div
                        key={queue._id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {queue.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">
                            {queue.description}
                          </p>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Currently Waiting:
                            </span>
                            <span className="font-medium">
                              {queue.currentCount}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Capacity:</span>
                            <span className="font-medium">
                              {queue.maxCapacity}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Est. Wait Time:
                            </span>
                            <span className="font-medium">
                              ~{queue.estimatedWaitTime} min
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Avg Service Time:
                            </span>
                            <span className="font-medium">
                              {queue.avgServiceTime} min
                            </span>
                          </div>
                        </div>

                        {/* Queue Capacity Bar */}
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  (queue.currentCount /
                                    queue.maxCapacity) *
                                  100,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {queue.currentCount}/{queue.maxCapacity} capacity
                          </p>
                        </div>

                        <button
                          onClick={() => handleJoinQueue(queue._id)}
                          disabled={
                            loading || queue.currentCount >= queue.maxCapacity
                          }
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {queue.currentCount >= queue.maxCapacity
                            ? 'Queue Full'
                            : loading
                              ? 'Joining...'
                              : 'Join Queue'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Queues Available
                    </h3>
                    <p className="text-gray-600">
                      There are no active queues at the moment.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Active Tokens Tab */}
            {activeTab === 'tokens' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  My Active Tokens
                </h2>
                {activeTokens.length > 0 ? (
                  <div className="space-y-4">
                    {activeTokens.map((token) => (
                      <div
                        key={token.id}
                        className={`border-2 rounded-lg p-6 ${getStatusColor(
                          token.status
                        )}`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-3">
                              <h3 className="text-2xl font-bold text-gray-900">
                                {token.tokenNumber}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                  token.status
                                )}`}
                              >
                                {token.status.charAt(0).toUpperCase() +
                                  token.status.slice(1)}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-600">Queue</p>
                                <p className="font-semibold text-lg">
                                  {token.queueName}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Your Position
                                </p>
                                <p className="font-semibold text-lg">
                                  {getPositionDisplay(token)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Generated At
                                </p>
                                <p className="font-medium">
                                  {formatDateTime(token.createdAt)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Estimated Wait
                                </p>
                                <p className="font-medium">
                                  {getEstimatedWaitTime(
                                    token.estimatedCallTime
                                  )}
                                </p>
                              </div>
                            </div>

                            {token.status === 'called' && (
                              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                                <p className="text-blue-800 font-medium">
                                   Your token has been called! Please proceed
                                  to the service counter.
                                </p>
                              </div>
                            )}

                            {token.status === 'serving' && (
                              <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                                <p className="text-green-800 font-medium">
                                  You're currently being served!
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 lg:mt-0 lg:ml-6">
                            {token.status === 'waiting' && (
                              <button
                                onClick={() => handleCancelToken(token.id)}
                                className="px-6 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                              >
                                Cancel Token
                              </button>
                            )}

                            {token.status === 'called' && (
                              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <p className="text-blue-800 font-medium text-sm text-center">
                                  Please proceed to service counter
                                </p>
                              </div>
                            )}

                            {token.status === 'serving' && (
                              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                <p className="text-green-800 font-medium text-sm text-center">
                                  Being served now
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Active Tokens
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You don't have any active tokens. Join a queue to get
                      started!
                    </p>
                    <button
                      onClick={() => setActiveTab('queues')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Browse Queues
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;



