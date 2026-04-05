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
        res.send(user);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

//
// 🔐 LOGIN
//
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const token = await userController.login(username, password);

    if (!token) {
        return res.status(401).send("Sai tài khoản hoặc mật khẩu");
    }

    res.cookie("TOKEN_HOTEL", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    });

    res.send({
        message: "Đăng nhập thành công",
        token
    });
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
router.post("/logout", checkLogin, async (req, res) => {
    req.user.token = null;
    await req.user.save();

    res.cookie("TOKEN_HOTEL", null, { maxAge: 0 });

    res.send("Đăng xuất thành công");
});

module.exports = router;