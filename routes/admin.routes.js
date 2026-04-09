const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Booking = require('../models/booking.model'); // Thêm model Booking
const bcrypt = require('bcrypt');
const { isAdmin } = require('../middlewares/auth.middleware');

// 👤 1. Lấy danh sách tất cả User
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải danh sách người dùng" });
    }
});

// 🔒 3. Khóa hoặc Mở khóa tài khoản
router.put('/users/:id/toggle-status', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy User" });

        user.isActive = !user.isActive;
        await user.save();
        res.json({ message: "Cập nhật trạng thái thành công", isActive: user.isActive });
    } catch (err) {
        res.status(500).json({ message: "Lỗi Server" });
    }
});

// 🔑 4. Cấp mật khẩu mới
router.put('/users/:id/reset-password', isAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ message: "Mật khẩu trống" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
        res.json({ message: "Đã đổi mật khẩu thành công!" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi reset mật khẩu" });
    }
});

// 🗑️ 5. Xóa vĩnh viễn tài khoản
router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa tài khoản vĩnh viễn" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi xóa" });
    }
});

module.exports = router;