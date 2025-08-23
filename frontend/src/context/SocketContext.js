import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { Bell, UserCheck, CheckCircle, XCircle, AlertTriangle, MessageSquare } from 'lucide-react';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user?.token) {
            // Create socket connection
            const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001', {
                transports: ['websocket', 'polling'],
                timeout: 20000,
            });

            newSocket.on('connect', () => {
                console.log('Connected to server:', newSocket.id);
                setIsConnected(true);
                
                // Join user's personal room for notifications
                newSocket.emit('join-user-room', user.id);
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from server');
                setIsConnected(false);
            });

            // Listen for token called notifications
            newSocket.on('token-called', (data) => {
                console.log('Token called notification:', data);
                
                // Show toast notification
                toast.success(data.message, {
                    duration: 8000,
                    position: 'top-center',
                    style: {
                        background: '#10B981',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '16px',
                        borderRadius: '8px',
                    },
                    icon: <Bell className="w-5 h-5" />,
                });

                // Play notification sound (optional)
                try {
                    const audio = new Audio('/notification-sound.mp3');
                    audio.play().catch(e => console.log('Could not play notification sound'));
                } catch (e) {
                    console.log('Notification sound not available');
                }
            });

            // Listen for token status updates
            newSocket.on('token-status-updated', (data) => {
                console.log('Token status updated:', data);
                
                let toastStyle = {};
                let IconComponent = MessageSquare;
                
                switch (data.newStatus) {
                    case 'serving':
                        toastStyle = { background: '#3B82F6', color: 'white' };
                        IconComponent = UserCheck;
                        break;
                    case 'completed':
                        toastStyle = { background: '#10B981', color: 'white' };
                        IconComponent = CheckCircle;
                        break;
                    case 'cancelled':
                        toastStyle = { background: '#EF4444', color: 'white' };
                        IconComponent = XCircle;
                        break;
                    case 'no-show':
                        toastStyle = { background: '#F59E0B', color: 'white' };
                        IconComponent = AlertTriangle;
                        break;
                    default:
                        toastStyle = { background: '#6B7280', color: 'white' };
                        IconComponent = MessageSquare;
                }

                toast(data.message, {
                    duration: 5000,
                    position: 'top-center',
                    style: {
                        ...toastStyle,
                        fontWeight: 'bold',
                        padding: '16px',
                        borderRadius: '8px',
                    },
                    icon: <IconComponent className="w-5 h-5" />,
                });
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setIsConnected(false);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [user]);

    const joinQueueRoom = (queueId) => {
        if (socket && isConnected) {
            socket.emit('join-queue-room', queueId);
        }
    };

    const leaveQueueRoom = (queueId) => {
        if (socket && isConnected) {
            socket.emit('leave-queue-room', queueId);
        }
    };

    const value = {
        socket,
        isConnected,
        joinQueueRoom,
        leaveQueueRoom
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;