# Queue Management System

A real-time queue management system built with the MERN stack.

## Features

- Real-time queue updates with Socket.IO
- Digital token system with status tracking
- Role-based access (Admin, Staff, User)
- User management and audit logging
- Dashboard analytics

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Socket.IO, JWT
- **Frontend**: React 18, React Router, Tailwind CSS, Axios

## Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)

### Setup

1. Clone and install dependencies:
   ```bash
   git clone <repository-url>
   cd SDLCapp
   npm run install-all
   ```

2. Configure environment variables in `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/queuems
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:3000
   DEFAULT_ADMIN_EMAIL=admin@example.com
   DEFAULT_ADMIN_PASSWORD=your_admin_password
   PORT=5001
   ```

3. Start the application:
   ```bash
   npm run dev
   ```

4. Start the backend:
   ```bash
   node server.js
   ```

   Backend runs on port 5001, frontend on port 3000.

## Available Scripts

- `npm run install-all` - Install all dependencies
- `npm run dev` - Start development servers
- `npm start` - Start production servers
- `node server.js` - Start backend servers

## License

ISC License
