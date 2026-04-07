const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt'); 

// 🧠 1. Kết nối Database
require('./config/db');

// 📂 2. Models
const Room = require("./models/room.model");
const RoomType = require("./models/roomType.model");
const Booking = require("./models/booking.model"); 
const User = require("./models/user.model"); 
const Review = require("./models/review.model");
const Profile = require("./models/profile.model"); // ✅ ĐÃ THÊM MODEL PROFILE

// --- Models Dịch vụ ---
const Food = require("./models/services/food.model");
const Gym = require("./models/services/gym.model");
const Spa = require("./models/services/spa.model");
const Swim = require("./models/services/swim.model");
const Transport = require("./models/services/transport.model");
const Billiard = require("./models/services/billiard.model"); 

// 🔐 3. Middleware Bảo mật
const { checkUser, isStaff, isAdmin, requireAuth } = require("./middlewares/auth.middleware");

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
    try {
        const rooms = await Room.find().populate("roomType");
        
        // Lấy profile để Modal ở Index không bị lỗi undefined
        let profile = {};
        if (req.user) {
            profile = await Profile.findOne({ userId: req.user._id }) || {};
        }

        res.render('index', { 
            rooms, 
            user: req.user || null, 
            profile: profile, 
            title: "Hotel Manager Pro" 
        });
    } catch (err) {
        res.status(500).send("Lỗi tải trang chủ");
    }
});

// 👤 Route Profile (Dẫn về Index để mở Modal)
app.get('/profile', requireAuth, (req, res) => {
    res.redirect('/'); 
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

// 🛎️ Trang Lễ tân
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
        const stats = {
            totalRooms: await Room.countDocuments(),
            totalBookings: await Booking.countDocuments(),
            totalStaff: await User.countDocuments({ role: 'RECEPTIONIST' })
        };
        const monthlyCounts = [5, 10, 15, 20, 25, 30]; 
        res.render('admin/dashboard', { stats, bookingMonthlyData: monthlyCounts, user: req.user });
    } catch (err) {
        res.status(500).send("Lỗi hệ thống");
    }
});

// ✨ View Routes cho Dịch vụ
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
app.get('/view/billiards', async (req, res) => {
    const data = await Billiard.find();
    res.render('services/all-services', { title: "CLB Bida Giải Trí", data, user: req.user });
});

// 🔐 Auth
app.get('/login', (req, res) => res.render('login', { user: req.user || null }));
app.get('/register', (req, res) => res.render('register', { user: req.user || null }));

// ==========================================
// ⚙️ 7. API ROUTES (Xử lý dữ liệu)
// ==========================================

// 👤 API HỒ SƠ CÁ NHÂN (PROFILE) ✅ MỚI THÊM
app.use('/api/profiles', require('./routes/profile.routes'));

// 👥 API QUẢN LÝ TÀI KHOẢN (ADMIN ONLY)
app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) { res.status(500).json({ message: "Lỗi" }); }
});

app.put('/api/admin/users/:id/reset-password', isAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
        res.json({ message: "Thành công" });
    } catch (err) { res.status(500).json({ message: "Lỗi" }); }
});

app.put('/api/admin/users/:id/toggle-status', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        user.isActive = !user.isActive; 
        await user.save();
        res.json({ message: "Thành công" });
    } catch (err) { res.status(500).json({ message: "Lỗi" }); }
});

app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Thành công" });
    } catch (err) { res.status(500).json({ message: "Lỗi" }); }
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/room-types', require('./routes/roomTypes')); 
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/foods', require('./routes/foods'));
app.use('/api/gyms', require('./routes/gyms'));
app.use('/api/spas', require('./routes/spas'));
app.use('/api/swims', require('./routes/swims'));
app.use('/api/transports', require('./routes/transports'));
app.use('/api/billiards', require('./routes/billiards'));

// 🛑 8. 404
app.use((req, res) => {
    res.status(404).render('404', { user: req.user || null }); 
});

// ==========================================
// 🚀 9. KHỞI CHẠY
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n✅ HOTEL SYSTEM READY!`);
    console.log(`🚀 Link dự án: http://localhost:${PORT}`);
});