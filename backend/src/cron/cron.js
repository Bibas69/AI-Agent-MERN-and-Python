const cron = require("node-cron");
const taskModel = require("../models/taskModel");

const setIncomplete = cron.schedule("*/10 * * * * *", async () => {
    try{
        await taskModel.updateMany(
            {
            status: "inprogress",
            endTime: {$lte: new Date(Date.now() - 30000)}
            },
            {
                $set:{
                    status: "incomplete"
                }
            }
        )
    }
    catch(err){
        console.log(err.message);
    }
}, {scheduled: true})

const setInProgress = cron.schedule("*/10 * * * * *", async () => {
    try{
        await taskModel.updateMany(
            {
                status: "coming-soon",
                startTime: {$lte: new Date(Date.now())}
            },
            {
                $set:{
                    status: "inprogress"
                }
            }
        )
    }
    catch(err){
        console.log(err.message);
    }
}, {scheduled: true})

module.exports = {setIncomplete, setInProgress};