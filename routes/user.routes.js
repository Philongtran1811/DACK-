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

// 🔐 LOGIN (Đã nâng cấp logic phân quyền Admin & Staff)
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await userController.login(username, password);

        if (!result || !result.token) {
            return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
        }

        // 🍪 Lưu Token vào Cookie
        res.cookie("TOKEN_HOTEL", result.token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            secure: false 
        });

        const userRole = result.user.role;

        // 🚀 XỬ LÝ REDIRECT CHO FORM TRUYỀN THỐNG
        if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
            if (userRole === "ADMIN") {
                return res.redirect("/admin/dashboard"); // Admin vào Dashboard tổng
            }
            if (userRole === "RECEPTIONIST") {
                return res.redirect("/manage/bookings"); // Lễ tân vào quản lý đơn
            }
            return res.redirect("/"); // Khách thường
        }
        
        // ⚡ TRẢ VỀ JSON CHO FETCH API (Sử dụng cho login.ejs của nhóm bạn)
        res.json({ 
            message: "Đăng nhập thành công", 
            role: userRole, 
            token: result.token 
        });

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