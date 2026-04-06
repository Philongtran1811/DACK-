const express = require("express");
const router = express.Router();
const Food = require("../models/services/food.model");

// ================= 🔍 LẤY TẤT CẢ (READ) =================
router.get("/", async (req, res) => {
    try {
        // Sắp xếp món mới nhất lên đầu
        const foods = await Food.find().sort({ createdAt: -1 });
        res.json(foods);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

// ================= ➕ THÊM MỚI (CREATE) =================
router.post("/", async (req, res) => {
    try {
        const { name, image, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Vui lòng nhập tên món ăn/dịch vụ" });
        }

        const newFood = await Food.create({
            name: name.trim(),
            description: description || "Dịch vụ chất lượng cao tại khách sạn.",
            image: image ? image.trim() : "https://via.placeholder.com/500?text=Food+Service"
        });

        res.status(201).json({ message: "Thêm thành công", data: newFood });
    } catch (err) {
        res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }
});

// ================= ✏️ CẬP NHẬT (UPDATE) =================
router.put("/:id", async (req, res) => {
    try {
        const { name, image, description } = req.body;
        let updateData = {};

        if (name) updateData.name = name.trim();
        if (description) updateData.description = description;
        if (image !== undefined) updateData.image = image.trim();

        const updatedFood = await Food.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedFood) return res.status(404).json({ message: "Không tìm thấy món" });
        res.json({ message: "Cập nhật thành công", data: updatedFood });
    } catch (err) {
        res.status(400).json({ message: "Lỗi khi cập nhật" });
    }
});

// ================= ❌ XÓA (DELETE) =================
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Food.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy món" });
        res.json({ message: "Đã xóa thành công" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;