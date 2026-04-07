const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true 
    },
    fullName: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: 'Khác' },
    bio: { type: String, default: 'Thành viên của Hành Trình Việt' }
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);