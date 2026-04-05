const userController = require("../controllers/user.controller");

// 👁️ 1. Check User (Luôn chạy để hiện Navbar)
const checkUser = async (req, res, next) => {
    try {
        const token = req.cookies?.TOKEN_HOTEL;
        if (!token) {
            req.user = null; res.locals.user = null;
            return next();
        }
        const user = await userController.getUserByToken(token);
        req.user = user || null;
        res.locals.user = user || null;
        next();
    } catch (err) {
        req.user = null; res.locals.user = null;
        next();
    }
};

// 🔐 2. Yêu cầu Đăng nhập (Bất kể Role nào)
const requireAuth = (req, res, next) => {
    if (!req.user) return res.redirect("/login");
    next();
};

// 🛎️ 3. Quyền Nhân viên (Dành cho Lễ tân & Admin)
const isStaff = (req, res, next) => {
    if (req.user && (req.user.role === "RECEPTIONIST" || req.user.role === "ADMIN")) {
        return next();
    }
    res.status(403).send("<h1>403 - Lỗi: Bạn không có quyền Nhân viên</h1>");
};

// 👑 4. Quyền Tối cao (Chỉ duy nhất Admin)
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "ADMIN") {
        return next();
    }
    res.status(403).send("<h1>403 - Lỗi: Chỉ Quản trị viên mới được vào đây</h1>");
};

module.exports = { checkUser, requireAuth, isStaff, isAdmin };