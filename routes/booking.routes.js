const express = require("express");
const router = express.Router();
const Booking = require("../models/booking.model");
const Room = require("../models/room.model");
const Review = require("../models/review.model");
const { isStaff, requireAuth } = require("../middlewares/auth.middleware");

// ================= 1. TẠO BOOKING (Khách hàng) =================
router.post("/", async (req, res) => {
    try {
        const { roomId, checkIn, checkOut, rating, comment } = req.body;

        if (!req.user) return res.status(401).json({ message: "Bạn cần đăng nhập" });

        // Kiểm tra ngày
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (isNaN(start) || isNaN(end) || start >= end) {
            return res.status(400).json({ message: "Ngày không hợp lệ" });
        }

        // Kiểm tra phòng & Trùng lịch
        const room = await Room.findById(roomId).populate("roomType");
        if (!room) return res.status(404).json({ message: "Phòng không tồn tại" });

        const exists = await Booking.findOne({
            room: roomId,
            status: { $in: ["CONFIRMED", "CHECKED_IN"] },
            checkIn: { $lt: end },
            checkOut: { $gt: start }
        });

        if (exists) return res.status(400).json({ message: "Phòng đã có người đặt" });

        // Tính tiền
        const days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
        const totalPrice = days * (room.roomType?.price || 0);

        const booking = await Booking.create({
            user: req.user._id,
            room: roomId,
            checkIn: start,
            checkOut: end,
            totalPrice,
            status: "CONFIRMED"
        });

        if (rating) {
            await Review.create({
                user: req.user._id,
                room: roomId,
                rating: Number(rating),
                comment: comment || ""
            });
        }

        res.status(201).json({ message: "🎉 Đặt phòng thành công!", data: booking });
    } catch (err) {
        res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
    }
});

// ================= 2. XEM LỊCH SỬ (Khách hàng) =================
router.get("/my-history", requireAuth, async (req, res) => {
    try {
        const myBookings = await Booking.find({ user: req.user._id })
            .populate({ path: 'room', populate: { path: 'roomType' } })
            .sort({ createdAt: -1 });

        res.render("profile/history", { bookings: myBookings, user: req.user });
    } catch (err) {
        res.status(500).send("Lỗi khi tải lịch sử");
    }
});
// ================= 3. QUẢN LÝ TẤT CẢ BOOKING (Lễ tân & Admin) =================
router.get("/manage", requireAuth, async (req, res) => {
    try {
        // Kiểm tra quyền thủ công ngay tại đây
        if (req.user.role !== 'RECEPTIONIST' && req.user.role !== 'ADMIN') {
            return res.status(403).send("Chỉ Lễ tân hoặc Admin mới có quyền vào đây!");
        }

        const bookings = await Booking.find()
            .populate("user", "name phone email")
            .populate({ path: 'room', populate: { path: 'roomType' } })
            .sort({ createdAt: -1 });

        // Nếu là Admin thì có thể render ra giao diện riêng hoặc dùng chung với Lễ tân
        const viewPath = req.user.role === 'ADMIN' ? "admin/manage_bookings" : "receptionist/manage";
        
        // Nếu bro muốn dùng chung 1 file manage của lễ tân thì cứ để nguyên:
        res.render("receptionist/manage", { bookings, user: req.user });

    } catch (err) {
        res.status(500).send("Lỗi tải trang quản lý");
    }
});

// ================= 4. CẬP NHẬT TRẠNG THÁI (Lễ tân & Admin) =================
// Dùng để Check-in, Check-out
router.post("/update-status/:id", requireAuth, isStaff, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate("room");

        if (!booking) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        // Tự động cập nhật trạng thái phòng thực tế
        if (status === "CHECKED_IN") {
            await Room.findByIdAndUpdate(booking.room._id, { status: "BOOKED" });
        } else if (status === "COMPLETED" || status === "CANCELLED") {
            await Room.findByIdAndUpdate(booking.room._id, { status: "AVAILABLE" });
        }

        res.json({ message: "Cập nhật trạng thái thành công", data: booking });
    } catch (err) {
        res.status(500).json({ message: "Lỗi cập nhật" });
    }
});

// ================= 5. HỦY PHÒNG (Dành cho khách hoặc lễ tân) =================
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        // Chỉ cho phép hủy nếu là chủ đơn hoặc nhân viên
        if (booking.user.toString() !== req.user._id.toString() && req.user.role === "USER") {
            return res.status(403).json({ message: "Không có quyền" });
        }

        booking.status = "CANCELLED";
        await booking.save();
        
        // Trả phòng về trạng thái sẵn sàng
        await Room.findByIdAndUpdate(booking.room, { status: "AVAILABLE" });

        res.json({ message: "Đã hủy đặt phòng thành công" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi hủy" });
    }
});

module.exports = router;