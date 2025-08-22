import { createContext, useContext, useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateAndLoadUser();
  }, []);

  const validateAndLoadUser = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get('/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const userData = {
        ...response.data,
        token: token
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('User validated from JWT:', userData);
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (loginResponse) => {
    console.log('Login response received:', loginResponse);

    if (!loginResponse.token || !loginResponse.role) {
      console.error('Login response missing required fields:', loginResponse);
      return { success: false, message: 'Invalid login response from server' };
    }

    localStorage.setItem('token', loginResponse.token);
    localStorage.setItem('user', JSON.stringify(loginResponse));

    setUser(loginResponse);

    console.log('User logged in successfully:', loginResponse);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('User logged out');
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const authenticatedRequest = async (method, url, data = null) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method,
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axiosInstance(config);
      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired or invalid
        logout();
        throw new Error('Session expired. Please log in again.');
      }
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    getAuthHeader,
    authenticatedRequest,
    validateAndLoadUser
    
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  // if (!context) {
  //   throw new Error('useAuth within an AuthProvider');
  // }
  return context;
};