import express from "express";
import dotenv from "dotenv";
import chatRoute from "./src/routes/chatRoute.js";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use("/api/chat", chatRoute);

app.get("/", async (req, res) => {
    res.json({success: true, message: "Langchain server running..."});
})


app.listen(port, () => {
    console.log(`Langchain server started at port ${port}`);
})