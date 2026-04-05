const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/hotelDB")
    .then(() => console.log("✅ Kết nối MongoDB thành công"))
    .catch(err => console.log("❌ Lỗi kết nối:", err));