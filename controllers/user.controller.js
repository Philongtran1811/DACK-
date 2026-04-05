const User = require("../models/user.model");
const crypto = require("crypto");

//
// 🟢 REGISTER
//
exports.register = async (data) => {
    const { username, email } = data;

    // check trùng
    const exist = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (exist) {
        throw new Error("Tài khoản hoặc email đã tồn tại");
    }

    const user = await User.create(data);
    return user;
};

//
// 🔐 LOGIN
//
exports.login = async (username, password) => {
    const user = await User.findOne({ username, password });

    if (!user) return null;

    // tạo token
    const token = crypto.randomBytes(32).toString("hex");

    user.token = token;
    await user.save();

    return token;
};

//
// 👤 GET USER BY TOKEN
//
exports.getUserByToken = async (token) => {
    return await User.findOne({ token });
};