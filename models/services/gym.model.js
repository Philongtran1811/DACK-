const mongoose = require("mongoose");

const GymSchema = new mongoose.Schema({
    name: String,
    price: Number
});

module.exports = mongoose.model("Gym", GymSchema);