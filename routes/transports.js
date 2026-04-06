const express = require("express");
const router = express.Router();
const Transport = require("../models/services/transport.model");

// Hàm lấy ảnh xe cộ "xịn" tự động (giống bộ tứ trước đó)
const getTransportImage = (name, currentImage) => {
    if (currentImage && currentImage.trim() !== "") return currentImage.trim();
    
    // Nếu trống, tự lấy ảnh từ Unsplash (vd: Luxury car, Airport transfer, Taxi...)
    const query = encodeURIComponent(name || "luxury transportation car");
    return `https://source.unsplash.com/featured/?${query},car,travel,vehicle`;
};

// ================= 🔍 1. LẤY DANH SÁCH (READ) =================
router.get("/", async (req, res) => {
    try {
        // Sắp xếp theo ngày tạo mới nhất
        const services = await Transport.find().sort({ createdAt: -1 });
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

// ================= ➕ 2. THÊM DỊCH VỤ (CREATE) =================
router.post("/", async (req, res) => {
    try {
        const { name, image, description } = req.body;

        // Chỉ bắt buộc nhập tên dịch vụ vận chuyển
        if (!name) {
            return res.status(400).json({ message: "Vui lòng nhập tên dịch vụ vận chuyển" });
        }

        const newTransport = await Transport.create({
            name: name.trim(),
            description: description || "Dịch vụ đưa đón chuyên nghiệp và đẳng cấp.",
            image: getTransportImage(name, image)
        });

        res.status(201).json({ message: "Thêm dịch vụ vận chuyển thành công", data: newTransport });
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
            updateData.image = getTransportImage(name || "car", image);
        }

        const updated = await Transport.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updated) return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
        res.json({ message: "Cập nhật thành công", data: updated });
    } catch (err) {
        res.status(400).json({ message: "Lỗi khi cập nhật" });
    }
});

// ================= ❌ 4. XÓA (DELETE) =================
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Transport.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
        res.json({ message: "Đã xóa dịch vụ vận chuyển thành công" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;