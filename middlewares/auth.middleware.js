const userController = require("../controllers/user.controller");

//
// 🔐 Check login (API bảo mật)
//
const checkLogin = async (req, res, next) => {
    try {
        const token = req.cookies?.TOKEN_HOTEL;

        if (!token) {
            return res.redirect("/login"); // 🔥 đổi cho hợp EJS
        }

        const user = await userController.getUserByToken(token);

        if (!user) {
            return res.redirect("/login");
        }

        req.user = user;
        next();
    } catch (err) {
        res.redirect("/login");
    }
};


//
// 👁️ Check user (hiển thị navbar)
//
const checkUser = async (req, res, next) => {
    try {
        const token = req.cookies?.TOKEN_HOTEL;

        if (!token) {
            res.locals.user = null;
            return next();
        }

        const user = await userController.getUserByToken(token);

        res.locals.user = user || null;

        next();
    } catch (err) {
        res.locals.user = null;
        next();
    }
};


//
// 🔥 EXPORT ĐÚNG
//
module.exports = {
    checkUser,
    checkLogin,
    requireAuth: checkLogin   // 🔥 QUAN TRỌNG
};