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

    token: String // dùng cho login (cookie)

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);