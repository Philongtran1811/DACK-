const express = require("express");
const router = express.Router();

const RoomType = require("../models/roomType.model");
const Room = require("../models/room.model");


// ================= GET ALL =================
router.get("/", async (req, res) => {
    try {
        const roomTypes = await RoomType.find();
        res.json(roomTypes);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});


// ================= GET DETAIL =================
router.get("/:id", async (req, res) => {
    try {
        const roomType = await RoomType.findById(req.params.id);

        if (!roomType) {
            return res.status(404).json({ message: "Không tìm thấy loại phòng" });
        }

        res.json(roomType);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});


// ================= CREATE =================
router.post("/", async (req, res) => {
    try {
        const { name, price } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Tên không được để trống" });
        }

        if (!price || price < 0) {
            return res.status(400).json({ message: "Giá không hợp lệ" });
        }

        const existed = await RoomType.findOne({ name: name.trim() });
        if (existed) {
            return res.status(400).json({ message: "Loại phòng đã tồn tại" });
        }

        const newType = await RoomType.create({
            name: name.trim(),
            price
        });

        res.json({ message: "Tạo loại phòng thành công", data: newType });

    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});


// ================= UPDATE =================
router.put("/:id", async (req, res) => {
    try {
        const { name, price } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Tên không hợp lệ" });
        }

        if (!price || price < 0) {
            return res.status(400).json({ message: "Giá không hợp lệ" });
        }

        const updated = await RoomType.findByIdAndUpdate(
            req.params.id,
            { name: name.trim(), price },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Không tìm thấy loại phòng" });
        }

        res.json({ message: "Cập nhật thành công", data: updated });

    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});


// ================= DELETE =================
router.delete("/:id", async (req, res) => {
    try {
        const count = await Room.countDocuments({ roomType: req.params.id });

        if (count > 0) {
            return res.status(400).json({ message: "Không thể xóa, có phòng đang dùng loại này" });
        }

        await RoomType.findByIdAndDelete(req.params.id);

        res.json({ message: "Xóa thành công" });

    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;