const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// 🔑 Sử dụng requireAuth từ middleware của bạn
const { requireAuth } = require("../middlewares/auth.middleware");

// 🟢 REGISTER (Đăng ký)
router.post("/register", async (req, res) => {
    try {
        const userData = { ...req.body, role: "USER" }; 
        const user = await userController.register(userData);
        
        // Nếu đăng ký qua Form (EJS)
        if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            return res.redirect("/login");
        }
        res.status(201).json({ message: "Đăng ký thành công", user });
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// 🔐 LOGIN (Đăng nhập & Chuyển hướng theo Role)
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        // Gọi controller trả về object { token, user: { role, ... } }
        const result = await userController.login(username, password);

        if (!result || !result.token) {
            return res.status(401).send("Sai tài khoản hoặc mật khẩu");
        }

        // 🍪 Lưu Token vào Cookie
        res.cookie("TOKEN_HOTEL", result.token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 ngày
            sameSite: 'lax'
        });

        // 🚀 Xử lý Chuyển hướng (Redirect)
        // Kiểm tra xem request đến từ trình duyệt (Form) hay công cụ khác (Postman/Ajax)
        const isFromForm = req.headers['content-type']?.includes('application/x-www-form-urlencoded');

        if (isFromForm) {
            const userRole = result.user.role;
            console.log(`-- [Login Success] User: ${result.user.username} | Role: ${userRole}`);

            // 🛎️ Chuyển hướng thông minh dựa trên Role trong MongoDB
            if (userRole === "RECEPTIONIST" || userRole === "ADMIN") {
                return res.redirect("/manage/bookings"); 
            }
            
            // Khách hàng bình thường về trang chủ
            return res.redirect("/");
        }

        // Trả về JSON nếu gọi qua API/Ajax
        res.send({ 
            message: "Đăng nhập thành công", 
            token: result.token, 
            role: result.user.role 
        });

    } catch (err) {
        console.error("Lỗi Login:", err);
        res.status(500).send("Lỗi server khi đăng nhập");
    }
});

// 👤 GET ME
router.get("/me", requireAuth, (req, res) => {
    res.send(req.user);
});

// 🚪 LOGOUT (Đăng xuất)
router.get("/logout", requireAuth, async (req, res) => {
    try {
        if (req.user) {
            req.user.token = null;
            await req.user.save();
        }
        res.clearCookie("TOKEN_HOTEL");
        res.redirect("/");
    } catch (err) {
        console.error("Lỗi Logout:", err);
        res.status(500).send("Lỗi khi đăng xuất");
    }
});

module.exports = router;