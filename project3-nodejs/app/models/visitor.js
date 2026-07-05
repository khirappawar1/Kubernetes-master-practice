const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
    name: String,
    message: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Visitor", visitorSchema);