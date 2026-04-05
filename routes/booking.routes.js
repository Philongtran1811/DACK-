const express = require("express");
const router = express.Router();

const Booking = require("../models/booking.model");
const Room = require("../models/room.model");
const Review = require("../models/review.model"); 

// ================= CREATE BOOKING =================
router.post("/", async (req, res) => {
    try {
        // 1. Kiểm tra dữ liệu từ Frontend gửi lên
        const { roomId, checkIn, checkOut, rating, comment } = req.body;
        
        // Log để bạn check trong Terminal xem roomId có bị undefined không
        console.log("--- Kiểm tra dữ liệu ---");
        console.log("Room ID nhận được:", roomId);
        console.log("User hiện tại:", req.user ? req.user._id : "Không có user");

        // 2. Kiểm tra User (Bắt buộc)
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Bạn cần đăng nhập để đặt phòng" });
        }

        // 3. Kiểm tra định dạng ID phòng (Tránh lỗi CastError gây 500)
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({ message: "Mã phòng không hợp lệ" });
        }

        // 4. Kiểm tra Phòng tồn tại
        const room = await Room.findById(roomId).populate("roomType");
        if (!room) {
            return res.status(404).json({ message: "Phòng không tồn tại" });
        }

        // 5. Kiểm tra ngày
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
            return res.status(400).json({ message: "Ngày đặt phòng không hợp lệ" });
        }

        // 6. Kiểm tra trùng lịch
        const exists = await Booking.findOne({
            room: roomId,
            status: { $ne: "CANCELLED" },
            checkIn: { $lt: end },
            checkOut: { $gt: start }
        });

        if (exists) {
            return res.status(400).json({ message: "Phòng đã có người đặt trong thời gian này" });
        }

        // 7. Tính tiền
        const diffTime = Math.abs(end - start);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const pricePerDay = room.roomType?.price || 0;
        const totalPrice = days * pricePerDay;

        // 8. Tạo Booking (Quan trọng: Tên trường phải khớp Schema là 'room')
        const booking = await Booking.create({
            user: req.user._id,
            room: roomId, // Gán roomId vào trường room trong Schema
            checkIn: start,
            checkOut: end,
            totalPrice: totalPrice,
            status: "CONFIRMED"
        });

        // 9. Lưu Review (Nếu có)
        if (rating) {
            await Review.create({
                user: req.user._id,
                room: roomId,
                rating: Number(rating),
                comment: comment || ""
            });
        }

        res.status(201).json({
            message: "🎉 Đặt phòng thành công!",
            data: booking
        });

    } catch (err) {
        // In lỗi chi tiết ra Terminal của VS Code để bạn copy cho mình nếu vẫn lỗi
        console.error("🔥 LỖI TẠI ĐÂY:");
        console.error(err); 
        res.status(500).json({ 
            message: "Lỗi hệ thống khi đặt phòng", 
            error: err.message 
        });
    }
});

// ================= GET ALL BOOKINGS =================
router.get("/", async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user", "name email") 
            .populate({
                path: "room",
                populate: { path: "roomType" }
            });

        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi lấy danh sách" });
    }
});

// ================= CANCEL BOOKING =================
router.delete("/:id", async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id, 
            { status: "CANCELLED" },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
        }

        res.json({ message: "Đã hủy đặt phòng thành công", data: booking });

    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi hủy phòng" });
    }
});
// 📋 Lấy lịch sử đặt phòng của người dùng hiện tại
router.get("/my-history", async (req, res) => {
    try {
        // Kiểm tra xem user đã đăng nhập chưa (req.user lấy từ middleware checkUser)
        if (!req.user) {
            return res.redirect("/login");
        }

        const myBookings = await Booking.find({ user: req.user._id })
            .populate({
                path: 'room',
                populate: { path: 'roomType' } // Lấy luôn giá và tên loại phòng
            })
            .sort({ createdAt: -1 }); // Mới nhất hiện lên đầu

        res.render("profile/history", { 
            bookings: myBookings, 
            user: req.user 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi khi tải lịch sử");
    }
    });
module.exports = router;