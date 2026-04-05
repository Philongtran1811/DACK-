const mongoose = require("mongoose");

const TransportSchema = new mongoose.Schema({
    name: String,
    price: Number
});

module.exports = mongoose.model("Transport", TransportSchema);