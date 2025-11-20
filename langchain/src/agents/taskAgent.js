// src/agents/taskAgent.js
import { parseIntent } from "../utils/parseIntent.js";
import { getMemory, updateMemory, deleteMemory } from "../utils/memoryManager.js";
import { createTask } from "../tools/createTaskTool.js";
import { fetchAllTasks } from "../tools/fetchAllTasksTool.js";
import { fetchTaskOfSingleDate } from "../tools/fetchTaskOfSingleDateTool.js";

// ------------------------------
// Helper to handle "today" and "tomorrow"
// ------------------------------
const getFormattedDate = (input) => {
  const today = new Date();
  if (input === "today") {
    return today.toISOString().split("T")[0];
  }
  if (input === "tomorrow") {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().split("T")[0];
  }
  return input; // assume valid date string
};

// ------------------------------
// Split tasks into today/upcoming safely
// ------------------------------
const splitTasks = (tasks, refDate) => {
  // Ensure tasks is always an array
  tasks = Array.isArray(tasks) ? tasks : [];

  const today = [];
  const upcoming = [];
  const ref = new Date(refDate);

  tasks.forEach((t) => {
    const start = t.startTime ? new Date(t.startTime) : null;
    const end = t.endTime
      ? new Date(t.endTime)
      : start && t.duration
      ? new Date(start.getTime() + t.duration * 60000)
      : null;

    const parsedTask = {
      task: t.task ?? "N/A",
      start,
      end,
      date: start && !isNaN(start) ? start.toLocaleDateString("en-US") : "N/A",
    };

    const taskDateStr = start && !isNaN(start) ? start.toISOString().split("T")[0] : null;
    const refDateStr = ref.toISOString().split("T")[0];

    if (taskDateStr === refDateStr) today.push(parsedTask);
    else if (start && !isNaN(start) && start > ref) upcoming.push(parsedTask);
  });

  // Sort by start time
  const sortFn = (a, b) => {
    const t1 = a.start instanceof Date && !isNaN(a.start) ? a.start.getTime() : 0;
    const t2 = b.start instanceof Date && !isNaN(b.start) ? b.start.getTime() : 0;
    return t1 - t2;
  };
  today.sort(sortFn);
  upcoming.sort(sortFn);

  const fmtTime = (d) =>
    d instanceof Date && !isNaN(d)
      ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "N/A";

  const formatTasks = (arr) =>
    arr.map((t) => ({
      task: t.task,
      start: fmtTime(t.start),
      end: fmtTime(t.end),
      date: t.date,
    }));

  return {
    today: formatTasks(today),
    upcoming: formatTasks(upcoming),
  };
};

// ------------------------------
// Filter tasks for a specific date
// ------------------------------
const filterTasksByDate = (tasks, targetDate) => {
  tasks = Array.isArray(tasks) ? tasks : [];
  const targetDateStr = new Date(targetDate).toISOString().split("T")[0];
  
  return tasks.filter((t) => {
    const start = t.startTime ? new Date(t.startTime) : null;
    const taskDateStr = start && !isNaN(start) ? start.toISOString().split("T")[0] : null;
    return taskDateStr === targetDateStr;
  });
};

// ------------------------------
// Main handler (FIXED)
// ------------------------------
export const handleChat = async (uid, message) => {
  try {
    console.log("💬 Incoming message:", message);
    const memory = getMemory(uid) || {};
    console.log("🧠 Current memory:", memory);

    // 1️⃣ Fill missing field
    if (memory.awaitingField) {
      const field = memory.awaitingField;
      updateMemory(uid, { [field]: message, awaitingField: undefined });
    } else {
      let intentResult;
      try {
        intentResult = await parseIntent(message);
      } catch (err) {
        console.error("❌ parseIntent failed:", err);
        return "Sorry, I couldn't process that request.";
      }

      const { intent, fields } = intentResult || {};
      if (!intent || intent === "unknown") return "Sorry, I could not understand your request.";

      // auto convert "today"/"tomorrow" to real date
      const dateField = fields?.date ? getFormattedDate(fields.date) : memory.date;

      updateMemory(uid, {
        intent,
        task: fields?.task ?? memory.task,
        startTime: fields?.startTime ?? memory.startTime,
        duration: fields?.duration ?? memory.duration,
        date: dateField,
      });
    }

    const merged = getMemory(uid);

    // 2️⃣ Handle intents
    switch (merged.intent) {
      case "create_task": {
        const required = ["task", "startTime", "duration"];
        const missing = required.filter((k) => !merged[k]);
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
          deleteMemory(uid);
          return "⚠️ Failed to create the task. Please check the time format and try again.";
        }

        deleteMemory(uid);

        if (!newTask || !newTask.startTime || isNaN(new Date(newTask.startTime)))
          return "⚠️ Task saved but start time was invalid.";

        const start = new Date(newTask.startTime);
        const end = new Date(start.getTime() + newTask.duration * 60000);

        return (
          `✅ Your task has been created!\n\n` +
          `📋 Task:  ${newTask.task}\n` +
          `📅 Date:  ${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}\n` +
          `⏰ Time:  ${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} to ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
        );
      }

      case "fetch_all_task": {
        let tasks = [];
        try {
          tasks = await fetchAllTasks(uid);
          if (!Array.isArray(tasks)) tasks = []; // safety
        } catch (err) {
          console.error("❌ fetchAllTasks failed:", err);
          deleteMemory(uid);
          return "⚠️ Failed to fetch tasks. Please try again.";
        }

        deleteMemory(uid);

        if (tasks.length === 0) {
          return "📋 You have no tasks scheduled.";
        }

        const { today, upcoming } = splitTasks(tasks, new Date());

        return {
          type: "task_list",
          todayCount: today.length,
          today,
          upcoming,
        };
      }

      case "fetch_task_of_single_date": {
        if (!merged.date) {
          updateMemory(uid, { awaitingField: "date" });
          return "📅 Which date would you like to see tasks for? (e.g., 2025-11-17, today, or tomorrow)";
        }

        // FIXED: Fetch all tasks first, then filter by date
        let allTasks = [];
        try {
          // Try the specific date fetch first
          allTasks = await fetchTaskOfSingleDate(uid, merged.date);
          
          // If that returns empty or fails, fetch all tasks and filter
          if (!Array.isArray(allTasks) || allTasks.length === 0) {
            console.log("🔄 No tasks from fetchTaskOfSingleDate, trying fetchAllTasks...");
            allTasks = await fetchAllTasks(uid);
            allTasks = filterTasksByDate(allTasks, merged.date);
          }
          
          if (!Array.isArray(allTasks)) allTasks = [];
        } catch (err) {
          console.error("❌ fetchTaskOfSingleDate failed, trying fetchAllTasks:", err);
          try {
            allTasks = await fetchAllTasks(uid);
            allTasks = filterTasksByDate(allTasks, merged.date);
          } catch (err2) {
            console.error("❌ fetchAllTasks also failed:", err2);
            deleteMemory(uid);
            return "⚠️ Failed to fetch tasks for that date. Please try again.";
          }
        }

        deleteMemory(uid);

        if (allTasks.length === 0) {
          const readableDate = new Date(merged.date).toLocaleDateString("en-US", { 
            month: "long", 
            day: "numeric", 
            year: "numeric" 
          });
          return `📋 No tasks found for ${readableDate}.`;
        }

        // For single date queries, we only want tasks for that specific date
        const filteredTasks = filterTasksByDate(allTasks, merged.date);
        
        // Sort tasks by start time
        const sortedTasks = filteredTasks.map(t => {
          const start = t.startTime ? new Date(t.startTime) : null;
          const end = t.endTime
            ? new Date(t.endTime)
            : start && t.duration
            ? new Date(start.getTime() + t.duration * 60000)
            : null;

          const fmtTime = (d) =>
            d instanceof Date && !isNaN(d)
              ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
              : "N/A";

          return {
            task: t.task ?? "N/A",
            start: fmtTime(start),
            end: fmtTime(end),
            date: start && !isNaN(start) ? start.toLocaleDateString("en-US") : "N/A",
          };
        }).sort((a, b) => {
          // Sort by time string (basic but works for HH:MM AM/PM format)
          return a.start.localeCompare(b.start);
        });

        const readableDate = new Date(merged.date).toLocaleDateString("en-US", { 
          month: "long", 
          day: "numeric", 
          year: "numeric" 
        });

        return {
          type: "task_list",
          todayCount: sortedTasks.length,
          today: sortedTasks,
          upcoming: [], // No upcoming tasks for single date view
          dateLabel: readableDate,
        };
      }

      default:
        deleteMemory(uid);
        return "❓ I didn't understand that request. You can ask me to:\n• Create a new task\n• Show all your tasks\n• Show tasks for a specific date";
    }
  } catch (err) {
    console.error("💥 CRITICAL SERVER ERROR:", err);
    deleteMemory(uid);
    return "⚠️ Something went wrong on the server. Please try again.";
  }
};