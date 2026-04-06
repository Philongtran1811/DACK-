const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// 🔐 LOGIN API
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await userController.login(username, password);

        // 1. Kiểm tra nếu sai tài khoản/mật khẩu
        if (!result || !result.token) {
            return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
        }

        // 2. 🔥 KIỂM TRA TRẠNG THÁI TÀI KHOẢN (QUAN TRỌNG)
        // Nếu isActive là false, chặn ngay lập tức
        if (result.user && result.user.isActive === false) {
            return res.status(403).json({ 
                message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!" 
            });
        }

        // 3. Nếu mọi thứ ổn, mới tiến hành LƯU COOKIE
        res.cookie("TOKEN_HOTEL", result.token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: '/' 
        });

        res.json({ 
            message: "Đăng nhập thành công", 
            role: result.user?.role, 
            token: result.token 
        });

    } catch (err) {
        console.error("Lỗi Login:", err);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
});

// 🚪 LOGOUT
router.get("/logout", (req, res) => {
    res.clearCookie("TOKEN_HOTEL", { path: '/' });
    res.redirect("/login");
});

module.exports = router;