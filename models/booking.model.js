const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    checkIn: Date,
    checkOut: Date,
    totalPrice: Number,
    status: {
        type: String,
        enum: ["PENDING", "CONFIRMED", "CANCELLED"],
        default: "CONFIRMED" // Để CONFIRMED luôn cho tiện test
    }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);