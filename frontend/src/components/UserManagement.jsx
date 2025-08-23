import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { Users, AlertTriangle, Trash2 } from 'lucide-react';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFilters, setUserFilters] = useState({
    role: 'all',
    search: ''
  });
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    university: '',
    address: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const fetchUsers = useCallback(async (resetPagination = true) => {
    if (resetPagination) setPageLoading(true);
    try {
      const response = await axiosInstance.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${user.token}` },
        params: {
          role: userFilters.role === 'all' ? undefined : userFilters.role,
          search: userFilters.search || undefined,
          page: 1,
          limit: 20
        }
      });
      setUsers(response.data.users || []);
      setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Mock data for development
      setUsers([
        {
          _id: '1',
          name: 'System Administrator',
          email: 'admin@example.com',
          role: 'admin',
          university: 'System Default',
          isDefaultAccount: true,
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          name: 'John Admin',
          email: 'johnadmin@example.com',
          role: 'admin',
          university: 'Tech University',
          isDefaultAccount: false,
          createdAt: new Date().toISOString()
        },
        {
          _id: '3',
          name: 'Jane Staff',
          email: 'staff@example.com',
          role: 'staff',
          university: 'Service College',
          isDefaultAccount: false,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setPageLoading(false);
    }
  }, [user.token, userFilters.role, userFilters.search]);

  // Simple initial fetch without dependencies that cause refresh
  useEffect(() => {
    if (user.token) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search input change with local state management only
  const handleSearchChange = (value) => {
    // Update local state immediately for responsive UI
    setUserFilters(prev => ({ ...prev, search: value }));
    
    // Don't trigger any navigation or API calls here
    // Let the debounced effect handle the actual search
  };

  // Debounced search effect - completely separate from input handling
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only make API call, don't cause any navigation
      const performSearch = async () => {
        try {
          const response = await axiosInstance.get('/api/admin/users', {
            headers: { Authorization: `Bearer ${user.token}` },
            params: {
              role: userFilters.role === 'all' ? undefined : userFilters.role,
              search: userFilters.search || undefined,
              page: 1,
              limit: 20
            }
          });
          setUsers(response.data.users || []);
          setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
        } catch (error) {
          console.error('Search failed:', error);
          // Fallback to mock data on error, no page refresh
        }
      };
      
      if (user.token) {
        performSearch();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userFilters.search, userFilters.role, user.token]);

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/api/auth/register', userForm);
      
      // If creating staff/admin, update their role
      if (userForm.role !== 'user') {
        setTimeout(async () => {
          try {
            const usersResponse = await axiosInstance.get('/api/admin/users', {
              headers: { Authorization: `Bearer ${user.token}` },
              params: { search: userForm.email }
            });
            const newUser = usersResponse.data.users.find(u => u.email === userForm.email);
            if (newUser) {
              await axiosInstance.put(`/api/admin/users/${newUser._id}/role`, {
                role: userForm.role
              }, {
                headers: { Authorization: `Bearer ${user.token}` }
              });
            }
          } catch (roleError) {
            console.error('Failed to update role:', roleError);
          }
        }, 1000);
      }
      
      alert('User created successfully!');
      setShowUserForm(false);
      setUserForm({ name: '', email: '', password: '', role: 'user', university: '', address: '' });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole, userName, userData) => {
    // Prevent changing default admin account
    if (userData.isDefaultAccount && userData.role === 'admin') {
      alert('Cannot change the role of the default admin account for security reasons.');
      return;
    }

    if (!window.confirm(`Change ${userName}'s role to ${newRole}?`)) {
      return;
    }
    
    try {
      await axiosInstance.put(`/api/admin/users/${userId}/role`, {
        role: newRole
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('User role updated successfully!');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const isDefaultAdmin = (userData) => {
    return userData.isDefaultAccount && userData.role === 'admin';
  };

  const getWarningTooltip = (userData) => {
    if (isDefaultAdmin(userData)) {
      return 'This is the default admin account and cannot be changed for security reasons.';
    }
    if (userData._id === user.id) {
      return 'You cannot change your own role or delete your own account.';
    }
    return null;
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await axiosInstance.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1 text">Manage user accounts and permissions</p>
        </div>
        <button
          onClick={() => {
            setShowUserForm(true);
            setUserForm({ name: '', email: '', password: '', role: 'user', university: '', address: '' });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm"
        >
          + Create New User
        </button>
      </div>

      {/* User Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Filters</h2>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              value={userFilters.role}
              onChange={(e) => {
                e.stopPropagation();
                setUserFilters(prev => ({ ...prev, role: e.target.value }));
              }}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userFilters.search}
                onChange={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleSearchChange(e.target.value);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    return false;
                  }
                }}
                onSubmit={(e) => {
                  e.preventDefault();
                  return false;
                }}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Role *
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User (Regular Customer)</option>
                  <option value="staff">Staff (Service Provider)</option>
                  <option value="admin">Admin (System Administrator)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  University/Institution
                </label>
                <input
                  type="text"
                  value={userForm.university}
                  onChange={(e) => setUserForm({ ...userForm, university: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={userForm.address}
                  onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowUserForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-base font-semibold text-gray-900 tracking-wide">
                    User Information
                  </th>
                  <th className="px-8 py-4 text-left text-base font-semibold text-gray-900 tracking-wide">
                    Role
                  </th>
                  <th className="px-8 py-4 text-left text-base font-semibold text-gray-900 tracking-wide">
                    University
                  </th>
                  <th className="px-8 py-4 text-left text-base font-semibold text-gray-900 tracking-wide">
                    Created
                  </th>
                  <th className="px-8 py-4 text-left text-base font-semibold text-gray-900 tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userData) => (
                  <tr key={userData._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-4">
                      <div>
                        <div className="text-base font-semibold text-gray-900">{userData.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{userData.email}</div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`px-3 py-2 rounded-full text-sm font-semibold ${getRoleColor(userData.role)}`}>
                        {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-700">
                      {userData.university || 'Not specified'}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-700">
                      {formatDateTime(userData.createdAt)}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {/* Warning Icon with Tooltip */}
                        {getWarningTooltip(userData) && (
                          <div className="relative group">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none shadow-lg">
                              {getWarningTooltip(userData)}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-200"></div>
                            </div>
                          </div>
                        )}

                        {/* Role Change Buttons */}
                        <div className="flex space-x-2">
                          {userData.role !== 'admin' && !isDefaultAdmin(userData) && (
                            <button
                              onClick={() => handleUpdateUserRole(userData._id, 'admin', userData.name, userData)}
                              className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              disabled={userData._id === user.id}
                              title={userData._id === user.id ? 'Cannot change your own role' : 'Make Admin'}
                            >
                              Admin
                            </button>
                          )}
                          {userData.role !== 'staff' && !isDefaultAdmin(userData) && (
                            <button
                              onClick={() => handleUpdateUserRole(userData._id, 'staff', userData.name, userData)}
                              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              disabled={userData._id === user.id}
                              title={userData._id === user.id ? 'Cannot change your own role' : 'Make Staff'}
                            >
                              Staff
                            </button>
                          )}
                          {userData.role !== 'user' && !isDefaultAdmin(userData) && (
                            <button
                              onClick={() => handleUpdateUserRole(userData._id, 'user', userData.name, userData)}
                              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              disabled={userData._id === user.id}
                              title={userData._id === user.id ? 'Cannot change your own role' : 'Make User'}
                            >
                              User
                            </button>
                          )}
                        </div>
                        
                        {/* Delete Button */}
                        {!isDefaultAdmin(userData) && (
                          <button
                            onClick={() => handleDeleteUser(userData._id, userData.name)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={userData._id === user.id}
                            title={userData._id === user.id ? 'Cannot delete your own account' : 'Delete User'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              <Users className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Users Found
            </h3>
            <p className="text-gray-600 mb-4">
              {userFilters.role !== 'all' || userFilters.search 
                ? 'No users match your current filters.' 
                : 'Start by creating your first user account.'}
            </p>
            {(userFilters.role !== 'all' || userFilters.search) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setUserFilters({ role: 'all', search: '' });
                }}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => {
                setShowUserForm(true);
                setUserForm({ name: '', email: '', password: '', role: 'user', university: '', address: '' });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create New User
            </button>
          </div>
        )}
      </div>

      {/* User Statistics */}
      {users.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-900">Administrators</h4>
            <p className="text-2xl font-bold text-red-700">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900">Staff Members</h4>
            <p className="text-2xl font-bold text-blue-700">
              {users.filter(u => u.role === 'staff').length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900">Regular Users</h4>
            <p className="text-2xl font-bold text-green-700">
              {users.filter(u => u.role === 'user').length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-900">Total Users</h4>
            <p className="text-2xl font-bold text-purple-700">{users.length}</p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              Previous
            </button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">
              {pagination.current} of {pagination.pages}
            </span>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;