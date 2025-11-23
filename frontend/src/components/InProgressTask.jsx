import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import getBackendUrl from "../utils/getBackendUrl";
import CountdownCircle from "./CountdownCircle";

const InProgressTask = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [timeUp, setTimeUp] = useState(false);

    const fetchInProgressTask = async () => {
        try {
            const now = new Date();
            const res = await axios.get(`${getBackendUrl()}/api/task/getTaskBySingleDate`, {
                params: { uid: currentUser.uid, date: new Date(now) },
            });

            const inProgressTask = res.data.tasks.filter(
                (task) =>
                    new Date(task.endTime) > now &&
                    new Date(task.startTime) < now &&
                    task.status === "inprogress"
            );

            setTask(inProgressTask || []);
        } catch (err) {
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            setErrorMessage("User not found...");
            setLoading(false);
            return;
        }

        fetchInProgressTask();
        const interval = setInterval(fetchInProgressTask, 5000);
        return () => clearInterval(interval);
    }, [currentUser]);

    const finishTask = async () => {
        const taskId = task[0]._id;
        const res = await axios.patch(
            `${getBackendUrl()}/api/task/updateStatus/${taskId}`,
            { uid: currentUser.uid, taskStatus: "completed" }
        );

        if (res.data.success === false) return setErrorMessage(res.data.message);
        await fetchInProgressTask();
    };

    const cancelTask = async () => {
        const taskId = task[0]._id;
        const res = await axios.patch(
            `${getBackendUrl()}/api/task/updateStatus/${taskId}`,
            { uid: currentUser.uid, taskStatus: "cancelled" }
        );

        if (res.data.success === false) return setErrorMessage(res.data.message);
        await fetchInProgressTask();
    };

    useEffect(() => {
        if (!task || task.length === 0) return;

        const handleTimeUp = () => {
            const now = new Date().getTime();
            const taskEnd = new Date(task[0].endTime).getTime();
            if (now >= taskEnd + 30000) setTimeUp(true);
        };

        const interval = setInterval(handleTimeUp, 10000);
        return () => clearInterval(interval);
    }, [currentUser, task]);

    /* -------------------- UI STATES -------------------- */

    const containerClass = `
        w-full 
        h-full
        max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl
        mx-auto 
        bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 
        rounded-lg sm:rounded-xl 
        border border-zinc-700 
        shadow-lg shadow-black/40
        p-3 xs:p-4 sm:p-5 md:p-6
        min-h-[200px] xs:min-h-[220px] sm:min-h-[240px] md:min-h-[260px]
        flex flex-col justify-between
    `;

    if (loading) {
        return (
            <div className={containerClass}>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <p className="text-white text-sm sm:text-base md:text-lg font-semibold tracking-wide">
                        Task in Progress
                    </p>
                </div>

                <div className="flex items-center justify-center py-6 sm:py-8">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border-3 border-t-blue-500 border-r-blue-500/30 border-b-blue-500/30 border-l-blue-500/30 rounded-full animate-spin"></div>
                        <p className="text-zinc-400 text-xs sm:text-sm md:text-base">Loading task...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className={containerClass}>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
                    <p className="text-white text-sm sm:text-base md:text-lg font-semibold tracking-wide">
                        Task in Progress
                    </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-md sm:rounded-lg p-3 sm:p-4 flex items-start sm:items-center gap-2 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-300 text-xs sm:text-sm break-words">{errorMessage}</p>
                </div>
            </div>
        );
    }

    if (task.length === 0) {
        return (
            <div className={containerClass}>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-zinc-500 rounded-full"></div>
                    <p className="text-white text-sm sm:text-base md:text-lg font-semibold tracking-wide">
                        Task in Progress
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center py-6 sm:py-8 gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-600">
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-zinc-400 text-xs sm:text-sm text-center px-4">No task in progress currently</p>
                    <p className="text-zinc-500 text-[10px] sm:text-xs text-center">Start a task to see it here</p>
                </div>
            </div>
        );
    }

    /* -------------------- MAIN RENDER -------------------- */

    return (
        <div className={containerClass}>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_6px_#22c55e] sm:shadow-[0_0_8px_#22c55e]"></div>
                <p className="text-white text-sm sm:text-base md:text-lg font-semibold tracking-wide">
                    Task in Progress
                </p>
            </div>

            <div className="w-full flex flex-col gap-3 sm:gap-4 md:gap-6">
                <div className="
                    w-full 
                    bg-gradient-to-br from-zinc-900 to-zinc-800/50
                    border border-zinc-600 
                    hover:border-zinc-500 hover:shadow-lg hover:shadow-black/30 
                    transition-all duration-300 
                    rounded-md sm:rounded-lg 
                    p-3 sm:p-4 md:p-5 
                    flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4
                ">
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-start sm:items-center gap-2 mb-2 sm:mb-3">
                            <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full flex-shrink-0 mt-0.5 sm:mt-0"></div>
                            <p className="text-white font-semibold text-sm sm:text-base md:text-lg break-words leading-tight sm:leading-normal">
                                {task[0].task}
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400 text-[10px] xs:text-xs sm:text-sm ml-3">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>

                            <span className="truncate">
                                Started at{" "}
                                {new Date(task[0].startTime).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                    </div>

                    <div className="flex-shrink-0 self-center sm:self-auto scale-90 xs:scale-95 sm:scale-100">
                        <CountdownCircle
                            endTime={task[0].endTime}
                            startTime={task[0].startTime}
                            timeUp={timeUp}
                        />
                    </div>
                </div>

                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 md:gap-4">
                    <button
                        onClick={finishTask}
                        className="
                            w-full sm:flex-1 sm:max-w-[180px] md:max-w-[200px]
                            h-10 sm:h-11
                            bg-green-500/10 border border-green-500 
                            rounded-md sm:rounded-lg 
                            text-green-400 font-medium 
                            text-xs sm:text-sm
                            hover:bg-green-500 hover:text-white hover:shadow-lg hover:shadow-green-500/30 
                            active:scale-95
                            transition-all duration-300 
                            flex items-center justify-center gap-1.5 sm:gap-2
                        "
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Finish</span>
                    </button>

                    <button
                        onClick={cancelTask}
                        className="
                            w-full sm:flex-1 sm:max-w-[180px] md:max-w-[200px]
                            h-10 sm:h-11
                            bg-red-500/10 border border-red-500 
                            rounded-md sm:rounded-lg 
                            text-red-400 font-medium 
                            text-xs sm:text-sm
                            hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/30 
                            active:scale-95
                            transition-all duration-300 
                            flex items-center justify-center gap-1.5 sm:gap-2
                        "
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Cancel</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InProgressTask;