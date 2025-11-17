import { parseIntent } from "../utils/parseIntent.js";
import { getMemory, updateMemory, deleteMemory } from "../utils/memoryManager.js";
import { createTask } from "../tools/createTaskTool.js";
import { fetchAllTasks } from "../tools/fetchAllTasksTool.js";

export const handleChat = async (uid, message) => {
    try {
        const memory = getMemory(uid) || {};

        // ------------------------------
        // 1️⃣ FILL MISSING FIELD
        // ------------------------------
        if (memory.awaitingField) {
            updateMemory(uid, { [memory.awaitingField]: message });
            delete memory.awaitingField;
        } else {
            let intentResult;

            try {
                intentResult = await parseIntent(message);
            } catch (err) {
                console.error("❌ parseIntent failed:", err);
                return "Sorry, I couldn't process that request.";
            }

            const { intent, fields } = intentResult || {};

            if (!intent || intent === "unknown") {
                return "Sorry, I could not understand your request.";
            }

            updateMemory(uid, {
                intent,
                task: fields?.task ?? memory.task,
                startTime: fields?.startTime ?? memory.startTime,
                duration: fields?.duration ?? memory.duration,
                date: fields?.date ?? memory.date
            });
        }

        const merged = getMemory(uid);

        // ------------------------------
        // 2️⃣ HANDLE INTENTS
        // ------------------------------
        switch (merged.intent) {

            // -------------------------------------------------------
            // CREATE TASK INTENT
            // -------------------------------------------------------
            case "create_task": {
                const required = ["task", "startTime", "duration"];
                const missing = required.filter(k => !merged[k]);

                if (missing.length > 0) {
                    const next = missing[0];
                    updateMemory(uid, { awaitingField: next });
                    return `What is the ${next} of this task?`;
                }

                let newTask;
                try {
                    newTask = await createTask(uid, merged);
                } catch (err) {
                    console.error("❌ Error creating task:", err);
                    return "⚠️ Failed to create the task. Please check the time format and try again.";
                }

                deleteMemory(uid);

                // Safety checks
                if (!newTask || !newTask.startTime || isNaN(new Date(newTask.startTime))) {
                    return "⚠️ Task saved but start time was invalid.";
                }

                const start = new Date(newTask.startTime);
                const end = new Date(start.getTime() + (newTask.duration * 60000));

                const dateString = start.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                });

                const startTime = start.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit"
                });

                const endTime = end.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit"
                });

                return (
                    `Your task has been created!\n\n` +
                    `Task:  ${newTask.task}\n` +
                    `Date:  ${dateString}\n` +
                    `Time:  ${startTime} to ${endTime}`
                );
            }

            // -------------------------------------------------------
            // FETCH ALL TASKS
            // -------------------------------------------------------
            case "fetch_task": {
                let tasks = [];

                try {
                    tasks = await fetchAllTasks(uid);
                } catch (err) {
                    console.error("❌ fetchAllTasks failed:", err);
                    return {
                        type: "task_list",
                        todayCount: 0,
                        today: [],
                        upcoming: []
                    };
                }

                deleteMemory(uid);

                if (!tasks.length) {
                    return {
                        type: "task_list",
                        todayCount: 0,
                        today: [],
                        upcoming: []
                    };
                }

                // Convert time safely
                const parsed = tasks.map(t => {
                    const start = new Date(t.startTime);
                    const end = new Date(start.getTime() + t.duration * 60000);

                    return {
                        ...t,
                        start: isNaN(start) ? null : start,
                        end: isNaN(end) ? null : end
                    };
                });

                parsed.sort((a, b) => (a.start || 0) - (b.start || 0));

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const todayTasks = parsed.filter(t => {
                    if (!t.start) return false;
                    const d = new Date(t.start);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime() === today.getTime();
                });

                const upcomingTasks = parsed.filter(t => {
                    if (!t.start) return false;
                    const d = new Date(t.start);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime() > today.getTime();
                });

                const fmt = d =>
                    d?.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit"
                    }) ?? "Invalid time";

                const fmtDate = d =>
                    d?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) ??
                    "Invalid date";

                return {
                    type: "task_list",
                    todayCount: todayTasks.length,

                    today: todayTasks.map(t => ({
                        task: t.task,
                        start: fmt(t.start),
                        end: fmt(t.end)
                    })),

                    upcoming: upcomingTasks.map(t => ({
                        task: t.task,
                        date: fmtDate(t.start),
                        start: fmt(t.start),
                        end: fmt(t.end)
                    }))
                };
            }

            // -------------------------------------------------------
            default:
                return "I didn’t understand the request.";
        }

    } catch (err) {
        console.error("💥 CRITICAL SERVER ERROR:", err);
        return "⚠️ Something went wrong, but I'm still running.";
    }
};
