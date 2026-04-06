const express = require('express');
const router = express.Router();
const Billiard = require('../models/services/billiard.model');

// Lấy danh sách bida
router.get('/', async (req, res) => {
    const data = await Billiard.find();
    res.json(data);
});

// Thêm mới
router.post('/', async (req, res) => {
    const newItem = await Billiard.create(req.body);
    res.json(newItem);
});

// Xóa
router.delete('/:id', async (req, res) => {
    await Billiard.findByIdAndDelete(req.params.id);
    res.json({ message: "Xóa thành công" });
});

module.exports = router;