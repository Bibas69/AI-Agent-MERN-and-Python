import axios from "axios";
import getBackendUrl from "../utils/getBackendUrl.js";

export const createTask = async (uid, { task, startTime, duration }) => {
  try {
    console.log("📤 Sending to backend:", {
      uid,
      task,
      startTime,
      duration,
    });
    const res = await axios.post(`${getBackendUrl()}/api/task`, {
      uid,
      task,
      startTime,
      duration,
    });
    return res.data.task;
  } catch (err) {
    console.error("Backend error response:", err.response?.data);
    console.error("Backend error status:", err.response?.status);
    console.error("Backend error message:", err.message);
    return null;
  }
};
