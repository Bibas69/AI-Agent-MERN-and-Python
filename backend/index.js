process.env.TZ = "Asia/Kolkata";

require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const connectToDB = require("./src/connection/mongooseConnection");
const userRouter = require("./src/routers/userRouter");
const taskRouter = require("./src/routers/taskRouter");
const { setIncomplete, setInProgress } = require("./src/cron/cron");
const cors = require("cors");
connectToDB(process.env.MONGO_DB_URL)
.then(() => {
    console.log("Connected to database");
})
.catch((err) => {
    console.log(err.message)
})

app.use(cors());

app.use(express.json());
app.use("/api/user", userRouter);
app.use("/api/task", taskRouter);

app.get("/", (req, res) => {
    res.send("Server started...");
})

app.listen(port, () => {
    console.log(`Server started at port ${port}`)
})
