import express from "express";
import { handleChat } from "../agents/taskAgent.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const {uid, message} = req.body;
    const reply = await handleChat(uid, message);
    res.json({reply});
})

export default router;