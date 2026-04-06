const express = require("express");
const router = express.Router();
const Swim = require("../models/services/swim.model");

// Hàm bổ trợ lấy ảnh Hồ bơi "xịn" tự động theo từ khóa
const getSwimImage = (name, currentImage) => {
    if (currentImage && currentImage.trim() !== "") return currentImage.trim();
    
    // Nếu trống, tự lấy ảnh từ Unsplash (vd: Infinity pool, Resort pool...)
    const query = encodeURIComponent(name || "luxury swimming pool");
    return `https://source.unsplash.com/featured/?${query},pool,water,resort`;
};

// ================= 🔍 1. LẤY DANH SÁCH (READ) =================
router.get("/", async (req, res) => {
    try {
        // Hiện món mới nhất lên đầu cho xịn
        const services = await Swim.find().sort({ createdAt: -1 });
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

// ================= ➕ 2. THÊM DỊCH VỤ BƠI (CREATE) =================
router.post("/", async (req, res) => {
    try {
        const { name, image, description } = req.body;

        // Bây giờ không cần check 'price' nữa, chỉ cần 'name'
        if (!name) {
            return res.status(400).json({ message: "Vui lòng nhập tên dịch vụ hồ bơi" });
        }

        const newSwim = await Swim.create({
            name: name.trim(),
            description: description || "Tận hưởng làn nước mát lành và không gian nghỉ dưỡng tuyệt vời.",
            // ✅ TỰ ĐỘNG: Lấy ảnh theo tên dịch vụ nếu để trống
            image: getSwimImage(name, image)
        });

        res.status(201).json({ message: "Thêm dịch vụ bơi thành công", data: newSwim });
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
            updateData.image = getSwimImage(name || "pool", image);
        }

        const updatedSwim = await Swim.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedSwim) return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
        res.json({ message: "Cập nhật thành công", data: updatedSwim });
    } catch (err) {
        res.status(400).json({ message: "Lỗi khi cập nhật" });
    }
});

// ================= ❌ 4. XÓA (DELETE) =================
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Swim.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
        res.json({ message: "Đã xóa dịch vụ bơi thành công" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;