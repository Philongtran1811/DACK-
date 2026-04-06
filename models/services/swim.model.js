const mongoose = require("mongoose");

const SwimSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, default: "" },
    description: { type: String, default: "Dịch vụ hồ bơi cao cấp tại khách sạn" }
}, { timestamps: true });

module.exports = mongoose.model("Swim", SwimSchema);