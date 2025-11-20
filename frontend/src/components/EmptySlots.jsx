import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import getBackendUrl from '../utils/getBackendUrl';
import axios from 'axios';

const EmptySlots = ({ refreshTrigger }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [slots, setSlots] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const fetchEmptySlots = useCallback(async () => {
        if (!currentUser?.uid) {
            setErrorMessage("User not found...");
            setLoading(false);
            return;
        }

        try {
            const now = new Date();
            const localISOString = new Date(
                now.getTime() - now.getTimezoneOffset() * 60000
            ).toISOString().slice(0, 19);

            const res = await axios.get(`${getBackendUrl()}/api/task/getFreeSlots`, {
                params: { uid: currentUser.uid, date: localISOString }
            });

            const today = new Date(now);
            today.setHours(23, 59, 59, 999);

            const availableSlots = (res.data.freeSlots || []).filter((slot) => {
                const end = new Date(slot.end).getTime();
                return end > now.getTime() && end <= today.getTime();
            });

            setSlots(availableSlots);
            setLastUpdate(new Date());
            setErrorMessage("");
        } catch (err) {
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    // Initial fetch
    useEffect(() => {
        fetchEmptySlots();
    }, [fetchEmptySlots]);

    // Auto-refresh every minute
    useEffect(() => {
        const interval = setInterval(() => {
            fetchEmptySlots();
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [fetchEmptySlots]);

    // Refresh when external trigger changes (e.g., new task added)
    useEffect(() => {
        if (refreshTrigger) {
            fetchEmptySlots();
        }
    }, [refreshTrigger, fetchEmptySlots]);

    const calculateDuration = (start, end) => {
        const diff = new Date(end) - new Date(start);
        const totalMinutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        if (hours > 0 && minutes > 0) {
            return { hours, minutes, display: `${hours}h ${minutes}m` };
        } else if (hours > 0) {
            return { hours, minutes: 0, display: `${hours}h` };
        } else {
            return { hours: 0, minutes, display: `${minutes}m` };
        }
    };

    const getDurationColor = (hours, minutes) => {
        const totalMinutes = hours * 60 + minutes;
        if (totalMinutes >= 180) return 'from-emerald-500 via-green-500 to-teal-500';
        if (totalMinutes >= 120) return 'from-green-500 via-emerald-500 to-cyan-500';
        if (totalMinutes >= 60) return 'from-blue-500 via-cyan-500 to-sky-500';
        if (totalMinutes >= 30) return 'from-orange-500 via-amber-500 to-yellow-500';
        return 'from-rose-500 via-pink-500 to-red-500';
    };

    const getDurationIcon = (hours, minutes) => {
        const totalMinutes = hours * 60 + minutes;
        if (totalMinutes >= 120) {
            return (
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
            );
        }
        if (totalMinutes >= 60) {
            return (
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
                </svg>
            );
        }
        return (
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
            </svg>
        );
    };

    const getSlotIndex = (index) => String(index + 1).padStart(2, '0');

    const formatLastUpdate = () => {
        const now = new Date();
        const diff = Math.floor((now - lastUpdate) / 1000);
        if (diff < 60) return 'Just now';
        return `${Math.floor(diff / 60)}m ago`;
    };

    if (loading) {
        return (
            <div className="w-80 h-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/60 p-6 backdrop-blur-sm">
                <div className='flex items-center gap-3 mb-6'>
                    <div className='relative'>
                        <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30'>
                            <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                        </div>
                        <div className='absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-ping'></div>
                    </div>
                    <div className='flex-1'>
                        <p className='text-white text-lg font-bold'>Available Time</p>
                        <p className='text-slate-400 text-xs'>Checking your schedule...</p>
                    </div>
                </div>
                <div className='flex items-center justify-center h-64'>
                    <div className='flex flex-col items-center gap-4'>
                        <div className='relative'>
                            <div className='w-16 h-16 border-4 border-slate-700/30 rounded-full'></div>
                            <div className='absolute top-0 left-0 w-16 h-16 border-4 border-t-blue-500 border-r-cyan-500 border-b-transparent border-l-transparent rounded-full animate-spin'></div>
                        </div>
                        <p className='text-slate-400 text-sm font-medium'>Scanning schedule...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="w-80 h-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/60 p-6">
                <div className='flex items-center gap-3 mb-6'>
                    <div className='w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30'>
                        <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                    </div>
                    <div className='flex-1'>
                        <p className='text-white text-lg font-bold'>Available Time</p>
                        <p className='text-slate-400 text-xs'>Error occurred</p>
                    </div>
                </div>
                <div className='bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-3'>
                    <svg className='w-6 h-6 text-red-400 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                    </svg>
                    <div>
                        <p className='text-red-300 text-sm font-semibold mb-1'>Failed to Load Slots</p>
                        <p className='text-red-400/80 text-xs'>{errorMessage}</p>
                    </div>
                </div>
                <button 
                    onClick={fetchEmptySlots}
                    className='mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-lg shadow-red-500/20'
                >
                    Retry
                </button>
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <div className="w-80 h-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/60 p-6">
                <div className='flex items-center gap-3 mb-6'>
                    <div className='w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center'>
                        <svg className='w-6 h-6 text-slate-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                    </div>
                    <div className='flex-1'>
                        <p className='text-white text-lg font-bold'>Available Time</p>
                        <p className='text-slate-400 text-xs'>Today's schedule</p>
                    </div>
                </div>
                <div className='flex flex-col items-center justify-center h-64 gap-6'>
                    <div className='relative'>
                        <div className='w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center border border-slate-700 shadow-xl'>
                            <svg className='w-12 h-12 text-slate-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                            </svg>
                        </div>
                        <div className='absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/40'>
                            <svg className='w-5 h-5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
                            </svg>
                        </div>
                    </div>
                    <div className='text-center'>
                        <p className='text-slate-200 text-base font-semibold mb-2'>Fully Scheduled</p>
                        <p className='text-slate-500 text-sm'>No free time slots remaining today</p>
                    </div>
                </div>
                <div className='mt-4 text-center text-xs text-slate-600'>
                    Updated {formatLastUpdate()}
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 h-96 backdrop-blur-xl bg-slate-900/30 border border-slate-700/40 rounded-3xl shadow-2xl shadow-black/60 p-6 flex flex-col">
            <div className='flex items-center justify-between mb-5'>
                <div className='flex items-center gap-3'>
                    <div className='relative'>
                        <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30'>
                            <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                        </div>
                        <div className='absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50'></div>
                    </div>
                    <div>
                        <p className='text-white text-lg font-bold'>Available Time</p>
                        <p className='text-slate-400 text-xs'>{formatLastUpdate()}</p>
                    </div>
                </div>
                <div className='px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl shadow-lg shadow-green-500/10'>
                    <p className='text-green-400 text-sm font-bold'>{slots.length}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600">
                {slots.map((slot, index) => {
                    const duration = calculateDuration(slot.start, slot.end);
                    const colorClass = getDurationColor(duration.hours, duration.minutes);
                    
                    return (
                        <div 
                            key={index} 
                            className="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/40 rounded-2xl border border-slate-700/50 hover:border-slate-600/70 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40"
                        >
                            <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${colorClass} shadow-lg`}></div>
                            
                            <div className='p-4 pl-5'>
                                <div className='flex items-start justify-between mb-3'>
                                    <div className='flex items-center gap-2'>
                                        <span className='text-slate-500 text-xs font-mono font-semibold'>#{getSlotIndex(index)}</span>
                                        <div className='w-1.5 h-1.5 bg-slate-600 rounded-full'></div>
                                        <span className='text-slate-400 text-xs font-medium'>Free Period</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${colorClass} rounded-xl shadow-lg`}>
                                        <div className='text-white opacity-90'>
                                            {getDurationIcon(duration.hours, duration.minutes)}
                                        </div>
                                        <p className='text-white text-xs font-bold'>{duration.display}</p>
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <div className='flex items-center gap-3'>
                                        <div className='flex-1 bg-slate-900/70 rounded-xl p-3 border border-slate-700/40 shadow-inner'>
                                            <div className='flex items-center gap-2 mb-1'>
                                                <svg className='w-3.5 h-3.5 text-green-400' fill='currentColor' viewBox='0 0 20 20'>
                                                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                                                </svg>
                                                <p className='text-slate-500 text-[10px] uppercase tracking-wider font-semibold'>Start</p>
                                            </div>
                                            <p className='text-white text-base font-bold tracking-tight'>
                                                {new Date(slot.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>

                                        <div className='flex-shrink-0'>
                                            <div className='w-8 h-8 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center'>
                                                <svg className='w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M13 7l5 5m0 0l-5 5m5-5H6' />
                                                </svg>
                                            </div>
                                        </div>

                                        <div className='flex-1 bg-slate-900/70 rounded-xl p-3 border border-slate-700/40 shadow-inner'>
                                            <div className='flex items-center gap-2 mb-1'>
                                                <svg className='w-3.5 h-3.5 text-red-400' fill='currentColor' viewBox='0 0 20 20'>
                                                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                                                </svg>
                                                <p className='text-slate-500 text-[10px] uppercase tracking-wider font-semibold'>End</p>
                                            </div>
                                            <p className='text-white text-base font-bold tracking-tight'>
                                                {new Date(slot.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-300 pointer-events-none`}></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EmptySlots;