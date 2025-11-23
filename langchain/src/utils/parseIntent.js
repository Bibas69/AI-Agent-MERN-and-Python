import { callLLM } from "./callLLM.js";

/* ----------------------------------------------------
   TIME PARSER — FIXED FOR "8:50 p.m." and variations
---------------------------------------------------- */
const parseNaturalDateTime = (value) => {
  if (!value) return null;

  const text = value.toLowerCase().trim();
  const now = new Date();

  const formatISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };

  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/i);

  const evening = text.includes("evening");
  const morning = text.includes("morning");
  const afternoon = text.includes("afternoon");
  const night = text.includes("night");

  let hour, minute = 0;

  if (timeMatch) {
    hour = parseInt(timeMatch[1], 10);
    minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;

    let meridian = timeMatch[3].toLowerCase().replace(/\./g, "");
    if (meridian === "pm" && hour !== 12) hour += 12;
    if (meridian === "am" && hour === 12) hour = 0;
  } else if (evening || night || afternoon || morning) {
    const num = text.match(/(\d{1,2})/);
    if (!num) return null;
    hour = parseInt(num[1], 10);
    if (evening || night) hour += 12;
    if (afternoon && hour < 12) hour += 12;
    if (morning && hour === 12) hour = 0;
  } else {
    return null;
  }

  let base = new Date(now);

  if (text.includes("tomorrow")) base.setDate(base.getDate() + 1);
  else if (!text.includes("today")) {
    const temp = new Date(now);
    temp.setHours(hour, minute, 0, 0);
    if (temp < now) base.setDate(base.getDate() + 1);
  }

  base.setHours(hour);
  base.setMinutes(minute);
  base.setSeconds(0);
  base.setMilliseconds(0);

  return formatISO(base);
};

/* ----------------------------------------------------
   DURATION PARSER
---------------------------------------------------- */
const normalizeDuration = (value) => {
  if (!value) return null;

  const cleaned = value
    .toLowerCase()
    .replace(/[^0-9hm\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const matches = [...cleaned.matchAll(/(\d+)\s*(h|hour|hours|m|min|minutes)/g)];
  if (!matches.length) return null;

  let total = 0;
  for (const m of matches) {
    const amount = parseInt(m[1], 10);
    const unit = m[2];
    if (["h", "hour", "hours"].includes(unit)) total += amount * 60;
    if (["m", "min", "minutes"].includes(unit)) total += amount;
  }
  return total > 0 ? total : null;
};

/* ----------------------------------------------------
   MAIN INTENT PARSER WITH IMPROVED KEYWORD PRECHECK
---------------------------------------------------- */
export const parseIntent = async (message) => {
  const text = message.toLowerCase().trim();

  // 1️⃣ Enhanced keyword pre-check for all intents
  const createKeywords = ["remind me", "add task", "schedule", "create", "set a task", "add a task"];
  const fetchAllKeywords = ["all tasks", "list tasks", "show tasks", "my tasks", "view all"];
  const fetchDateKeywords = ["today", "tomorrow", /\d{4}-\d{2}-\d{2}/]; // exact date format
  const fetchEmptySlotsKeywords = [
    "empty slots", 
    "free time", 
    "free slots",
    "when am i free",
    "when free",
    "available time",
    "available slots",
    "find free time",
    "find empty slots",
    "get free time",
    "show free time",
    "what time am i free",
    "do i have free time"
  ];

  let intentOverride = null;
  let detectedDate = null;

  // Extract date if mentioned
  if (text.includes("today")) {
    detectedDate = "today";
  } else if (text.includes("tomorrow")) {
    detectedDate = "tomorrow";
  }

  // Check fetch_empty_slots keywords FIRST (highest priority for ambiguous cases)
  if (fetchEmptySlotsKeywords.some(k => text.includes(k))) {
    intentOverride = "fetch_empty_slots";
  }
  // Check create_task keywords
  else if (createKeywords.some(k => text.includes(k))) {
    intentOverride = "create_task";
  }
  // Check fetch_task_by_single_date keywords
  else if (
    fetchDateKeywords.some(k => typeof k === "string" ? text.includes(k) : k.test(text)) &&
    !fetchAllKeywords.some(k => text.includes(k)) // Make sure it's not asking for "all tasks"
  ) {
    intentOverride = "fetch_task_of_single_date";
  }
  // Check fetch_all_task keywords
  else if (fetchAllKeywords.some(k => text.includes(k))) {
    intentOverride = "fetch_all_task";
  }
  else {
    intentOverride = "unknown";
  }

  // 2️⃣ Build LLM prompt as fallback/enhancement
  const prompt = `
You are a task assistant intent extraction system. Your job is to **analyze the user's message** and extract exactly what they want to do. You must **return ONLY JSON**, following the exact format below.

JSON FORMAT:

{
  "intent": "create_task" | "fetch_all_task" | "fetch_task_by_single_date" | "fetch_empty_slots" | "unknown",
  "fields": {
    "task": string | null,
    "startTime": string | null,
    "duration": string | null,
    "date": string | null
  }
}

DETAILED RULES:

1. **Intent detection**
   - If the user clearly wants to create or schedule a task (keywords: "remind me", "add task", "schedule", "create", "set a task"), intent = "create_task".
   - If the user wants to **know when they have free time or empty slots** (keywords: "free time", "empty slots", "when am i free", "available time", "find free time"), intent = "fetch_empty_slots".
   - If the user wants to **fetch tasks for a specific date** (mentions "today", "tomorrow", or a specific date like "2025-11-17") and there is no creation keyword or free time keyword, intent = "fetch_task_by_single_date".
   - If the user wants to **see all tasks** without specifying a date (keywords: "all tasks", "list tasks", "show tasks", "my tasks"), intent = "fetch_all_task".
   - If none of the above applies or you are unsure, intent = "unknown".

2. **Fields extraction**
   - "task": extract **exactly what the task/action is** if present. Use null if not mentioned.
   - "startTime": extract the **minimal exact time phrase** from the user's message (examples: "today at 8:50 p.m.", "8:50 PM", "tomorrow 7 AM", "at 5 in the evening"). If missing, use null.
   - "duration": extract the **duration exactly as stated**, e.g., "20 minutes", "1 hour 15 mins". Use null if missing.
   - "date": extract any specific date mentioned. Examples: "today", "tomorrow", "2025-11-17". For fetch_empty_slots intent, default to "today" if not specified.

3. **Important considerations**
   - Do **not rewrite or summarize** the user's words.
   - Do **not infer anything** not explicitly mentioned.
   - Do **not include any extra fields**, comments, or explanation.
   - Output **valid JSON only**.
   - Time phrases should be left exactly as written by the user (minimal exact expression).
   - For fetch_empty_slots queries, if no date is specified, set date to "today".

4. **Examples**
   - Message: "Remind me to call my mom tomorrow at 6 AM for 30 minutes"
     \`\`\`json
     {
       "intent": "create_task",
       "fields": {
         "task": "call my mom",
         "startTime": "tomorrow at 6 AM",
         "duration": "30 minutes",
         "date": "tomorrow"
       }
     }
     \`\`\`
   - Message: "Show me all tasks for today"
     \`\`\`json
     {
       "intent": "fetch_task_by_single_date",
       "fields": {
         "task": null,
         "startTime": null,
         "duration": null,
         "date": "today"
       }
     }
     \`\`\`
   - Message: "List all tasks"
     \`\`\`json
     {
       "intent": "fetch_all_task",
       "fields": {
         "task": null,
         "startTime": null,
         "duration": null,
         "date": null
       }
     }
     \`\`\`
   - Message: "Find free slots"
     \`\`\`json
     {
       "intent": "fetch_empty_slots",
       "fields": {
         "task": null,
         "startTime": null,
         "duration": null,
         "date": "today"
       }
     }
     \`\`\`
   - Message: "When am I free tomorrow?"
     \`\`\`json
     {
       "intent": "fetch_empty_slots",
       "fields": {
         "task": null,
         "startTime": null,
         "duration": null,
         "date": "tomorrow"
       }
     }
     \`\`\`
   - Message: "Do I have any free time today?"
     \`\`\`json
     {
       "intent": "fetch_empty_slots",
       "fields": {
         "task": null,
         "startTime": null,
         "duration": null,
         "date": "today"
       }
     }
     \`\`\`

Now analyze the following user message and extract intent and fields **exactly following the rules above**:

Message: "${message}"
`;

  try {
    const raw = await callLLM(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    let data = match ? JSON.parse(match[0]) : { intent: "unknown", fields: {} };

    // 3️⃣ Override intent if pre-check determined one
    if (intentOverride && intentOverride !== "unknown") {
      data.intent = intentOverride;
    }

    // 4️⃣ Set default date for empty slots if not specified
    if (data.intent === "fetch_empty_slots" && !data.fields?.date) {
      data.fields = data.fields || {};
      data.fields.date = detectedDate || "today";
    }

    // 5️⃣ Convert startTime → ISO
    if (data.fields?.startTime) {
      data.fields.startTime = parseNaturalDateTime(data.fields.startTime);
    }

    // 6️⃣ Convert duration → minutes
    if (data.fields?.duration) {
      data.fields.duration = normalizeDuration(data.fields.duration);
    }

    return data;
  } catch (err) {
    console.error("❌ Error parsing intent:", err.message);
    return { 
      intent: intentOverride || "unknown", 
      fields: { 
        date: (intentOverride === "fetch_empty_slots") ? (detectedDate || "today") : null 
      } 
    };
  }
};