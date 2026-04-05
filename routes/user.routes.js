const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { checkLogin } = require("../middlewares/auth.middleware");

//
// 🟢 REGISTER
//
router.post("/register", async (req, res) => {
    try {
        const user = await userController.register(req.body);
        // Thay vì chỉ gửi user, ta gửi kèm thông báo rõ ràng
        res.status(201).json({
            message: "Đăng ký thành công",
            user: { id: user._id, username: user.username } // Trả về thông tin cơ bản thôi cho bảo mật
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

//
// 🔐 LOGIN
//
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Gọi hàm login từ controller
        const token = await userController.login(username, password);

        if (!token) {
            // Trả về lỗi 401 nếu sai pass/user
            return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
        }

        // 🔥 Lưu cookie với cấu hình chuẩn
        res.cookie("TOKEN_HOTEL", token, {
            httpOnly: true, // Bảo mật, chặn JS đọc cookie
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax', // Giúp cookie hoạt động ổn định trên localhost
            secure: false    // Để false vì bạn đang dùng http (localhost), nếu lên https thì để true
        });

        // 💡 Mẹo: Nếu request từ trình duyệt (form submit) thì redirect
        // Nếu request từ Postman/Ajax thì trả về JSON thành công
        if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
            return res.redirect("/");
        }
        
        res.json({ message: "Đăng nhập thành công", token });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Lỗi hệ thống khi đăng nhập" });
    }
});

//
// 👤 GET USER HIỆN TẠI
//
router.get("/me", checkLogin, (req, res) => {
    // Trả về thông tin user đã được gán bởi middleware checkLogin
    res.json(req.user);
});

//
// 🚪 LOGOUT
//
router.get("/logout", (req, res) => {
    res.clearCookie("TOKEN_HOTEL");
    res.redirect("/");
});

module.exports = router;