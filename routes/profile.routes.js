const express = require('express');
const router = express.Router();
const Profile = require('../models/profile.model');
const { requireAuth } = require('../middlewares/auth.middleware');

// 1. Lấy thông tin cá nhân của mình
router.get('/me', requireAuth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user._id });
        res.json(profile || {}); // Trả về object rỗng nếu chưa có profile
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. Cập nhật hoặc Tạo mới hồ sơ
router.post('/update', requireAuth, async (req, res) => {
    try {
        const { fullName, phone, address, gender, bio } = req.body;
        const profile = await Profile.findOneAndUpdate(
            { userId: req.user._id },
            { $set: { userId: req.user._id, fullName, phone, address, gender, bio } },
            { new: true, upsert: true }
        );
        res.json({ message: "Cập nhật hồ sơ thành công!", data: profile });
    } catch (err) { res.status(400).json({ message: "Lỗi: " + err.message }); }
});

// 3. Xóa hồ sơ
router.delete('/delete', requireAuth, async (req, res) => {
    try {
        await Profile.findOneAndDelete({ userId: req.user._id });
        res.json({ message: "Đã xóa toàn bộ thông tin cá nhân" });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;