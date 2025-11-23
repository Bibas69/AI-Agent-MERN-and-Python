import axios from "axios";
import getBackendUrl from "../utils/getBackendUrl.js";

export async function fetchEmptySlots(uid, date) {
    const res = await axios.get(`${getBackendUrl()}/api/task/getFreeSlots`, {
        params: {
            uid: uid,
            date: date
        }
    });
    return res.data.freeSlots;
}