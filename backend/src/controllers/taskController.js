const { default: mongoose } = require("mongoose");
const taskModel = require("../models/taskModel");
const userModel = require("../models/userModel");

const createTask = async (req, res) => {
  try {
    const { uid, task, startTime, duration } = req.body;
    if (!uid || !task || !startTime || !duration)
      return res.status(400).json({ success: false, message: "All fields are required." });

    // ✅ Parse startTime
    let localStartTime;

    if (startTime.includes("T")) {
      // ISO or full datetime
      const [datePart, timePart] = startTime.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second = 0] = timePart.split(":").map(Number);
      localStartTime = new Date(year, month - 1, day, hour, minute, second);
    } else {
      // ✅ Simple time format (e.g. "7 AM" or "7:30 pm")
      const time = startTime.trim().toUpperCase();
      const match = time.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);

      if (!match) {
        return res.status(400).json({ success: false, message: "Invalid time format." });
      }

      let hour = parseInt(match[1]);
      const minute = parseInt(match[2] || "0");
      const meridian = match[3];

      if (meridian === "PM" && hour !== 12) hour += 12;
      if (meridian === "AM" && hour === 12) hour = 0;

      const now = new Date();
      localStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
    }

    if (isNaN(localStartTime.getTime()))
      return res.status(400).json({ success: false, message: "Invalid date format." });

    // ✅ Convert duration ("15 minutes" → 15)
    const durationMinutes = parseInt(duration);
    if (isNaN(durationMinutes))
      return res.status(400).json({ success: false, message: "Invalid duration format." });

    const localEndTime = new Date(localStartTime.getTime() + durationMinutes * 60000);

    if (localStartTime < new Date())
      return res.status(400).json({ success: false, message: "Start time cannot be in the past." });

    const user = await userModel.findOne({ uid });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found." });

    // ✅ Check for overlap
    const overlap = await taskModel.findOne({
      user: user._id,
      status: "incomplete",
      startTime: { $lt: localEndTime },
      endTime: { $gt: localStartTime },
    });

    if (overlap)
      return res.status(400).json({ success: false, message: "Task overlaps with another.", task: overlap });

    // ✅ Create the task
    const newTask = await taskModel.create({
      user: user._id,
      task,
      startTime: localStartTime,
      endTime: localEndTime,
      duration: durationMinutes,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      task: newTask,
    });
  } catch (err) {
    console.error("❌ Backend error:", err);
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

const getAllTasks = async (req, res) => {
    try {
        const { uid } = req.query;
        if (!uid) return res.status(400).json({ success: false, message: "Uid not found..." });
        const user = await userModel.findOne({ uid });
        if (!user) return res.status(404).json({ success: false, message: "User not found..." });
        const tasks = await taskModel.find({ user: user._id }).sort({ startTime: 1 });
        if (tasks.length === 0) return res.status(200).json({ success: true, message: "There are no tasks currently. Add tasks to view them...", tasks: [] });
        return res.status(200).json({ success: true, message: "Tasks fetched successfully.", tasks: tasks });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "Server error...", error: err.message });
    }
}

const getTaskById = async (req, res) => {
    try {
        const { uid } = req.body;
        const { taskId } = req.params;
        if (!taskId || !uid) return res.status(400).json({ success: false, message: "Task id and uid are required..." });
        const task = await taskModel.findById(taskId);
        if (!task) return res.status(404).json({ success: false, message: "No task found..." });
        const user = await userModel.findOne({ uid });
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        if (!task.user.equals(user._id)) return res.status(401).json({ success: false, message: "Unauthorized access..." });
        return res.status(200).json({ success: true, message: "Task fetched successfully.", task: task });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
}

const filterTasksOfSingleDate = async (req, res) => {
    try {
        const { uid } = req.query;
        const date = new Date(req.query.date);
        if (!uid) return res.status(400).json({ success: false, message: "Uid is required." });
        if (!date || isNaN(date.getTime())) return res.status(400).json({ success: false, message: "Date not found or date is in invalid format." });
        const user = await userModel.findOne({ uid });
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        const tasks = await taskModel.find({
            user: user._id,
            startTime: { $lte: end },
            endTime: { $gte: start }
        }).sort({ startTime: 1 });
        if (tasks.length === 0) return res.status(200).json({ success: true, message: "No tasks available for the selected date.", tasks: [] });
        return res.status(200).json({ success: true, message: "Tasks for the selected date fetched successfully.", tasks: tasks });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "Server error.", error: err.message });
    }
}

const filterTasksByDate = async (req, res) => {
    try {
        const { uid, startDate, endDate } = req.query;
        if (!uid) return res.status(400).json({ success: false, message: "Uid id required." });
        if (!startDate) return res.status(400).json({ success: false, message: "Start date is required." });
        const user = await userModel.findOne({ uid });
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0)
        let end = !endDate ? new Date() : new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const tasks = await taskModel.find({
            user: user._id,
            startTime: { $lte: end },
            endTime: { $gte: start }
        })
        if (tasks.length === 0) return res.status(200).json({ success: true, message: "No tasks in the selected time frame.", tasks: [] });
        return res.status(200).json({ success: true, message: "Tasks from the selected time frame fetched successfully.", tasks: tasks });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "Server error.", error: err.message });
    }
}

const filterTasksByDuration = async (req, res) => {
    try {
        const { uid } = req.query;
        const duration = Number(req.query.duration);
        if (!uid) return res.status(400).json({ success: false, message: "Uid is required." });
        if (isNaN(duration)) return res.status(400).json({ success: false, message: "Duration must be a number." });
        if (duration <= 0) return res.status(400).json({ success: false, message: "Duration cannot be negative, zero or null" });
        const user = await userModel.findOne({ uid });
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        const tasks = await taskModel.find({
            user: user._id,
            duration: { $lte: duration }
        })
        if (tasks.length === 0) return res.status(200).json({ success: true, message: "No tasks found of the choosen duration", tasks: [] });
        return res.status(200).json({ success: true, message: "All the tasks of the choosen duration fetched successfully.", tasks: tasks });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "Server error.", error: err.message });
    }
}

const findFreeSlots = async (req, res) => {
    try {
        const { uid, date } = req.query;
        if (!uid || !date) return res.status(400).json({ success: false, message: "Uid and date is required." });
        
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) return res.status(400).json({ success: false, message: "Invalid date format." });
        
        // Use the current time as the actual start point
        const now = new Date(parsedDate);
        const start = new Date(parsedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(parsedDate);
        end.setHours(23, 59, 59, 999);
        
        const user = await userModel.findOne({ uid });
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        
        const tasks = await taskModel.find({
            user: user._id,
            startTime: { $lte: end },
            endTime: { $gte: start }
        }).sort({ startTime: 1 });
        
        // Start from current time (or start of day if current time is before start)
        let pointer = now > start ? new Date(now) : new Date(start);
        
        // If no tasks exist, return the entire remaining time as a free slot
        if (tasks.length === 0) {
            if (pointer < end) {
                return res.status(200).json({
                    success: true,
                    message: "Empty slot fetched successfully.",
                    freeSlots: [{ start: pointer, end }]
                });
            } else {
                return res.status(200).json({
                    success: true,
                    message: "No free slots available.",
                    freeSlots: []
                });
            }
        }
        
        let freeSlots = [];
        
        tasks.forEach(task => {
            let taskStart = new Date(task.startTime);
            let taskEnd = new Date(task.endTime);
            
            // Only consider tasks that haven't ended yet
            if (taskEnd <= pointer) {
                return; // Skip tasks that are already over
            }
            
            // If task starts in the future, there's a gap
            if (taskStart > pointer) {
                freeSlots.push({ 
                    start: new Date(pointer), 
                    end: new Date(taskStart)
                });
            }
            
            // Move pointer to the end of current task
            if (taskEnd > pointer) {
                pointer = new Date(taskEnd);
            }
        });
        
        // Add remaining time after last task
        if (pointer < end) {
            freeSlots.push({ 
                start: new Date(pointer), 
                end: new Date(end) 
            });
        }
        
        return res.status(200).json({ 
            success: true, 
            message: "Free slots fetched successfully.", 
            freeSlots: freeSlots 
        });
    }
    catch(err){
        return res.status(500).json({
            success: false, 
            message: "Server error.", 
            error: err.message
        });
    }
}

const updateTaskStatus = async (req, res) => {
    try{
        const {uid, taskStatus} = req.body;
        const {taskId} = req.params;
        if(!uid) return res.status(400).json({success:false, message: "Uid not found."});
        if(!taskId) return res.status(400).json({success:false, message: "Task id id required."});
        if(!taskStatus) return res.status(400).json({success:false, message: "Task status is required."});
        const allowedTaskStatus = ["completed", "cancelled"];
        if(!allowedTaskStatus.includes(taskStatus)) return res.status(400).json({success:false, message: "Invaid task status"});
        const user = await userModel.findOne({uid});
        if(!user) return res.status(400).json({success:false, message: "User not found."});
        const task = await taskModel.findById(taskId);
        if(user._id.equals(task.user)){
            task.status = taskStatus;
            await task.save();
            return res.status(200).json({success:true, message:`Task ${taskStatus}`, task: task})
        }
        return res.status(403).json({success:false, message:"Unauthorized access..."})
    }
    catch(err){
        return res.status(500).json({success:false, message:"Server error...", error: err.message})
    }
}

module.exports = { createTask, getAllTasks, getTaskById, filterTasksOfSingleDate, filterTasksByDate, filterTasksByDuration, findFreeSlots, updateTaskStatus };