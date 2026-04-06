const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, default: "" } // Thêm trường hình ảnh ở đây
}, { timestamps: true });

module.exports = mongoose.model("Food", FoodSchema);