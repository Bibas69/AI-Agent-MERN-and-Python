const mongoose = require("mongoose");

const taskSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    task: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["coming-soon", "inprogress", "incomplete", "completed", "cancelled"],
        default: "coming-soon"
    }
}, {timestamps: true})

taskSchema.index({user: 1, startTime: 1, endTime: 1, duration: 1});

const taskModel = mongoose.model("task", taskSchema);
module.exports = taskModel;