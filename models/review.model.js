const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },

    rating: Number, // 1-5 sao
    comment: String

}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);