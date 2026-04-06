const express = require("express");
const router = express.Router();
const Spa = require("../models/services/spa.model");

// Hàm bổ trợ lấy ảnh Spa "chill" tự động theo từ khóa
const getSpaImage = (name, currentImage) => {
    if (currentImage && currentImage.trim() !== "") return currentImage.trim();
    
    // Nếu trống, tự lấy ảnh từ Unsplash (vd: Massage, Sauna, Skin care...)
    const query = encodeURIComponent(name || "spa wellness luxury");
    return `https://source.unsplash.com/featured/?${query},spa,massage,relax`;
};

// ================= 🔍 1. LẤY DANH SÁCH (READ) =================
router.get("/", async (req, res) => {
    try {
        const services = await Spa.find().sort({ createdAt: -1 });
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

// ================= ➕ 2. THÊM DỊCH VỤ SPA (CREATE) =================
router.post("/", async (req, res) => {
    try {
        const { name, image, description } = req.body;

        // Chỉ bắt buộc nhập tên dịch vụ
        if (!name) {
            return res.status(400).json({ message: "Vui lòng nhập tên dịch vụ Spa" });
        }

        const newSpa = await Spa.create({
            name: name.trim(),
            description: description || "Không gian thư giãn đẳng cấp giúp bạn tái tạo năng lượng.",
            // ✅ TỰ ĐỘNG: Lấy ảnh theo tên dịch vụ nếu để trống
            image: getSpaImage(name, image)
        });

        res.status(201).json({ message: "Thêm dịch vụ Spa thành công", data: newSpa });
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
        
        // ✅ TỰ ĐỘNG: Cập nhật lại ảnh thông minh nếu cần
        if (image !== undefined) {
            updateData.image = getSpaImage(name || "spa", image);
        }

        const updatedSpa = await Spa.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedSpa) return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
        res.json({ message: "Cập nhật thành công", data: updatedSpa });
    } catch (err) {
        res.status(400).json({ message: "Lỗi khi cập nhật" });
    }
});

// ================= ❌ 4. XÓA (DELETE) =================
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Spa.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
        res.json({ message: "Đã xóa dịch vụ Spa thành công" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;