import { callLLM } from "./callLLM.js";

/**
 * Convert "today", "tomorrow", etc. + time → ISO string "YYYY-MM-DDTHH:mm"
 */
const parseNaturalDateTime = (value) => {
  if (!value) return null;
  const text = value.toLowerCase().trim();
  const now = new Date();

  const build = (y, m, d, hour, minute) =>
    `${y}-${m}-${d}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  // TODAY
  if (text.startsWith("today")) {
    const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const mer = timeMatch[3];
      if (mer === "pm" && hour < 12) hour += 12;
      if (mer === "am" && hour === 12) hour = 0;

      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      return build(y, m, d, hour, minute);
    }
  }

  // TOMORROW
  if (text.startsWith("tomorrow")) {
    const t = new Date();
    t.setDate(now.getDate() + 1);

    const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const mer = timeMatch[3];
      if (mer === "pm" && hour < 12) hour += 12;
      if (mer === "am" && hour === 12) hour = 0;

      const y = t.getFullYear();
      const m = String(t.getMonth() + 1).padStart(2, "0");
      const d = String(t.getDate()).padStart(2, "0");
      return build(y, m, d, hour, minute);
    }
  }

  // ONLY TIME (e.g., "9 PM")
  const onlyTime = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (onlyTime) {
    let hour = parseInt(onlyTime[1], 10);
    const minute = onlyTime[2] ? parseInt(onlyTime[2], 10) : 0;
    const mer = onlyTime[3];
    if (mer === "pm" && hour < 12) hour += 12;
    if (mer === "am" && hour === 12) hour = 0;

    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return build(y, m, d, hour, minute);
  }

  // ISO input
  if (value.includes("T")) {
    const d = new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${hh}:${mm}`;
  }

  return value;
};

/**
 * Cleans duration string aggressively and converts to minutes
 */
const normalizeDuration = (value) => {
  if (!value) return null;

  // Remove all extra words except digits and units
  const cleaned = value
    .toLowerCase()
    .replace(/[^0-9hm\s]/g, " ") // keep only digits, h/m, spaces
    .replace(/\s+/g, " ")
    .trim();

  // Match all numbers with units
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

/**
 * Parse intent using LLM
 */
export const parseIntent = async (message) => {
  const prompt = `
Extract intent and fields from the user's message.

MESSAGE:
"${message}"

Return ONLY JSON:

{
  "intent": "create_task" | "fetch_task" | "unknown",
  "fields": {
    "task": string | null,
    "startTime": string | null,
    "duration": string | null
  }
}

RULES:
- Only return raw JSON, no code blocks.
- Duration must be like "30 minutes", "2 hours", "1h 20m", no extra words.
- Start time can be "today at 5 PM", "tomorrow at 8 AM", "9 PM", etc.
- Do NOT guess missing fields, use null if not provided.
`;

  try {
    const raw = await callLLM(prompt);
    console.log("🧠 Raw LLM Response:", raw);

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { intent: "unknown", fields: {} };

    const data = JSON.parse(match[0]);

    // Normalize startTime to ISO
    if (data.fields?.startTime) {
      data.fields.startTime = parseNaturalDateTime(data.fields.startTime);
    }

    // Normalize duration to minutes
    if (data.fields?.duration) {
      data.fields.duration = normalizeDuration(data.fields.duration);
    }

    console.log("🧩 Parsed Intent JSON:", data);
    return data;
  } catch (err) {
    console.error("❌ Error parsing intent:", err.message);
    return { intent: "unknown", fields: {} };
  }
};
