import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios';
import getBackendUrl from '../utils/getBackendUrl';
import { CheckCircle, Clock, XCircle, Play, Calendar, Filter, Sparkles } from 'lucide-react';

const TaskCard = ({tasks, taskState}) => {
    if(!tasks || tasks.length<=0){
        return (
            <div className='w-full flex flex-col items-center justify-center py-12 px-4 animate-fade-in'>
                <div className='bg-slate-900/30 rounded-xl p-6 text-center border border-slate-700/30 hover:border-slate-600/40 transition-all duration-300 hover:scale-105'>
                    <div className='w-14 h-14 bg-slate-800/40 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse'>
                        <Calendar className='w-7 h-7 text-slate-500' />
                    </div>
                    <p className='text-slate-300 text-sm font-medium'>No tasks found</p>
                    <p className='text-slate-500 text-xs mt-1'>Create tasks to get started</p>
                </div>
            </div>
        )
    }
    
    const filteredTasks = tasks
    .filter((task) => task.status === taskState)
    .reduce((groups, task) => {
        const date = new Date(task.startTime).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        if(!groups[date]){
            groups[date] = [];
        }
        groups[date].push(task);
        return groups;
    }, {})

    const getStatusColor = (status) => {
        switch(status) {
            case 'completed': return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
            case 'incomplete': return 'bg-amber-500/20 border-amber-500/40 text-amber-300';
            case 'cancelled': return 'bg-red-500/20 border-red-500/40 text-red-300';
            case 'inprogress': return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
            default: return 'bg-slate-500/20 border-slate-500/40 text-slate-300';
        }
    }

    const getStatusIcon = (status) => {
        switch(status) {
            case 'completed': return <CheckCircle className='w-3.5 h-3.5' />;
            case 'incomplete': return <Clock className='w-3.5 h-3.5' />;
            case 'cancelled': return <XCircle className='w-3.5 h-3.5' />;
            case 'inprogress': return <Play className='w-3.5 h-3.5' />;
            default: return <Clock className='w-3.5 h-3.5' />;
        }
    }

    return(
        <div className='w-full space-y-4'>
            {
                Object.entries(filteredTasks).map(([date, tasks], dateIdx) => (
                    <div 
                        key={date} 
                        className='space-y-3 animate-slide-in'
                        style={{ animationDelay: `${dateIdx * 100}ms` }}
                    >
                        <div className='flex items-center gap-2.5 px-0.5 group'>
                            <div className='w-7 h-7 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-lg flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform duration-300'>
                                <Calendar className='w-4 h-4 text-blue-400' />
                            </div>
                            <h3 className='text-sm font-semibold text-slate-300 group-hover:text-white transition-colors duration-300'>{date}</h3>
                            <div className='h-px flex-1 bg-gradient-to-r from-slate-700/40 to-transparent'></div>
                        </div>
                        <div className='space-y-2.5'>
                            {tasks.map((task, idx) => (
                                <div 
                                    key={idx}
                                    className='group relative bg-slate-900/30 rounded-lg p-3.5 border border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-900/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 animate-fade-in-up cursor-pointer'
                                    style={{ animationDelay: `${(dateIdx * 100) + (idx * 50)}ms` }}
                                >
                                    <div className='absolute inset-0 bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 rounded-lg transition-all duration-500'></div>
                                    
                                    <div className='relative flex items-start justify-between gap-3'>
                                        <div className='flex-1 space-y-2'>
                                            <h4 className='text-sm font-medium text-white leading-relaxed group-hover:text-blue-100 transition-colors duration-300'>{task.task}</h4>
                                            <div className='flex items-center gap-2 flex-wrap'>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(task.status)} hover:scale-105 transition-transform duration-200`}>
                                                    {getStatusIcon(task.status)}
                                                    <span className='text-xs'>{task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
                                                </span>
                                                <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/40 text-slate-400 border border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/60 transition-all duration-200'>
                                                    <Clock className='w-3.5 h-3.5' />
                                                    <span className='text-xs'>{task.duration}m</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>   
                ))
            }
        </div>
    )
}

const ViewAllTasks = () => {
    const {currentUser} = useAuth();
    const [taskState, setTaskState] = useState("completed");
    const [viewAll, setViewAll] = useState(false);
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        if(!currentUser) return;
        let fetchTask;
        if(!viewAll){
            fetchTask = async () => {
                const res = await axios.get(`${getBackendUrl()}/api/task/getTaskBySingleDate`, {
                    params: {
                        uid: currentUser.uid,
                        date: new Date().toISOString().split("T")[0]
                    }
                })
                if(res.data.tasks.length<=0){
                    return setTasks([]);
                }
                setTasks(res.data.tasks);
            }
        }
        else{
            fetchTask = async () => {
                const res = await axios.get(`${getBackendUrl()}/api/task/all`, {
                    params: {
                        uid: currentUser.uid
                    }
                })
                if(res.data.tasks.length<=0){
                    return setTasks([]);
                }
                setTasks(res.data.tasks);
            }
        }
        fetchTask();
        const interval = setInterval(fetchTask, 5000);
        return () => clearInterval(interval);
    }, [currentUser, viewAll])

    const statusFilters = [
        { value: 'completed', label: 'Completed', icon: CheckCircle, gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/30' },
        { value: 'inprogress', label: 'In Progress', icon: Play, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
        { value: 'incomplete', label: 'Incomplete', icon: Clock, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30' },
        { value: 'cancelled', label: 'Cancelled', icon: XCircle, gradient: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/30' }
    ];

    const getFilterClass = (filter) => {
        const baseClass = 'relative overflow-hidden px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-sm';
        if (taskState === filter.value) {
            return `${baseClass} bg-gradient-to-r ${filter.gradient} text-white shadow-lg ${filter.shadow} scale-105`;
        }
        return `${baseClass} bg-slate-800/40 text-slate-400 border border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/70 hover:scale-105`;
    };

    return (
        <div className='w-full max-w-[780px] h-[500px] lg:h-[600px] bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl border border-zinc-700 shadow-2xl shadow-black/60 p-4 sm:p-6 flex flex-col animate-fade-in'>
            {/* Header */}
            <div className='flex items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-700/50'>
                <div className='flex items-center gap-2 sm:gap-3'>
                    <div className='relative'>
                        <div className='w-9 sm:w-10 h-9 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 animate-gradient-shift'>
                            <svg className='w-4 sm:w-5 h-4 sm:h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
                            </svg>
                        </div>
                        <div className='absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping'></div>
                    </div>
                    <div>
                        <h1 className='text-sm sm:text-base font-bold text-white'>Task Manager</h1>
                        <p className='text-slate-400 text-xs hidden sm:block'>Track your tasks efficiently</p>
                    </div>
                </div>
                <button 
                    onClick={() => setViewAll(!viewAll)}
                    className='relative group/btn px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white font-semibold overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm'
                >
                    <div className='absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300'></div>
                    <Filter className='w-3.5 sm:w-4 h-3.5 sm:h-4 relative z-10' />
                    <span className='relative z-10'>{viewAll ? 'Today' : 'View All'}</span>
                    <div className='absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent'></div>
                </button>
            </div>

            {/* Status Filter */}
            <div className='py-4 sm:py-5 border-b border-slate-700/50'>
                <div className='flex items-center gap-2 sm:gap-2.5 mb-3'>
                    <svg className='w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' />
                    </svg>
                    <p className='text-white text-xs sm:text-sm font-semibold'>Filter Status</p>
                </div>
                <div className='flex items-center gap-2 flex-wrap'>
                    {statusFilters.map((filter, idx) => (
                        <button 
                            key={filter.value}
                            onClick={() => setTaskState(filter.value)}
                            className={getFilterClass(filter)}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <filter.icon className='w-3.5 sm:w-4 h-3.5 sm:h-4' />
                            <span className='hidden sm:inline'>{filter.label}</span>
                            <span className='sm:hidden text-xs'>{filter.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Task List - Scrollable */}
            <div className='flex-1 overflow-y-auto pt-4 sm:pt-5 pr-1 sm:pr-2 custom-scrollbar'>
                <TaskCard tasks={tasks} taskState={taskState}/>
            </div>

            {/* Custom Scrollbar & Animation Styles */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes gradientShift {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }

                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }

                .animate-slide-in {
                    animation: slideIn 0.6s ease-out forwards;
                    opacity: 0;
                }

                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                    opacity: 0;
                }

                .animate-gradient-shift {
                    background-size: 200% 200%;
                    animation: gradientShift 3s ease infinite;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 7px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(51, 65, 85, 0.2);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(71, 85, 105, 0.5);
                    border-radius: 4px;
                    transition: background 0.3s ease;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(71, 85, 105, 0.8);
                }

                @media (max-width: 640px) {
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 5px;
                    }
                }
            `}</style>
        </div>
    )
}

export default ViewAllTasks