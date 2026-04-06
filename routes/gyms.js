const express = require("express");
const router = express.Router();
const Gym = require("../models/services/gym.model");

// Hàm bổ trợ lấy ảnh Gym "xịn" tự động theo từ khóa
const getGymImage = (name, currentImage) => {
    if (currentImage && currentImage.trim() !== "") return currentImage.trim();
    
    const query = encodeURIComponent(name || "gym fitness luxury");
    return `https://source.unsplash.com/featured/?${query},fitness,workout`;
};

// ================= 🔍 1. LẤY DANH SÁCH (READ) =================
router.get("/", async (req, res) => {
    try {
        const services = await Gym.find().sort({ createdAt: -1 });
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

// ================= ➕ 2. THÊM GÓI TẬP (CREATE) =================
router.post("/", async (req, res) => {
    try {
        const { name, image, description } = req.body;

        // Bây giờ chỉ cần tên là đủ để tạo dịch vụ
        if (!name) {
            return res.status(400).json({ message: "Vui lòng nhập tên gói tập/dịch vụ Gym" });
        }

        const newGym = await Gym.create({
            name: name.trim(),
            description: description || "Trải nghiệm phòng tập hiện đại bậc nhất tại khách sạn.",
            image: getGymImage(name, image)
        });

        res.status(201).json({ message: "Thêm dịch vụ Gym thành công", data: newGym });
    } catch (err) {
        res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }
});

// ================= ✏️ 3. CẬP NHẬT (UPDATE) =================
router.put("/:id", async (req, res) => {
    try {
        const { name, image, description } = req.body;
        let updateData = {};

        if (name) updateData.name = name.trim();
        if (description) updateData.description = description;
        
        if (image !== undefined) {
            updateData.image = getGymImage(name || "gym", image);
        }

        const updatedGym = await Gym.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedGym) return res.status(404).json({ message: "Không tìm thấy gói tập" });
        res.json({ message: "Cập nhật thành công", data: updatedGym });
    } catch (err) {
        res.status(400).json({ message: "Lỗi khi cập nhật" });
    }
});

// ================= ❌ 4. XÓA (DELETE) =================
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Gym.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy gói tập" });
        res.json({ message: "Đã xóa dịch vụ Gym thành công" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;