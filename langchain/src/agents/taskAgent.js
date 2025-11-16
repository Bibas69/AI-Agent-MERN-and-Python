import { parseIntent } from "../utils/parseIntent.js";
import { getMemory, updateMemory, deleteMemory } from "../utils/memoryManager.js";
import { createTask } from "../tools/createTaskTool.js";

/**
 * Convert "2025-11-16 20:00" → "November 16th at 8 PM"
 */
const formatDateTime = (dateTime) => {
    if (!dateTime) return "";
    const d = new Date(dateTime);
    const options = { month: "long", day: "numeric", hour: "numeric", minute: "numeric" };
    return d.toLocaleString("en-US", options);
};

/**
 * Convert duration in minutes → human-readable string
 * 60 → "1 hour"
 * 90 → "1 hour 30 minutes"
 * 30 → "30 minutes"
 */
const formatDuration = (minutes) => {
    if (!minutes) return "";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    let result = "";
    if (hrs > 0) result += `${hrs} hour${hrs > 1 ? "s" : ""}`;
    if (mins > 0) result += (result ? " " : "") + `${mins} minute${mins > 1 ? "s" : ""}`;
    return result;
};

export const handleChat = async (uid, message) => {
    const memory = getMemory(uid);

    // -------------------------------------
    // 1️⃣ If waiting for a field → don't call LLM
    // -------------------------------------
    if (memory.awaitingField) {
        updateMemory(uid, { [memory.awaitingField]: message });
        delete memory.awaitingField;
    } else {
        const { intent, fields } = await parseIntent(message);

        if (intent !== "create_task") {
            return "Sorry, I could not understand what you want to do.";
        }

        // merge fields without overwriting old values
        updateMemory(uid, {
            task: fields.task ?? memory.task,
            startTime: fields.startTime ?? memory.startTime,
            duration: fields.duration ?? memory.duration
        });
    }

    const merged = getMemory(uid);

    // -------------------------------------
    // 2️⃣ Check missing fields
    // -------------------------------------
    const required = ["task", "startTime", "duration"];
    const missing = required.filter(key => !merged[key]);

    if (missing.length > 0) {
        const nextField = missing[0];
        updateMemory(uid, { awaitingField: nextField });
        return `What is the ${nextField} of this task?`;
    }

    // -------------------------------------
    // 3️⃣ All fields complete → create task
    // -------------------------------------
    const taskResponse = await createTask(uid, merged);

    // clear memory
    deleteMemory(uid);

    if (taskResponse) {
        // Format startTime and duration for readability
        const readableDate = formatDateTime(merged.startTime);
        const readableDuration = formatDuration(merged.duration);

        return `✅ Task created: "${merged.task}" at ${readableDate} for ${readableDuration}.`;
    }

    return "❌ Could not create the task.";
};
