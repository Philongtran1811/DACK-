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
        res.send({
            message: "Đăng ký thành công",
            user
        });
    } catch (err) {
        res.status(400).send(err.message);
    }
});

//
// 🔐 LOGIN
//
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const token = await userController.login(username, password);

        if (!token) {
            return res.status(401).send("Sai tài khoản hoặc mật khẩu");
        }

        // 🔥 Lưu cookie
        res.cookie("TOKEN_HOTEL", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        // 🔥 Redirect về trang chủ (quan trọng để hiện tên)
        res.redirect("/");
    } catch (err) {
        res.status(500).send("Lỗi server");
    }
});

//
// 👤 GET USER HIỆN TẠI
//
router.get("/me", checkLogin, (req, res) => {
    res.send(req.user);
});

//
// 🚪 LOGOUT
//
router.get("/logout", (req, res) => {
    res.clearCookie("TOKEN_HOTEL");
    res.redirect("/");
});

module.exports = router;