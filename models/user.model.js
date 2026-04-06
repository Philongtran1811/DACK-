const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    username: {
        type: String,
        unique: true
    },
    password: String,
    role: {
        type: String,
        enum: ["ADMIN", "RECEPTIONIST", "USER"],
        default: "USER"
    },
    token: String, // dùng cho login (cookie)

    // ✨ THÊM TRƯỜNG NÀY ĐỂ FIX LỖI NÚT BẤM VÀ TRẠNG THÁI
    isActive: {
        type: Boolean,
        default: true // Mặc định khi đăng ký xong tài khoản sẽ ở trạng thái Hoạt động
    }

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);