const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// ✅ Sử dụng đúng tên middleware
const { requireAuth } = require("../middlewares/auth.middleware");

// 🟢 REGISTER
router.post("/register", async (req, res) => {
    try {
        const userData = { ...req.body, role: "USER" }; 
        const user = await userController.register(userData);
        res.status(201).json({
            message: "Đăng ký thành công",
            user: { id: user._id, username: user.username, role: user.role }
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 🔐 LOGIN (Đoạn này đã được sửa để Redirect thông minh)
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await userController.login(username, password);

        if (!result || !result.token) {
            return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
        }

        res.cookie("TOKEN_HOTEL", result.token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            secure: false 
        });

        // 🔥 LOGIC REDIRECT DỰA TRÊN ROLE:
        if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
            
            // Nếu là RECEPTIONIST hoặc ADMIN -> Vào thẳng trang quản lý
            if (result.user.role === "RECEPTIONIST" || result.user.role === "ADMIN") {
                return res.redirect("/manage/bookings"); 
            }
            
            // Khách thường -> Về trang chủ
            return res.redirect("/");
        }
        
        res.json({ message: "Đăng nhập thành công", role: result.user.role, token: result.token });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Lỗi hệ thống khi đăng nhập" });
    }
});

// 👤 GET ME
router.get("/me", requireAuth, (req, res) => {
    res.json(req.user);
});

// 🚪 LOGOUT
router.get("/logout", (req, res) => {
    res.clearCookie("TOKEN_HOTEL");
    res.redirect("/login");
});

module.exports = router;