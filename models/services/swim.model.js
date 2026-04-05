const mongoose = require("mongoose");

const SwimSchema = new mongoose.Schema({
    name: String,
    price: Number
});

module.exports = mongoose.model("Swim", SwimSchema);