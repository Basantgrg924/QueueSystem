import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Mail } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', formData.email);
      
      const response = await axiosInstance.post('/api/auth/login', formData);
      
      console.log('Login API response:', response.data);
      
      if (!response.data.token) {
        throw new Error('Server did not return authentication token');
      }
      
      if (!response.data.role) {
        throw new Error('Server did not return user role');
      }

      const result = login(response.data);
      
      if (result.success) {
        console.log('Login successful, redirecting to dashboard');
        navigate('/dashboard');
      } else {
        setError(result.message || 'Login failed');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-sm border border-gray-200 rounded-xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
        
        {/* Development helper */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <p className="font-semibold mb-2">Test Accounts:</p>
            <p><Mail className="w-4 h-4 inline mr-2" />stafftest@gmail.com (Staff)</p>
            <p><Mail className="w-4 h-4 inline mr-2" />admin@example.com (Admin)</p>
            <p><Mail className="w-4 h-4 inline mr-2" />user@example.com (User)</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;