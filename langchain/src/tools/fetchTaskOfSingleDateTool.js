import axios from "axios";

export const fetchTaskOfSingleDate = async (uid, date) => {
  console.log(`📥 Fetching tasks for UID: ${uid}, date: ${date}`);
  
  try {
    const response = await axios.get("http://localhost:5000/api/task/getTaskBySingleDate", {
      params: { uid, date },
    });

    console.log("✅ Tasks fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    // Only log essential info
    console.error("❌ fetchTaskOfSingleDate failed:");
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error("Status:", error.response.status);
      console.error("Message:", error.response.data.message || error.message);
      console.error("Request URL:", error.response.config.url);
      console.error("Request params:", error.response.config.params);
    } else if (error.request) {
      // Request was made but no response
      console.error("No response received. Request:", error.request);
    } else {
      // Something else happened
      console.error("Error:", error.message);
    }
    return null;
  }
};
