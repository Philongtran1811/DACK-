const User = require("../models/user.model");
const crypto = require("crypto");

//
// 🟢 REGISTER
//
exports.register = async (data) => {
    const { username, email } = data;

    // 1. Check trùng tài khoản hoặc email
    const exist = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (exist) {
        throw new Error("Tài khoản hoặc email đã tồn tại");
    }

    // 2. Tạo user mới (mặc định role USER nếu data không có role)
    const user = await User.create(data);
    return user;
};

//
// 🔐 LOGIN
//
exports.login = async (username, password) => {
    // 1. Tìm user khớp cả username và password
    const user = await User.findOne({ username, password });

    if (!user) return null;

    // 2. Tạo token ngẫu nhiên
    const token = crypto.randomBytes(32).toString("hex");

    // 3. Lưu token vào database để duy trì phiên đăng nhập
    user.token = token;
    await user.save();

    // ✅ QUAN TRỌNG: Trả về cả token và thông tin user (để lấy role)
    return {
        token,
        user: {
            _id: user._id,
            username: user.username,
            role: user.role,
            name: user.name
        }
    };
};

//
// 👤 GET USER BY TOKEN
//
exports.getUserByToken = async (token) => {
    if (!token) return null;
    return await User.findOne({ token });
};