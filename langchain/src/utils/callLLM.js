import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const callLLM = async (prompt) => {
  try {
    const res = await axios.post(
      process.env.API_URL, // https://api.groq.com/openai/v1/chat/completions
      {
        model: process.env.MODEL, // llama-3.3-70b-versatile
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_KEY}`, // ✅ REQUIRED
        },
      }
    );

    console.log("🧠 Raw LLM Response:", res.data);

    // Groq returns:
    // response.data.choices[0].message.content
    const reply =
      res.data?.choices?.[0]?.message?.content ||
      "Sorry, I did not understand that.";

    return reply;
  } catch (err) {
    console.error("LLM API Error:", err.response?.data || err.message);
    return "There was an error connecting to the AI service.";
  }
};
