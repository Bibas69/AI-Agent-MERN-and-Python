import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext';
import getBackendUrl from '../utils/getBackendUrl';
import axios from 'axios';

const UpcomingTasks = () => {

    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [groupedTasks, setGroupedTasks] = useState({});

    useEffect(() => {
        if (!currentUser) return setErrorMessage("Error: User not found...");
        const fetchTasks = async () => {
            try {
                const res = await axios.get(`${getBackendUrl()}/api/task/all`, {
                    params: { uid: currentUser.uid }
                });
                setTasks(res.data.tasks || []);
                setLoading(false);
            }
            catch (err) {
                setErrorMessage(err.message);
                setLoading(false);
            }
        };
        fetchTasks();
        const interval = setInterval(fetchTasks, 5000);
        return () => clearInterval(interval);
    }, [currentUser]);

    useEffect(() => {
        if (!loading) {
            if (!tasks) return setErrorMessage("No tasks found...");
            const now = new Date();
            const upcomingTasks = tasks
                .filter(task => new Date(task.startTime) >= now)
                .reduce((groups, task) => {
                    const date = new Date(task.startTime).toLocaleDateString();
                    if (!groups[date]) groups[date] = [];
                    groups[date].push(task);
                    return groups;
                }, {});
            setGroupedTasks(upcomingTasks);
        }
    }, [tasks, loading]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateOnly = date.toLocaleDateString();
        const todayOnly = today.toLocaleDateString();
        const tomorrowOnly = tomorrow.toLocaleDateString();

        if (dateOnly === todayOnly) return "Today";
        if (dateOnly === tomorrowOnly) return "Tomorrow";

        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    /* -------------------- LOADING -------------------- */
    if (loading) {
        return (
            <div className="w-full max-w-xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl 
                            border border-zinc-700 shadow-lg shadow-black/40 p-6 mx-auto">
                <div className="flex items-center gap-3 mb-4">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-white text-lg font-semibold">Upcoming Tasks</p>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border-3 border-t-blue-500 border-r-blue-500/30 
                                        border-b-blue-500/30 border-l-blue-500/30 rounded-full animate-spin"></div>
                        <p className="text-zinc-400">Loading tasks...</p>
                    </div>
                </div>
            </div>
        );
    }

    /* -------------------- ERROR -------------------- */
    if (errorMessage) {
        return (
            <div className="w-full max-w-xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl 
                            border border-zinc-700 shadow-lg shadow-black/40 p-6 mx-auto">
                <div className="flex items-center gap-3 mb-4">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-white text-lg font-semibold">Upcoming Tasks</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-300 text-sm">{errorMessage}</p>
                </div>
            </div>
        );
    }

    /* -------------------- MAIN VIEW -------------------- */
    return (
        <div className="w-full max-w-xl max-h-[28rem] bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 
                        rounded-xl border border-zinc-700 shadow-lg shadow-black/40 p-6 
                        mx-auto flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-white text-lg font-semibold">Upcoming Tasks</p>
                </div>

                {Object.keys(groupedTasks).length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 
                                    border border-cyan-500/30 rounded-full">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                        <span className="text-cyan-400 text-xs font-medium">
                            {Object.values(groupedTasks).flat().length} tasks
                        </span>
                    </div>
                )}
            </div>

            {/* Scrollable Tasks */}
            <div className="flex-1 overflow-y-auto pr-2 
                            [scrollbar-width:thin] 
                            [scrollbar-color:#52525b_transparent]
                            [&::-webkit-scrollbar]:w-2 
                            [&::-webkit-scrollbar-track]:bg-transparent 
                            [&::-webkit-scrollbar-thumb]:bg-zinc-600 
                            [&::-webkit-scrollbar-thumb]:rounded-full 
                            [&::-webkit-scrollbar-thumb:hover]:bg-zinc-500">

                {Object.keys(groupedTasks).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-600">
                            <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <p className="text-zinc-400 text-sm">No upcoming tasks</p>
                        <p className="text-zinc-500 text-xs">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">

                        {Object.entries(groupedTasks).map(([date, dateTasks]) => (
                            <div key={String(date)} className="relative">

                                {/* Date Header */}
                                <div className="flex items-center gap-3 mb-4 sticky top-0 
                                                bg-gradient-to-r from-zinc-800 to-transparent py-2 z-10">
                                    <div className="flex items-center justify-center w-10 h-10 
                                                    bg-gradient-to-br from-cyan-500 to-blue-500 
                                                    rounded-lg shadow-lg shadow-cyan-500/30">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">{formatDate(date)}</p>
                                        <p className="text-zinc-400 text-xs">{dateTasks.length} tasks</p>
                                    </div>
                                </div>

                                {/* Timeline Tasks */}
                                <div className="ml-5 border-l-2 border-zinc-700 pl-6 space-y-4">
                                    {dateTasks.map((task, index) => (
                                        <div key={index} className="relative group">

                                            {/* Timeline Dot */}
                                            <div className="absolute -left-[29px] top-2 w-4 h-4 bg-zinc-800 
                                                            border-2 border-cyan-500 rounded-full 
                                                            group-hover:border-cyan-400 
                                                            group-hover:shadow-[0_0_12px_#06b6d4] 
                                                            transition-all duration-300"></div>

                                            {/* Task Card */}
                                            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 
                                                            border border-zinc-600 
                                                            hover:border-cyan-500/50 
                                                            rounded-lg p-4 
                                                            transition-all duration-300 
                                                            hover:shadow-lg hover:shadow-cyan-500/10 
                                                            hover:translate-x-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-medium text-sm mb-2">
                                                            {task.task}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-cyan-400 text-xs">
                                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span>
                                                                {new Date(task.startTime).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="flex-shrink-0 px-2.5 py-1 bg-cyan-500/10 
                                                                    border border-cyan-500/30 
                                                                    rounded-md">
                                                        <span className="text-cyan-400 text-xs font-medium">Scheduled</span>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>

                            </div>
                        ))}

                    </div>
                )}
            </div>

        </div>
    );
};

export default UpcomingTasks;
