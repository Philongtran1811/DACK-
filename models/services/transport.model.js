const mongoose = require("mongoose");

const TransportSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, default: "" },
    description: { type: String, default: "Dịch vụ đưa đón khách hàng chuyên nghiệp" }
}, { timestamps: true });

module.exports = mongoose.model("Transport", TransportSchema);