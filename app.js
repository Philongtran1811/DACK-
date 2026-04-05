const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');

// 🧠 1. Kết nối Database (Đảm bảo file db.js của bạn đã chạy)
require('./config/db');

// 📂 2. Models
const Room = require("./models/room.model");
const RoomType = require("./models/roomType.model");
const Booking = require("./models/booking.model"); 

// 🔐 3. Middleware bảo mật
const { checkUser } = require("./middlewares/auth.middleware");

// 🎨 4. Cấu hình View engine (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ==========================================
// 📦 5. Middleware Hệ thống
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 📝 Log Request: Giúp bạn theo dõi mọi thao tác trên Terminal
app.use((req, res, next) => {
    console.log(`-- [${req.method}] ${req.url}`);
    next();
});

// 🛡️ Chạy checkUser TRƯỚC các Routes để mọi trang đều có biến 'user'
app.use(checkUser);

// ==========================================
// 🌐 6. VIEW ROUTES (Các trang hiển thị giao diện)
// ==========================================

// 🏠 Trang chủ
app.get('/', async (req, res) => {
    try {
        const rooms = await Room.find().populate("roomType");
        res.render('index', { 
            rooms, 
            bookings: [],
            user: req.user || null // Truyền user để hiển thị "Xin chào..."
        });
    } catch (err) {
        console.error("Lỗi trang chủ:", err);
        res.render('index', { rooms: [], bookings: [], user: null });
    }
});

// 🔐 Đăng nhập & Đăng ký
app.get('/login', (req, res) => res.render('login', { user: req.user || null }));
app.get('/register', (req, res) => res.render('register', { user: req.user || null }));

// 🏨 Danh sách tất cả phòng
app.get('/rooms', async (req, res) => {
    try {
        const rooms = await Room.find().populate("roomType");
        const roomTypes = await RoomType.find();
        res.render('rooms/room', { rooms, roomTypes, user: req.user || null });
    } catch (err) {
        res.render('rooms/room', { rooms: [], roomTypes: [], user: null });
    }
});

// 📑 Trang chi tiết đặt phòng (Khi khách bấm vào 1 phòng cụ thể)
app.get('/booking/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate("roomType");
        if (!room) return res.status(404).send("Không tìm thấy phòng này trong hệ thống");
        
        res.render('booking', { 
            room, 
            user: req.user || null 
        });
    } catch (err) {
        console.error("Lỗi trang đặt phòng:", err);
        res.status(500).send("Lỗi server khi tải trang đặt phòng");
    }
});

// 🧾 Danh sách loại phòng
app.get('/roomTypes', async (req, res) => {
    try {
        const roomTypes = await RoomType.find();
        res.render('roomTypes/roomtype', { roomTypes, user: req.user || null });
    } catch (err) {
        res.render('roomTypes/roomtype', { roomTypes: [], user: null });
    }
});

// Thêm vào dưới route /roomTypes (Khoảng dòng 95)
app.get('/my-history', async (req, res) => {
    if (!req.user) return res.redirect('/login');
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate({
                path: 'room',
                populate: { path: 'roomType' }
            })
            .sort({ createdAt: -1 });
        res.render('profile/history', { bookings, user: req.user });
    } catch (err) {
        res.status(500).send("Lỗi tải lịch sử");
    }
});
// ==========================================
// ⚙️ 7. API ROUTES (Xử lý dữ liệu JSON)
// ==========================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/room-types', require('./routes/roomTypes'));

// 🔥 API Đặt phòng chính (Xử lý nút "Đặt phòng" từ giao diện)
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
// ==========================================
// 🛑 8. XỬ LÝ LỖI (Error Handling)
// ==========================================

// Lỗi 404: Không tìm thấy trang
app.use((req, res) => {
    res.status(404).send("Rất tiếc, trang bạn tìm kiếm không tồn tại!");
});

// Lỗi 500: Lỗi hệ thống (Crash code)
app.use((err, req, res, next) => {
    // 🔴 DÒNG NÀY SẼ HIỆN LỖI ĐỎ Ở TERMINAL - COPY DÒNG NÀY NẾU VẪN LỖI
    console.error(">>>>>>>>>> CRITICAL ERROR <<<<<<<<<<");
    console.error(err.stack); 
    console.error(">>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<");

    res.status(500).json({
        message: "Hệ thống gặp sự cố kỹ thuật",
        error: err.message
    });
});

// ==========================================
// 🚀 9. KHỞI CHẠY
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n✅ HOTEL MANAGER SYSTEM IS READY!`);
    console.log(`🚀 Link: http://localhost:${PORT}`);
    console.log(`📅 Nhóm: Long, Trường, Thành, Đạt, Vỹ, Việt, Nhiên\n`);
});