const mongoose = require("mongoose");

const SpaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, default: "" },
    description: { type: String, default: "Dịch vụ thư giãn cao cấp tại khách sạn" }
}, { timestamps: true });

module.exports = mongoose.model("Spa", SpaSchema);