const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');

// 🧠 1. Kết nối Database
require('./config/db');

// 📂 2. Models (Đảm bảo đường dẫn file model chính xác)
const Room = require("./models/room.model");
const RoomType = require("./models/roomType.model");
const Booking = require("./models/booking.model"); 
const User = require("./models/user.model"); 

// 🔐 3. Middleware (Lấy các hàm bảo mật)
const { checkUser, isStaff, isAdmin } = require("./middlewares/auth.middleware");

// 🎨 4. Cấu hình View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 📦 5. Middleware Hệ thống (THỨ TỰ NÀY LÀ BẮT BUỘC)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ Phải nằm trước checkUser
app.use(express.static(path.join(__dirname, 'public')));
app.use(checkUser);      // ✅ Phải nằm trước các Route bên dưới

// ==========================================
// 🌐 6. VIEW ROUTES (Trang hiển thị .ejs)
// ==========================================

// 👑 TRANG ADMIN DASHBOARD (Đưa lên đầu để ưu tiên cao nhất)
app.get('/admin/dashboard', isAdmin, async (req, res) => {
    console.log(">>> [Server] Đang truy cập Admin Dashboard..."); 
    try {
        // Lấy thống kê từ Database
        const stats = {
            totalRooms: await Room.countDocuments() || 0,
            totalBookings: await Booking.countDocuments() || 0,
            totalRoomTypes: await RoomType.countDocuments() || 0,
            totalStaff: await User.countDocuments({ role: 'RECEPTIONIST' }) || 0,
            totalUsers: await User.countDocuments({ role: 'USER' }) || 0
        };
        
        console.log(">>> [Server] Thống kê lấy được: ", stats);
        
        // Render file: views/admin/dashboard.ejs
        res.render('admin/dashboard', { stats, user: req.user });
    } catch (err) {
        console.error("❌ Lỗi Admin Dashboard:", err);
        res.status(500).send("Lỗi hệ thống khi tải dữ liệu thống kê");
    }
});

// 🏠 Trang chủ
app.get('/', async (req, res) => {
    try {
        const rooms = await Room.find().populate("roomType");
        res.render('index', { rooms, user: req.user || null });
    } catch (err) {
        res.render('index', { rooms: [], user: req.user || null });
    }
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

// 🧾 Xem Loại Phòng
app.get('/room-types', async (req, res) => {
    const roomTypes = await RoomType.find();
    res.render('roomTypes/roomtype', { roomTypes, user: req.user || null });
});

// 🛎️ TRANG QUẢN LÝ (Lễ tân & Admin đều vào được)
app.get('/manage/bookings', isStaff, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user")
            .populate({ path: 'room', populate: { path: 'roomType' } });
        res.render('receptionist/manage', { bookings, user: req.user });
    } catch (err) {
        res.status(500).send("Lỗi tải danh sách đặt phòng");
    }
});

// ==========================================
// ⚙️ 7. API ROUTES (Xử lý logic dữ liệu)
// ==========================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/room-types', require('./routes/roomTypes')); 
app.use('/api/reviews', require('./routes/review.routes'));

// 🛑 8. XỬ LÝ LỖI 404 (PHẢI ĐỂ CUỐI CÙNG)
app.use((req, res) => {
    console.log(`--- [404] Không tìm thấy link: ${req.originalUrl} ---`);
    res.status(404).render('404', { user: req.user || null }); 
});

// ==========================================
// 🚀 9. KHỞI CHẠY SERVER
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`✅ HOTEL SYSTEM READY!`);
    console.log(`🚀 Admin: http://localhost:${PORT}/admin/dashboard`);
    console.log(`🚀 Home:  http://localhost:${PORT}`);
    console.log(`📅 Nhóm: Long, Trường, Thành, Đạt, Vỹ, Việt, Nhiên`);
    console.log(`========================================\n`);
});