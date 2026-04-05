const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        unique: true
    },

    roomType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomType",
        required: true
    },

    image: {
        type: String,
        default: "https://via.placeholder.com/300"
    },

    status: {
        type: String,
        enum: ["AVAILABLE", "BOOKED", "MAINTENANCE"],
        default: "AVAILABLE"
    }

}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);