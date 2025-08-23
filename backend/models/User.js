const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String },
    university: { type: String },
    role: {
        type: String,
        enum: ["admin", "staff", "user"],
        required: true,
        default: "user"
    },
    isDefaultAccount: { type: Boolean, default: false },
    lastPasswordChange: { type: Date, default: Date.now }
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    next();
});

module.exports = mongoose.model('User', userSchema);