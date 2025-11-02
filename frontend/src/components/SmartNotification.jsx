import axios from 'axios'
import React, { useEffect, useState } from 'react'
import getBackendUrl from '../utils/getBackendUrl'
import { useAuth } from '../context/AuthContext'

const SmartNotification = () => {
    const { currentUser } = useAuth();
    const [message, setMessage] = useState("");
    const [tasks, setTasks] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if(!currentUser.uid) return;
        const fetchTasks = async () => {
            const now = new Date();
            try{
                let date = new Date().toLocaleDateString();
                const res = await axios.get(`${getBackendUrl()}/api/task/getTaskBySingleDate`, {
                    params: {
                        uid: currentUser.uid,
                        date: date
                    }
                })
                const filteredTasks = res.data.tasks.filter((task) => (
                    new Date(task.startTime).getTime() >= new Date(now).getTime()
                ))
                setTasks(filteredTasks || []);
            }
            catch(err){
                setMessage(err.message);
            }
            finally{
                setLoading(false);
            }
        }
        fetchTasks();
        const interval = setInterval(fetchTasks, 5000);
        return () => clearInterval(interval);
    }, [currentUser]);

    useEffect(() => {
        if(tasks.length === 0 || isPaused) return;
        const interval = setInterval(() => {
            setCurrentIndex(prevIndex => (
                prevIndex+1 < tasks.length ? prevIndex+1 : 0
            ));
        }, 5000);
        return () => clearInterval(interval);
    }, [tasks, isPaused])

    const currentTask = tasks[currentIndex];
    const currentTaskDate = new Date(currentTask?.startTime) || null;
    const currentTaskTime = currentTaskDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

    const previous = () => {
        setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : tasks.length - 1);
    }

    const next = () => {
        setCurrentIndex(currentIndex + 1 < tasks.length ? currentIndex + 1 : 0);
    }

    if(loading){
        return(
            <div className='w-140 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl border border-zinc-700 shadow-lg shadow-black/40 p-6'>
                <div className='flex items-center gap-3 mb-4'>
                    <svg className='w-5 h-5 text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
                    </svg>
                    <p className='text-white text-lg font-semibold tracking-wide'>Smart Notification</p>
                </div>
                <div className='flex items-center justify-center py-12'>
                    <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 border-3 border-t-blue-500 border-r-blue-500/30 border-b-blue-500/30 border-l-blue-500/30 rounded-full animate-spin'></div>
                        <p className='text-zinc-400'>Loading notifications...</p>
                    </div>
                </div>
            </div>
        )
    }

    if(message){
        return(
            <div className='w-140 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl border border-zinc-700 shadow-lg shadow-black/40 p-6'>
                <div className='flex items-center gap-3 mb-4'>
                    <svg className='w-5 h-5 text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
                    </svg>
                    <p className='text-white text-lg font-semibold tracking-wide'>Smart Notification</p>
                </div>
                <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3'>
                    <svg className='w-5 h-5 text-red-400 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    <p className='text-red-300 text-sm'>{message}</p>
                </div>
            </div>
        )
    }

  return (
    <div className='w-140 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl border border-zinc-700 shadow-lg shadow-black/40 p-6'>
        <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-3'>
                <div className='relative'>
                    <svg className='w-5 h-5 text-purple-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
                    </svg>
                    {tasks.length > 0 && (
                        <div className='absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]'></div>
                    )}
                </div>
                <p className='text-white text-lg font-semibold tracking-wide'>Smart Notification</p>
            </div>
            {tasks.length > 0 && (
                <div className='flex items-center gap-2'>
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className='w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-700/50 hover:bg-zinc-600/50 border border-zinc-600 hover:border-zinc-500 transition-all duration-300'
                        title={isPaused ? 'Resume' : 'Pause'}
                    >
                        {isPaused ? (
                            <svg className='w-4 h-4 text-zinc-300' fill='currentColor' viewBox='0 0 24 24'>
                                <path d='M8 5v14l11-7z' />
                            </svg>
                        ) : (
                            <svg className='w-4 h-4 text-zinc-300' fill='currentColor' viewBox='0 0 24 24'>
                                <path d='M6 4h4v16H6V4zm8 0h4v16h-4V4z' />
                            </svg>
                        )}
                    </button>
                    <span className='text-xs text-zinc-500'>{currentIndex + 1}/{tasks.length}</span>
                </div>
            )}
        </div>

        <div className='flex flex-col items-center gap-6'>
            {tasks.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-8 gap-4'>
                    <div className='w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-600'>
                        <svg className='w-8 h-8 text-zinc-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
                        </svg>
                    </div>
                    <p className='text-zinc-400 text-sm text-center'>No tasks scheduled for today</p>
                    <p className='text-zinc-500 text-xs'>Add tasks to receive notifications</p>
                </div>
            ) : currentTask ? (
                <>
                    {/* Task Card */}
                    <div 
                        key={currentIndex} 
                        className='w-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/30 rounded-lg p-5 transition-all duration-500 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 animate-fadeIn'
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        <div className='flex items-start gap-4'>
                            <div className='flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30'>
                                <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                </svg>
                            </div>
                            <div className='flex-1 min-w-0'>
                                <p className='text-white font-medium text-base mb-2 leading-relaxed'>{currentTask.task}</p>
                                <div className='flex items-center gap-2 text-purple-300 text-sm'>
                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                                    </svg>
                                    <span>Scheduled at {currentTaskTime}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className='w-full flex items-center justify-between gap-4'>
                        <button 
                            className='group flex items-center justify-center gap-2 px-6 h-10 bg-purple-500/10 border border-purple-500 rounded-lg text-purple-400 font-medium hover:bg-purple-500 hover:text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-500/10 disabled:hover:text-purple-400'
                            onClick={previous}
                            disabled={tasks.length <= 1}
                        >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                            </svg>
                            <span className='text-sm'>Previous</span>
                        </button>

                        {/* Progress Dots */}
                        {tasks.length > 1 && (
                            <div className='flex items-center gap-2'>
                                {tasks.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`transition-all duration-300 rounded-full ${
                                            idx === currentIndex 
                                                ? 'w-8 h-2 bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_8px_#a855f7]' 
                                                : 'w-2 h-2 bg-zinc-600 hover:bg-zinc-500'
                                        }`}
                                    ></button>
                                ))}
                            </div>
                        )}

                        <button 
                            className='group flex items-center justify-center gap-2 px-6 h-10 bg-purple-500/10 border border-purple-500 rounded-lg text-purple-400 font-medium hover:bg-purple-500 hover:text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-500/10 disabled:hover:text-purple-400'
                            onClick={next}
                            disabled={tasks.length <= 1}
                        >
                            <span className='text-sm'>Next</span>
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                            </svg>
                        </button>
                    </div>
                </>
            ) : (
                <div className='flex items-center justify-center py-12'>
                    <p className='text-zinc-400'>Loading task...</p>
                </div>
            )}
        </div>
    </div>
  )
}

export default SmartNotification