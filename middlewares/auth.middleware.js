const userController = require("../controllers/user.controller");

// 👁️ 1. Check User (Để hiện tên User trên Navbar ở mọi trang)
const checkUser = async (req, res, next) => {
    try {
        const token = req.cookies?.TOKEN_HOTEL;
        if (!token) {
            req.user = null; 
            res.locals.user = null;
            return next();
        }
        // Gọi controller để giải mã token và lấy user từ DB
        const user = await userController.getUserByToken(token);
        
        req.user = user || null;
        res.locals.user = user || null; // res.locals giúp file .ejs đọc được biến user
        next();
    } catch (err) {
        req.user = null; 
        res.locals.user = null;
        next();
    }
};

// 🔐 2. Yêu cầu Đăng nhập (Dành cho trang cá nhân, đặt phòng)
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.redirect("/login");
    }
    next();
};

// 🛎️ 3. Quyền Nhân viên (Dành cho Lễ tân)
// Chỉ cho phép RECEPTIONIST và ADMIN vào trang /manage/bookings
const isStaff = (req, res, next) => {
    if (req.user && (req.user.role === "RECEPTIONIST" || req.user.role === "ADMIN")) {
        return next();
    }
    res.status(403).send("<h1 style='color:red; text-align:center; margin-top:50px;'>403 - Bạn không có quyền truy cập khu vực Nhân viên!</h1>");
};

// 👑 4. Quyền Tối cao (Dành riêng cho ADMIN)
// Chỉ duy nhất ADMIN mới vào được trang /admin/dashboard
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "ADMIN") {
        return next();
    }
    res.status(403).send("<h1 style='color:red; text-align:center; margin-top:50px;'>403 - Khu vực cấm: Chỉ dành cho Quản trị viên!</h1>");
};

module.exports = { checkUser, requireAuth, isStaff, isAdmin };