const express = require('express');
const router = express.Router();

// ✅ FIX lỗi của bạn (đường dẫn đúng)
require('../config/db');

// Model (đảm bảo bạn có file này)
const Review = require('../models/review.model');

// =======================
// 📌 1. Lấy tất cả review
// =======================
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name')
            .populate('room', 'roomCode');

        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// =======================
// 📌 2. Tạo review
// =======================
router.post('/create', async (req, res) => {
    try {
        const { user, room, rating, comment } = req.body;

        const newReview = new Review({
            user,
            room,
            rating,
            comment
        });

        await newReview.save();

        res.status(201).json({
            message: 'Đánh giá thành công',
            data: newReview
        });
    } catch (err) {
        res.status(500).json({ message: 'Không thể tạo review' });
    }
});

// =======================
// 📌 3. Xóa review
// =======================
router.delete('/:id', async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);

        res.json({ message: 'Đã xóa review' });
    } catch (err) {
        res.status(500).json({ message: 'Không thể xóa' });
    }
});

// =======================
// 📌 4. Lấy review theo phòng
// =======================
router.get('/room/:roomId', async (req, res) => {
    try {
        const reviews = await Review.find({ room: req.params.roomId })
            .populate('user', 'name');

        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;