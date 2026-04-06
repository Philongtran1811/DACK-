const mongoose = require("mongoose");

const BilliardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, default: "https://images.unsplash.com/photo-1574629810360-7efbbe195018" },
    description: { type: String, default: "Bàn bida tiêu chuẩn quốc tế, không gian hiện đại." }
}, { timestamps: true });

module.exports = mongoose.model("Billiard", BilliardSchema);