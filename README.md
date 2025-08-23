# QueueMS - Queue Management System

A comprehensive queue management system built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring real-time updates, role-based authentication, and comprehensive admin controls.

## Features

### Core Functionality
- **Real-time Queue Management**: Live updates using Socket.IO
- **Token System**: Digital queue tokens with status tracking
- **Role-based Access Control**: Admin, Staff, and User roles with different permissions
- **User Management**: Complete user lifecycle management
- **Audit Logging**: Comprehensive system activity tracking
- **Dashboard Analytics**: System overview and statistics

### User Roles & Permissions

#### Admin
- Full system control and configuration
- User management (create, update, delete users)
- Queue management and monitoring
- System analytics and audit logs
- Default admin account setup

#### Staff
- Queue operations and token management
- Customer service interface
- Token status updates
- Basic reporting

#### User/Customer
- Token request and management
- Real-time queue status
- Personal token history
- Profile management

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** for cross-origin requests

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls
- **Socket.IO Client** for real-time updates

## Project Structure

```
SDLCapp/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/              # Route controllers
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── queueController.js
│   │   └── tokenController.js
│   ├── middleware/               # Custom middleware
│   │   ├── authMiddleware.js
│   │   └── auditMiddleware.js
│   ├── models/                   # MongoDB models
│   │   ├── User.js
│   │   ├── Queue.js
│   │   ├── Token.js
│   │   └── AuditLog.js
│   ├── routes/                   # API routes
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── queueRoutes.js
│   │   └── tokenRoutes.js
│   ├── utils/
│   │   └── initializeAdmin.js    # Default admin setup
│   ├── server.js                 # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   ├── QueueManagement.jsx
│   │   │   └── ...
│   │   ├── pages/                # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── ...
│   │   ├── context/              # React context providers
│   │   │   ├── AuthContext.js
│   │   │   └── SocketContext.js
│   │   └── axiosConfig.jsx       # API configuration
│   ├── tailwind.config.js
│   └── package.json
└── package.json                  # Root package file
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SDLCapp
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/[DATABASE_NAME]
   JWT_SECRET=your_super_secret_jwt_key
   FRONTEND_URL=http://localhost:3000
   DEFAULT_ADMIN_EMAIL=SET_YOUR_EMAIL_HERE
   DEFAULT_ADMIN_PASSWORD=SET_YOUR_PASSWORD_HERE
   DEFAULT_ADMIN_NAME=SET_ADMIN_NAME_HERE
   PORT=SET_THE_PORT_HERE
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   npm run dev
   ```
   
   This starts both backend (port 5001) and frontend (port 3000) concurrently.

### Manual Setup

If you prefer to run backend and frontend separately:

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Default Admin Account

The system automatically creates a default admin account on first startup:
- **Email**: admin@queuems.com (configurable via .env)
- **Password**: SecureAdminPassword123! (configurable via .env)
- **Role**: Admin

⚠️ **Security Notice**: Change the default admin password immediately after first login.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Admin
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user

### Queues
- `GET /api/queues` - Get all queues
- `POST /api/queues` - Create new queue
- `PUT /api/queues/:id` - Update queue
- `DELETE /api/queues/:id` - Delete queue

### Tokens
- `GET /api/tokens` - Get user tokens
- `POST /api/tokens` - Create new token
- `PUT /api/tokens/:id/status` - Update token status

## Available Scripts

### Root Level
- `npm run install-all` - Install all dependencies
- `npm run dev` - Start both backend and frontend in development mode
- `npm start` - Start both backend and frontend in production mode

### Backend
- `npm run dev` - Start backend with nodemon
- `npm start` - Start backend in production mode
- `npm test` - Run backend tests

### Frontend
- `npm start` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm test` - Run frontend tests

## Development

### Code Style
- ESLint configuration for both frontend and backend
- Prettier for code formatting
- Tailwind CSS for consistent styling

### Testing
- Backend: Mocha with Chai
- Frontend: React Testing Library with Jest

## Deployment

### Using Docker

The project includes Dockerfiles for both backend and frontend.

1. **Backend Docker**
   ```bash
   cd backend
   docker build -t queuems-backend .
   docker run -p 5001:5001 queuems-backend
   ```

2. **Frontend Docker**
   ```bash
   cd frontend
   docker build -t queuems-frontend .
   docker run -p 80:80 queuems-frontend
   ```

### Production Build

1. **Build frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start production server**
   ```bash
   cd backend
   npm run prod
   ```

## Environment Variables

### Required Backend Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 5001)

### Optional Backend Variables
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)
- `DEFAULT_ADMIN_EMAIL` - Initial admin email
- `DEFAULT_ADMIN_PASSWORD` - Initial admin password
- `DEFAULT_ADMIN_NAME` - Initial admin name

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- CORS protection
- Input validation and sanitization
- Audit logging for admin actions
- Default account security warnings

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file

2. **Port Already in Use**
   - Change PORT in backend/.env
   - Kill existing processes on ports 3000/5001

3. **CORS Errors**
   - Verify FRONTEND_URL in backend/.env
   - Check network configuration

4. **Default Admin Not Created**
   - Check console logs for errors
   - Verify database permissions
   - Ensure all required environment variables are set

### Getting Help

- Check the console logs for detailed error messages
- Verify all dependencies are installed correctly
- Ensure MongoDB is accessible and running

## License

This project is licensed under the ISC License - see the package.json files for details.

## Team

Developed by the Task Manager Team

---

**QueueMS** - Streamlining queue management with modern web technologies.
