const userController = require("../controllers/user.controller");

// 👁️ Check user (Dùng cho toàn bộ app để hiện Navbar và lấy req.user)
const checkUser = async (req, res, next) => {
    try {
        const token = req.cookies?.TOKEN_HOTEL;

        if (!token) {
            req.user = null;
            res.locals.user = null;
            return next();
        }

        const user = await userController.getUserByToken(token);

        if (user) {
            req.user = user;        // ✅ PHẢI CÓ DÒNG NÀY để Router đặt phòng lấy được ID
            res.locals.user = user; // Để EJS hiển thị Navbar
        } else {
            req.user = null;
            res.locals.user = null;
        }

        next();
    } catch (err) {
        req.user = null;
        res.locals.user = null;
        next();
    }
};

// 🔐 Check login (Chỉ dùng cho các Route bắt buộc phải đăng nhập mới được vào)
const checkLogin = async (req, res, next) => {
    try {
        const token = req.cookies?.TOKEN_HOTEL;

        if (!token) {
            return res.redirect("/login");
        }

        const user = await userController.getUserByToken(token);

        if (!user) {
            return res.redirect("/login");
        }

        req.user = user;
        res.locals.user = user;
        next();
    } catch (err) {
        res.redirect("/login");
    }
};

module.exports = {
    checkUser,
    checkLogin,
    requireAuth: checkLogin
};