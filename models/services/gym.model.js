const mongoose = require("mongoose");

const GymSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, default: "" },
    description: { type: String, default: "Gói tập tiêu chuẩn tại khách sạn" }
}, { timestamps: true });

module.exports = mongoose.model("Gym", GymSchema);