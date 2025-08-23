import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { Users } from 'lucide-react';

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

  const fetchUsers = useCallback(async () => {
    setPageLoading(true);
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
          name: 'John Admin',
          email: 'admin@example.com',
          role: 'admin',
          university: 'Tech University',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          name: 'Jane Staff',
          email: 'staff@example.com',
          role: 'staff',
          university: 'Service College',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setPageLoading(false);
    }
  }, [user.token, userFilters.role, userFilters.search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const handleUpdateUserRole = async (userId, newRole, userName) => {
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <button
          onClick={() => {
            setShowUserForm(true);
            setUserForm({ name: '', email: '', password: '', role: 'user', university: '', address: '' });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          + Create New User
        </button>
      </div>

      {/* User Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Role
          </label>
          <select
            value={userFilters.role}
            onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Users
          </label>
          <div className="flex">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={userFilters.search}
              onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-700 transition-colors"
            >
              Search
            </button>
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
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
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
                {users.map((userData) => (
                  <tr key={userData._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                        <div className="text-sm text-gray-500">{userData.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userData.role)}`}>
                        {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userData.university || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(userData.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-1">
                        {/* Role Change Buttons */}
                        <div className="flex space-x-1">
                          {userData.role !== 'admin' && (
                            <button
                              onClick={() => handleUpdateUserRole(userData._id, 'admin', userData.name)}
                              className="text-xs text-red-600 hover:text-red-900 transition-colors"
                              disabled={userData._id === user.id}
                            >
                              Make Admin
                            </button>
                          )}
                          {userData.role !== 'staff' && (
                            <button
                              onClick={() => handleUpdateUserRole(userData._id, 'staff', userData.name)}
                              className="text-xs text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              Make Staff
                            </button>
                          )}
                          {userData.role !== 'user' && (
                            <button
                              onClick={() => handleUpdateUserRole(userData._id, 'user', userData.name)}
                              className="text-xs text-green-600 hover:text-green-900 transition-colors"
                            >
                              Make User
                            </button>
                          )}
                        </div>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(userData._id, userData.name)}
                          className="text-xs text-red-600 hover:text-red-900 transition-colors text-left"
                          disabled={userData._id === user.id}
                        >
                          {userData._id === user.id ? 'Cannot delete self' : 'Delete User'}
                        </button>
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
                onClick={() => {
                  setUserFilters({ role: 'all', search: '' });
                  fetchUsers();
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