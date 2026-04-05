const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// 🔐 LOGIN API
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await userController.login(username, password);

        if (!result || !result.token) {
            return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
        }

        // 🍪 LƯU COOKIE (Đã fix path để không bị Cannot GET)
        res.cookie("TOKEN_HOTEL", result.token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: '/' // ✅ QUAN TRỌNG: Giúp trang /admin thấy được cookie này
        });

        res.json({ 
            message: "Đăng nhập thành công", 
            role: result.user?.role, 
            token: result.token 
        });

    } catch (err) {
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
});

// 🚪 LOGOUT
router.get("/logout", (req, res) => {
    res.clearCookie("TOKEN_HOTEL", { path: '/' });
    res.redirect("/login");
});

module.exports = router;