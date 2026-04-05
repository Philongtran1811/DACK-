const express = require("express");
const router = express.Router();

const Room = require("../models/room.model");
const RoomType = require("../models/roomType.model");


// ================= GET ALL =================
router.get("/", async (req, res) => {
    try {
        const rooms = await Room.find().populate("roomType");
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});


// ================= GET DETAIL =================
router.get("/:id", async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate("roomType");

        if (!room) {
            return res.status(404).json({ message: "Không tìm thấy phòng" });
        }

        res.json(room);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});


// ================= CREATE =================
router.post("/", async (req, res) => {
    try {
        const { roomCode, roomType, image, status } = req.body;

        if (!roomCode || roomCode.trim() === "") {
            return res.status(400).json({ message: "Mã phòng không được để trống" });
        }

        const existed = await Room.findOne({ roomCode: roomCode.trim() });
        if (existed) {
            return res.status(400).json({ message: "Mã phòng đã tồn tại" });
        }

        const type = await RoomType.findById(roomType);
        if (!type) {
            return res.status(400).json({ message: "Loại phòng không tồn tại" });
        }

        const newRoom = await Room.create({
            roomCode: roomCode.trim(),
            roomType,
            image: image && image.trim() !== "" ? image : undefined,
            status: status || "AVAILABLE"
        });

        res.json({ message: "Tạo phòng thành công", data: newRoom });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lỗi server" });
    }
});


// ================= UPDATE =================
router.put("/:id", async (req, res) => {
    try {
        const { roomCode, roomType, image, status } = req.body;

        if (!roomCode || roomCode.trim() === "") {
            return res.status(400).json({ message: "Mã phòng không hợp lệ" });
        }

        const type = await RoomType.findById(roomType);
        if (!type) {
            return res.status(400).json({ message: "Loại phòng không tồn tại" });
        }

        const updated = await Room.findByIdAndUpdate(
            req.params.id,
            {
                roomCode: roomCode.trim(),
                roomType,
                image: image && image.trim() !== "" ? image : undefined,
                status
            },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Không tìm thấy phòng" });
        }

        res.json({ message: "Cập nhật thành công", data: updated });

    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});


// ================= DELETE =================
router.delete("/:id", async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: "Không tìm thấy phòng" });
        }

        if (room.status === "BOOKED") {
            return res.status(400).json({ message: "Không thể xóa phòng đang được đặt" });
        }

        await Room.findByIdAndDelete(req.params.id);

        res.json({ message: "Xóa thành công" });

    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;