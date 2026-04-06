const User = require("../models/user.model");
const crypto = require("crypto");

// 🟢 REGISTER
exports.register = async (data) => {
    const { username, email } = data;

    const exist = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (exist) {
        throw new Error("Tài khoản hoặc email đã tồn tại");
    }

    // ✅ ĐẢM BẢO TÀI KHOẢN MỚI LUÔN HOẠT ĐỘNG
    const userData = { ...data, isActive: true }; 
    const user = await User.create(userData);
    return user;
};

// 🔐 LOGIN
exports.login = async (username, password) => {
    // 1. Tìm user khớp cả username và password
    const user = await User.findOne({ username, password });

    if (!user) return null;

    // 2. Tạo token ngẫu nhiên
    const token = crypto.randomBytes(32).toString("hex");

    // 3. Lưu token vào database để duy trì phiên đăng nhập
    user.token = token;
    await user.save();

    // ✅ CỰC KỲ QUAN TRỌNG: Phải trả thêm isActive ở đây
    // để file auth.routes.js có cái mà kiểm tra (if result.user.isActive !== true)
    return {
        token,
        user: {
            _id: user._id,
            username: user.username,
            role: user.role,
            name: user.name,
            isActive: user.isActive // <--- THÊM DÒNG NÀY
        }
    };
};

// 👤 GET USER BY TOKEN
exports.getUserByToken = async (token) => {
    if (!token) return null;
    // Tìm user và kiểm tra luôn trạng thái hoạt động
    const user = await User.findOne({ token });
    
    // Nếu tìm thấy user nhưng bị khóa thì trả về null (coi như không đăng nhập)
    if (user && user.isActive !== true) return null;
    
    return user;
};