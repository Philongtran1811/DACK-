const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');

// 🧠 DB
require('./config/db');

// 📂 Models
const Room = require("./models/room.model");
const RoomType = require("./models/roomType.model");

// 🔐 Middleware
const { checkUser } = require("./middlewares/auth.middleware");

// 🎨 View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ==========================================
// 📦 Middleware
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// log request
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

// check login
app.use(checkUser);

// ==========================================
// 🌐 VIEW ROUTES
// ==========================================

// 🏠 Trang chủ
app.get('/', async (req, res) => {
    try {
        const rooms = await Room.find().populate("roomType");

        res.render('index', { 
            rooms,
            bookings: [] // 🔥 tránh lỗi index.ejs
        });

    } catch (err) {
        console.error(err);
        res.render('index', { rooms: [], bookings: [] });
    }
});

// 🔐 Auth
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));


// ================= ROOM =================
app.get('/rooms', async (req, res) => {
    try {
        const rooms = await Room.find().populate("roomType");
        const roomTypes = await RoomType.find();

        res.render('rooms/room', { rooms, roomTypes });

    } catch (err) {
        console.log(err);
        res.render('rooms/room', { rooms: [], roomTypes: [] });
    }
});


// ================= ROOM TYPE =================
app.get('/roomTypes', async (req, res) => {
    try {
        const roomTypes = await RoomType.find();

        res.render('roomTypes/roomtype', { roomTypes });

    } catch (err) {
        console.log(err);
        res.render('roomTypes/roomtype', { roomTypes: [] });
    }
});


// ==========================================
// ⚙️ API ROUTES
// ==========================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/room-types', require('./routes/roomTypes'));


// ==========================================
// 🛑 ERROR
// ==========================================
app.use((req, res) => {
    res.status(404).send("Không tìm thấy trang");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Lỗi server",
        error: err.message
    });
});


// ==========================================
// 🚀 RUN
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 http://localhost:${PORT}`);
});