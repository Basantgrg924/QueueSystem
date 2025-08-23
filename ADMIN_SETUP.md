# Default Admin Account Setup

This system automatically creates a default admin account on first startup for easy system administration.

## Setup Instructions

### 1. Configure Environment Variables

Copy the `.env.example` file to `.env` in the backend directory:

```bash
cd backend
cp .env.example .env
```

### 2. Set Admin Credentials

Edit the `.env` file and set the default admin credentials:

```env
# Default Admin Account (for initial setup only)
DEFAULT_ADMIN_EMAIL=admin@queuems.com
DEFAULT_ADMIN_PASSWORD=YourSecurePassword123!
DEFAULT_ADMIN_NAME=System Administrator
```

**⚠️ Important Security Notes:**
- Use a strong, unique password for `DEFAULT_ADMIN_PASSWORD`
- Change the default email if needed
- **DO NOT** commit the `.env` file to version control

### 3. Start the Server

When you start the server for the first time:

```bash
npm start
```

The system will automatically:
- Check if any admin user exists
- If no admin exists, create the default admin account
- Display success message with login credentials

### 4. First Login & Security

1. **Login** with the credentials you set in the `.env` file
2. **Immediately change the password** for security:
   - Go to Profile → Change Password tab
   - Enter current password and set a new secure password
3. **Update profile information** as needed

### 5. Security Features

- **Default Account Detection**: The system tracks if an account is using default credentials
- **Password Change Enforcement**: Warning messages prompt users to change default passwords
- **Secure Password Requirements**: Minimum 6 characters, different from current password
- **Password History**: Tracks when passwords were last changed

### 6. Production Deployment

For production environments:

1. Set strong environment variables
2. Use environment-specific `.env` files
3. Consider removing or rotating the `DEFAULT_ADMIN_PASSWORD` after initial setup
4. Enable additional security measures (rate limiting, 2FA, etc.)

## Login Credentials

After setup, login with:
- **Email**: The value you set for `DEFAULT_ADMIN_EMAIL`
- **Password**: The value you set for `DEFAULT_ADMIN_PASSWORD`

## Troubleshooting

### Admin Account Already Exists
If you see "Admin user already exists", it means:
- An admin account was already created
- Check your database for existing admin users
- The default account creation is skipped

### Missing Environment Variables
If you see "DEFAULT_ADMIN_PASSWORD not set":
- Check your `.env` file exists in the backend directory
- Verify `DEFAULT_ADMIN_PASSWORD` is set with a value
- Restart the server after updating environment variables

### Cannot Login
- Verify the email and password match your `.env` file
- Check the server logs for any error messages
- Ensure the database connection is working properly

## Default Admin Capabilities

The default admin account has full access to:
- ✅ User Management (view, create, modify, delete users)
- ✅ Queue Management (create, configure, monitor queues)
- ✅ System Overview (dashboard, analytics, reports)
- ✅ Audit Logs (view system activity and changes)
- ✅ Staff Management (assign roles, manage permissions)
- ✅ Profile Management (update info, change password)

## Next Steps

After successful admin setup:
1. Create additional admin accounts if needed
2. Set up staff accounts for queue management
3. Configure queues for your organization
4. Customize system settings and preferences
5. Set up monitoring and backup procedures