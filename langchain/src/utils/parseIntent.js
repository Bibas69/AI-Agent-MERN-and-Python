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

  // ❤️ FIXED: Properly detect times like "8:50 p.m."
  const timeMatch = text.match(
    /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/i
  );

  // Handle statement like "in the evening"
  const evening = text.includes("evening");
  const morning = text.includes("morning");
  const afternoon = text.includes("afternoon");
  const night = text.includes("night");

  let hour, minute = 0;

  if (timeMatch) {
    hour = parseInt(timeMatch[1], 10);
    minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;

    let meridian = timeMatch[3].toLowerCase();
    meridian = meridian.replace(/\./g, "");

    if (meridian === "pm" && hour !== 12) hour += 12;
    if (meridian === "am" && hour === 12) hour = 0;
  } 
  else if (evening || night || afternoon || morning) {
    // Extract numbers like: "at 5 in the evening"
    const num = text.match(/(\d{1,2})/);
    if (!num) return null;

    hour = parseInt(num[1], 10);

    if (evening || night) hour += 12;
    if (afternoon && hour < 12) hour += 12;
    if (morning && hour === 12) hour = 0;
  }
  else {
    return null;
  }

  let base = new Date(now);

  if (text.includes("tomorrow")) {
    base.setDate(base.getDate() + 1);
  } 
  else if (!text.includes("today")) {
    // Only time given → decide today/tomorrow
    const temp = new Date(now);
    temp.setHours(hour, minute, 0, 0);
    if (temp < now) {
      base.setDate(base.getDate() + 1);
    }
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
   MAIN INTENT PARSER
---------------------------------------------------- */
export const parseIntent = async (message) => {
  const prompt = `
You are an intent extraction system.
Extract EXACT fields without rewriting anything.

Return ONLY JSON:

{
  "intent": "create_task" | "fetch_task" | "unknown",
  "fields": {
    "task": string | null,
    "startTime": string | null,
    "duration": string | null
  }
}

Rules:
- "startTime" must be the MINIMAL EXACT time phrase from the user.
- No added words, no explanations.
- Examples: "today at 8:50 p.m.", "8:50 PM", "tomorrow 7 AM", "at 5 in the evening".
- "task" = the action.
- "duration" = exact phrase like "20 minutes".
- No guessing. Use null if missing.
- Output ONLY JSON, nothing else.

Message: "${message}"
`;

  try {
    const raw = await callLLM(prompt);
    console.log("🧠 Raw LLM Response:", raw);

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { intent: "unknown", fields: {} };

    const data = JSON.parse(match[0]);

    // Convert startTime → ISO
    if (data.fields?.startTime) {
      data.fields.startTime = parseNaturalDateTime(data.fields.startTime);
    }

    // Convert duration → minutes
    if (data.fields?.duration) {
      data.fields.duration = normalizeDuration(data.fields.duration);
    }

    console.log("🧩 Parsed Intent JSON:", data);
    return data;
  } 
  catch (err) {
    console.error("❌ Error parsing intent:", err.message);
    return { intent: "unknown", fields: {} };
  }
};
