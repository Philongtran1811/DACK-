const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt'); 
const http = require('http'); 
const { Server } = require('socket.io'); 

const server = http.createServer(app); 
const io = new Server(server); 

// 🧠 1. Kết nối Database
require('./config/db');

// 📂 2. Models
const Room = require("./models/room.model");
const RoomType = require("./models/roomType.model");
const Booking = require("./models/booking.model"); 
const User = require("./models/user.model"); 
const Review = require("./models/review.model");
const Profile = require("./models/profile.model"); 
const Chat = require("./models/chat.model"); 

// Models Dịch vụ
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

// 📦 5. Middleware Hệ thống (Sửa lại thứ tự để bóc tách Token chuẩn)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Phải chạy cái này trước...
app.use(express.static(path.join(__dirname, 'public')));

// 🛑 PHẢI ĐẶT checkUser SAU cookieParser để đọc được Cookie Token và gán vào req.user
app.use(checkUser); 

// =========================================================
// 💬 CHAT REALTIME LOGIC (FULL FIXED)
// =========================================================
io.on('connection', (socket) => {
    socket.on('join-private-room', (data) => {
        if (data.myId) {
            socket.join(String(data.myId)); 
            console.log(`📡 User online: ${data.myId}`);
        }
    });

    socket.on('send-private-message', async (data) => {
        try {
            if (!data.senderId || !data.receiverId || !data.message) return;

            const newChat = await Chat.create({
                sender: data.senderId,
                receiver: data.receiverId,
                message: data.message
            });

            const populatedChat = await Chat.findById(newChat._id)
                .populate('sender', 'username name avatar')
                .populate('receiver', 'username name avatar');

            io.to(String(data.receiverId)).emit('receive-private-message', populatedChat);
            io.to(String(data.senderId)).emit('receive-private-message', populatedChat);

        } catch (err) {
            console.error("❌ Lỗi Chat Socket:", err.message);
        }
    });

    socket.on('disconnect', () => { console.log('❌ Một người dùng thoát kết nối.'); });
});

// ==========================================
// 🌐 6. VIEW ROUTES
// ==========================================

app.get('/', async (req, res) => {
    try {
        const rooms = await Room.find().populate("roomType");
        let profile = {};
        if (req.user) {
            profile = await Profile.findOne({ userId: req.user._id }) || {};
        }
        res.render('index', { rooms, user: req.user || null, profile: profile, title: "Hotel Manager Pro" });
    } catch (err) { res.status(500).send("Lỗi tải trang chủ"); }
});

app.get('/rooms', async (req, res) => {
    try {
        const rooms = await Room.find().populate("roomType");
        const roomTypes = await RoomType.find();
        res.render('rooms/room', { rooms, roomTypes, user: req.user || null });
    } catch (err) { res.status(500).send("Lỗi tải phòng"); }
});

app.get('/room-types', async (req, res) => {
    try {
        const roomTypes = await RoomType.find();
        res.render('roomTypes/roomtype', { roomTypes, user: req.user || null });
    } catch (err) { res.status(500).send("Lỗi loại phòng"); }
});

app.get('/booking/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate("roomType");
        res.render('booking', { room, user: req.user || null });
    } catch (err) { res.status(404).render('404', { user: req.user || null }); }
});

app.get('/manage/bookings', isStaff, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user")
            .populate({ path: 'room', populate: { path: 'roomType' } });
        const rooms = await Room.find().populate("roomType");
        res.render('receptionist/manage', { bookings, rooms, user: req.user });
    } catch (err) { res.status(500).send("Lỗi tải trang quản lý"); }
});

// ✅ ADMIN DASHBOARD - ĐÃ FIX LOGIC THỐNG KÊ DOANH THU & BOOKING THẬT
app.get('/admin/dashboard', isAdmin, async (req, res) => {
    try {
        // Tính doanh thu thật (không tính đơn đã hủy)
        const allBookings = await Booking.find({ status: { $ne: "CANCELLED" } });
        const totalRevenue = allBookings.reduce((sum, bk) => sum + (bk.totalPrice || 0), 0);

        // Doanh thu tháng hiện tại
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyBookings = await Booking.find({
            status: { $ne: "CANCELLED" },
            createdAt: { $gte: startOfMonth }
        });
        const monthlyRevenue = monthlyBookings.reduce((sum, bk) => sum + (bk.totalPrice || 0), 0);

        // Lấy data 12 tháng thực tế
        let bookingMonthlyData = Array(12).fill(0);
        const currentYearBookings = await Booking.find({
            status: { $ne: "CANCELLED" },
            createdAt: { 
                $gte: new Date(now.getFullYear(), 0, 1), 
                $lte: new Date(now.getFullYear(), 11, 31) 
            }
        });
        currentYearBookings.forEach(bk => {
            const monthIndex = new Date(bk.createdAt).getMonth();
            bookingMonthlyData[monthIndex]++;
        });

        const stats = {
            totalRooms: await Room.countDocuments(),
            totalBookings: allBookings.length,
            totalStaff: await User.countDocuments({ role: 'RECEPTIONIST' }),
            totalRevenue: totalRevenue,
            monthlyRevenue: monthlyRevenue
        };

        res.render('admin/dashboard', { 
            stats, 
            user: req.user, 
            bookingMonthlyData,
            title: "Quản trị hệ thống" 
        });
    } catch (err) { 
        console.error(err);
        res.status(500).send("Lỗi hệ thống Admin"); 
    }
});

// Dịch vụ
app.get('/view/foods', async (req, res) => { const data = await Food.find(); res.render('services/all-services', { title: "Thực Đơn Đồ Ăn", data, user: req.user }); });
app.get('/view/gyms', async (req, res) => { const data = await Gym.find(); res.render('services/all-services', { title: "Phòng Tập Gym", data, user: req.user }); });
app.get('/view/spas', async (req, res) => { const data = await Spa.find(); res.render('services/all-services', { title: "Dịch Vụ Spa", data, user: req.user }); });
app.get('/view/swims', async (req, res) => { const data = await Swim.find(); res.render('services/all-services', { title: "Hồ Bơi", data, user: req.user }); });
app.get('/view/transports', async (req, res) => { const data = await Transport.find(); res.render('services/all-services', { title: "Vận Chuyển", data, user: req.user }); });
app.get('/view/billiards', async (req, res) => { const data = await Billiard.find(); res.render('services/all-services', { title: "CLB Bida Giải Trí", data, user: req.user }); });

app.get('/login', (req, res) => res.render('login', { user: req.user || null }));
app.get('/register', (req, res) => res.render('register', { user: req.user || null }));

// ==========================================
// ⚙️ 7. API ROUTES
// ==========================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profiles', require('./routes/profile.routes'));
app.use('/api/chats', require('./routes/chat.routes')); 
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/admin', require('./routes/admin.routes')); 
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/room-types', require('./routes/roomTypes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/foods', require('./routes/foods'));
app.use('/api/gyms', require('./routes/gyms'));
app.use('/api/spas', require('./routes/spas'));
app.use('/api/swims', require('./routes/swims'));
app.use('/api/transports', require('./routes/transports'));
app.use('/api/billiards', require('./routes/billiards'));

app.use((req, res) => { res.status(404).render('404', { user: req.user || null }); });

// ==========================================
// 🚀 8. KHỞI CHẠY
// ==========================================
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\n✅ HOTEL SYSTEM READY!`);
    console.log(`🚀 Chat System: Active (Direct ID Mode)`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
});