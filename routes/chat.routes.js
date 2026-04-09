const express = require('express');
const router = express.Router();
const Chat = require('../models/chat.model');
const { requireAuth } = require('../middlewares/auth.middleware');

/**
 * 📜 1. LẤY LỊCH SỬ CHAT TOÀN BỘ (Fix lỗi next is not a function)
 * Logic: Tìm mọi tin nhắn chéo giữa A và B
 * Link: GET /api/chats/history/:user1Id/:user2Id
 */
router.get('/history/:user1Id/:user2Id', requireAuth, async (req, res) => {
    try {
        const { user1Id, user2Id } = req.params;

        if (!user1Id || !user2Id) {
            return res.status(400).json({ message: "Thiếu ID người dùng" });
        }

        // Truy vấn Database: (A gửi B) HOẶC (B gửi A)
        const history = await Chat.find({
            $or: [
                { sender: user1Id, receiver: user2Id },
                { sender: user2Id, receiver: user1Id }
            ]
        })
        .populate('sender', 'username name avatar')   // Populate thủ công ở đây cho chắc
        .populate('receiver', 'username name avatar') // Tránh dùng pre-find bị lỗi next
        .sort({ createdAt: 1 }); // Tin cũ trên, tin mới dưới chuẩn timeline

        res.json(history);
    } catch (err) {
        console.error("❌ Lỗi lấy lịch sử chat:", err.message);
        res.status(500).json({ message: "Không thể tải lịch sử" });
    }
});

/**
 * 💾 2. API LƯU TIN NHẮN (Dành cho trường hợp gửi qua HTTP thay vì Socket)
 */
router.post('/save', requireAuth, async (req, res) => {
    try {
        const { receiverId, message } = req.body;
        const senderId = req.user._id;

        const newChat = await Chat.create({
            sender: senderId,
            receiver: receiverId,
            message: message
        });

        // Populate lại ngay lập tức để trả về dữ liệu có tên người gửi
        const populatedChat = await Chat.findById(newChat._id)
            .populate('sender', 'username name avatar')
            .populate('receiver', 'username name avatar');
            
        res.status(201).json(populatedChat);
    } catch (err) {
        console.error("❌ Lỗi lưu tin nhắn:", err.message);
        res.status(500).json({ message: "Không thể lưu tin nhắn" });
    }
});

/**
 * 🧹 3. LẤY DANH SÁCH LIÊN HỆ (Cho Lễ tân thấy ai đã nhắn tin với mình)
 */
router.get('/contacts', requireAuth, async (req, res) => {
    try {
        const myId = String(req.user._id);

        const chats = await Chat.find({
            $or: [{ sender: myId }, { receiver: myId }]
        })
        .populate('sender', 'username name avatar')
        .populate('receiver', 'username name avatar')
        .sort({ createdAt: -1 });

        const contacts = [];
        const addedIds = new Set();

        chats.forEach(c => {
            // Nếu người gửi là mình, thì đối phương là receiver. Ngược lại đối phương là sender.
            const otherUser = String(c.sender?._id || c.sender) === myId ? c.receiver : c.sender;
            
            if (otherUser && otherUser._id && !addedIds.has(String(otherUser._id))) {
                addedIds.add(String(otherUser._id));
                contacts.push(otherUser);
            }
        });

        res.json(contacts);
    } catch (err) {
        console.error("❌ Lỗi tải liên hệ:", err.message);
        res.status(500).json({ message: "Lỗi danh sách liên hệ" });
    }
});

/**
 * 🗑️ 4. XÓA TIN NHẮN
 */
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: "Không tìm thấy" });

        // Bảo mật: Chỉ người gửi hoặc ADMIN mới được xóa
        if (String(chat.sender) === String(req.user._id) || req.user.role === 'ADMIN') {
            await Chat.findByIdAndDelete(req.params.id);
            res.json({ message: "Đã xóa tin nhắn" });
        } else {
            res.status(403).json({ message: "Không có quyền xóa" });
        }
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi xóa" });
    }
});

module.exports = router;