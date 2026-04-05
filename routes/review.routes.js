const express = require("express");
const router = express.Router();
const Review = require("../models/review.model");
const Booking = require("../models/booking.model");
const { checkUser } = require("../middlewares/auth.middleware");

// ================= GỬI ĐÁNH GIÁ (POST) =================
router.post("/", checkUser, async (req, res) => {
    try {
        const { roomId, rating, comment } = req.body;

        // 1. Kiểm tra đăng nhập
        if (!req.user) {
            return res.status(401).json({ message: "Bạn cần đăng nhập để thực hiện đánh giá" });
        }

        // 2. 🔥 LOGIC QUAN TRỌNG: Kiểm tra xem user đã từng đặt phòng này chưa
        // Tìm một đơn đặt phòng thành công (CONFIRMED) của User này cho Room này
        const hasBooked = await Booking.findOne({
            user: req.user._id,
            room: roomId,
            status: "CONFIRMED"
        });

        if (!hasBooked) {
            return res.status(403).json({ 
                message: "🔒 Bạn chỉ có thể đánh giá sau khi đã đặt phòng thành công!" 
            });
        }

        // 3. Kiểm tra xem đã đánh giá phòng này chưa (Tránh spam)
        const alreadyReviewed = await Review.findOne({
            user: req.user._id,
            room: roomId
        });

        if (alreadyReviewed) {
            return res.status(400).json({ message: "Bạn đã để lại đánh giá cho phòng này rồi" });
        }

        // 4. Lưu đánh giá
        const newReview = await Review.create({
            user: req.user._id,
            room: roomId,
            rating: Number(rating),
            comment: comment ? comment.trim() : ""
        });

        res.status(201).json({ 
            message: "🎉 Cảm ơn bạn đã chia sẻ trải nghiệm!", 
            review: newReview 
        });

    } catch (err) {
        console.error("🔥 Review Error:", err);
        res.status(500).json({ message: "Lỗi server khi gửi đánh giá" });
    }
});

// ================= LẤY DANH SÁCH ĐÁNH GIÁ (GET) =================
router.get("/room/:roomId", async (req, res) => {
    try {
        const reviews = await Review.find({ room: req.params.roomId })
            .populate("user", "name username") // Chỉ lấy tên để hiển thị
            .sort({ createdAt: -1 }); // Mới nhất lên đầu

        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi tải đánh giá" });
    }
});

module.exports = router;