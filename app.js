const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');

// 🧠 1. Kết nối Database
require('./config/db');

// 📂 2. Models
const Room = require("./models/room.model");
const RoomType = require("./models/roomType.model");
const Booking = require("./models/booking.model"); 

// 🔐 3. Middleware
const { checkUser, isStaff } = require("./middlewares/auth.middleware");

// 🎨 4. Cấu hình View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 📦 5. Middleware Hệ thống
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(checkUser);

// ==========================================
// 🌐 6. VIEW ROUTES (Trang hiển thị .ejs)
// ==========================================

// 🏠 Trang chủ
app.get('/', async (req, res) => {
    const rooms = await Room.find().populate("roomType");
    res.render('index', { rooms, user: req.user || null });
});

// 🔐 Login/Register
app.get('/login', (req, res) => res.render('login', { user: req.user || null }));
app.get('/register', (req, res) => res.render('register', { user: req.user || null }));

// 🏨 Danh sách phòng
app.get('/rooms', async (req, res) => {
    const rooms = await Room.find().populate("roomType");
    const roomTypes = await RoomType.find();
    res.render('rooms/room', { rooms, roomTypes, user: req.user || null });
});

// 🧾 Route xem Loại Phòng (Giao diện)
app.get('/room-types', async (req, res) => {
    const roomTypes = await RoomType.find();
    res.render('roomTypes/roomtype', { roomTypes, user: req.user || null });
});

// 🛎️ TRANG QUẢN LÝ (Dành cho Lễ tân)
app.get('/manage/bookings', isStaff, async (req, res) => {
    const bookings = await Booking.find()
        .populate("user")
        .populate({ path: 'room', populate: { path: 'roomType' } });
    res.render('receptionist/manage', { bookings, user: req.user });
});

// ==========================================
// ⚙️ 7. API ROUTES (Xử lý dữ liệu)
// ==========================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));

// ✅ THÊM DÒNG NÀY: Để hết lỗi Cannot GET /api/room-types
app.use('/api/room-types', require('./routes/roomTypes')); 

// ==========================================
// 🚀 8. KHỞI CHẠY
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n✅ HOTEL SYSTEM READY!`);
    console.log(`🚀 Link: http://localhost:${PORT}`);
    console.log(`📅 Nhóm: Long, Trường, Thành, Đạt, Vỹ, Việt, Nhiên\n`);
});