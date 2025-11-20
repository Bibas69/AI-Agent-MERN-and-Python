import axios from "axios";
import getBackendUrl from "../utils/getBackendUrl.js";

export async function fetchAllTasks(uid) {
    const res = await axios.get(`${getBackendUrl()}/api/task/all`, {
        params: {
            uid: uid
        }
    });
    return res.data.tasks;
}