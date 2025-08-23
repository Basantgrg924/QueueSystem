const User = require('../models/User');
const bcrypt = require('bcrypt');

const initializeDefaultAdmin = async () => {
    try {
        // Check if any admin user exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            console.log('Admin user already exists. Skipping initialization.');
            return;
        }

        // Get admin credentials from environment variables
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@queuems.com';
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
        const adminName = process.env.DEFAULT_ADMIN_NAME || 'System Administrator';

        if (!adminPassword) {
            console.warn('⚠️  DEFAULT_ADMIN_PASSWORD not set in environment variables.');
            console.warn('⚠️  Please set DEFAULT_ADMIN_PASSWORD to create default admin account.');
            return;
        }

        // Check if admin with this email already exists
        const existingUser = await User.findOne({ email: adminEmail });
        if (existingUser) {
            console.log(`User with email ${adminEmail} already exists. Skipping admin creation.`);
            return;
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create the default admin user
        const defaultAdmin = new User({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            address: 'System Default',
            // Add a flag to indicate this is a default account that should change password
            isDefaultAccount: true
        });

        await defaultAdmin.save();

        console.log('✅ Default admin account created successfully!');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Role: admin`);
        console.log('⚠️  IMPORTANT: Please change the default password after first login for security!');

    } catch (error) {
        console.error('❌ Error creating default admin account:', error.message);
    }
};

module.exports = initializeDefaultAdmin;