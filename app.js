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
const User = require("./models/user.model"); 
const Review = require("./models/review.model");

// --- Models Dịch vụ (Nằm trong folder models/services) ---
const Food = require("./models/services/food.model");
const Gym = require("./models/services/gym.model");
const Spa = require("./models/services/spa.model");
const Swim = require("./models/services/swim.model");
const Transport = require("./models/services/transport.model");

// 🔐 3. Middleware Bảo mật
const { checkUser, isStaff, isAdmin } = require("./middlewares/auth.middleware");

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
// 🌐 6. VIEW ROUTES (Trang hiển thị giao diện)
// ==========================================

// 🏠 Trang chủ
app.get('/', async (req, res) => {
    const rooms = await Room.find().populate("roomType");
    res.render('index', { rooms, user: req.user || null });
});

// 🏨 Danh sách phòng
app.get('/rooms', async (req, res) => {
    const rooms = await Room.find().populate("roomType");
    const roomTypes = await RoomType.find();
    res.render('rooms/room', { rooms, roomTypes, user: req.user || null });
});

// ✅ Danh sách loại phòng
app.get('/room-types', async (req, res) => {
    try {
        const roomTypes = await RoomType.find();
        res.render('roomTypes/roomtype', { roomTypes, user: req.user || null });
    } catch (err) {
        res.status(500).render('404', { user: req.user || null });
    }
});

// 📖 Trang Đặt phòng
app.get('/booking/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate("roomType");
        if (!room) return res.status(404).render('404', { user: req.user || null });
        res.render('booking', { room, user: req.user || null });
    } catch (err) {
        res.status(500).render('404', { user: req.user || null });
    }
});

// 🛎️ Trang Lễ tân (Hiện sơ đồ phòng & Danh sách đặt)
app.get('/manage/bookings', isStaff, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user")
            .populate({ path: 'room', populate: { path: 'roomType' } });
        const rooms = await Room.find().populate("roomType");
        res.render('receptionist/manage', { bookings, rooms, user: req.user });
    } catch (err) {
        res.status(500).send("Lỗi tải trang quản lý");
    }
});

// 👑 Trang Admin
app.get('/admin/dashboard', isAdmin, async (req, res) => {
    try {
        // 1. Thống kê cơ bản
        const stats = {
            totalRooms: await Room.countDocuments(),
            totalBookings: await Booking.countDocuments(),
            totalStaff: await User.countDocuments({ role: 'RECEPTIONIST' })
        };

        // 2. Thống kê số lượng đơn hàng theo tháng (Ví dụ cho 6 tháng đầu năm 2026)
        // Logic: Tìm các đơn hàng trong tháng X năm 2026
        const monthlyCounts = [];
        for (let m = 0; m < 6; m++) {
            const start = new Date(2026, m, 1);
            const end = new Date(2026, m + 1, 0);
            const count = await Booking.countDocuments({
                createdAt: { $gte: start, $lte: end }
            });
            monthlyCounts.push(count);
        }

        res.render('admin/dashboard', { 
            stats, 
            bookingMonthlyData: monthlyCounts, // Mảng số lượng đơn: [5, 12, 8, ...]
            user: req.user 
        });
    } catch (err) {
        res.status(500).send("Lỗi hệ thống");
    }
});

// Thêm vào phần View Routes trong app.js
app.get('/view/foods', async (req, res) => {
    const data = await Food.find();
    res.render('services/all-services', { title: "Thực Đơn Đồ Ăn", data, user: req.user });
});

app.get('/view/gyms', async (req, res) => {
    const data = await Gym.find();
    res.render('services/all-services', { title: "Phòng Tập Gym", data, user: req.user });
});

app.get('/view/spas', async (req, res) => {
    const data = await Spa.find();
    res.render('services/all-services', { title: "Dịch Vụ Spa", data, user: req.user });
});

app.get('/view/swims', async (req, res) => {
    const data = await Swim.find();
    res.render('services/all-services', { title: "Hồ Bơi", data, user: req.user });
});

app.get('/view/transports', async (req, res) => {
    const data = await Transport.find();
    res.render('services/all-services', { title: "Vận Chuyển", data, user: req.user });
});
// 🔐 Auth
app.get('/login', (req, res) => res.render('login', { user: req.user || null }));
app.get('/register', (req, res) => res.render('register', { user: req.user || null }));

// ==========================================
// ⚙️ 7. API ROUTES (Xử lý dữ liệu)
// ==========================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/room-types', require('./routes/roomTypes')); 
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/rooms', require('./routes/rooms'));

// ✅ API Dịch vụ mới (Hướng vào folder routes)
app.use('/api/foods', require('./routes/foods'));
app.use('/api/gyms', require('./routes/gyms'));
app.use('/api/spas', require('./routes/spas'));
app.use('/api/swims', require('./routes/swims'));
app.use('/api/transports', require('./routes/transports'));

// 🛑 8. 404 (Luôn để cuối cùng)
app.use((req, res) => {
    res.status(404).render('404', { user: req.user || null }); 
});

// ==========================================
// 🚀 9. KHỞI CHẠY
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n✅ HOTEL SYSTEM READY!`);
    console.log(`🚀 Thư mục models/services đã sẵn sàng.`);
    console.log(`🚀 Link dự án: http://localhost:${PORT}`);
    console.log(`📅 Nhóm: Long, Trường, Thành, Đạt, Vỹ, Việt, Nhiên\n`);
});