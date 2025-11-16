const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    uid: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
}, {timestamps: true})

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;