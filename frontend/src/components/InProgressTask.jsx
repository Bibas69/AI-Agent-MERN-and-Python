import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios';
import getBackendUrl from '../utils/getBackendUrl';
import CountdownCircle from './CountdownCircle';

const InProgressTask = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [timeUp, setTimeUp] = useState(false);
    const [taskInProgress, setTaskInProgress] = useState(false);

    const fetchInProgressTask = async () => {
        try{
            const now = new Date();
            const res = await axios.get(`${getBackendUrl()}/api/task/getTaskBySingleDate`, {
                params: {uid: currentUser.uid, date: new Date(now)}
            })
            const inProgressTask = res.data.tasks.filter((task) => new Date(task.endTime)>now && new Date(task.startTime)<now && task.status==="inprogress");
            setTask(inProgressTask || []);
        }
        catch(err){
            setErrorMessage(err.message);
        }
        finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        if(!currentUser){
            setErrorMessage("User not found...");
            setLoading(false);
            return () => {};
        }
        fetchInProgressTask();
        const interval = setInterval(fetchInProgressTask, 5000);
        return () => clearInterval(interval);
    }, [currentUser]);


    const finishTask = async () => {
        const taskId = task[0]._id;
        const res = await axios.patch(`${getBackendUrl()}/api/task/updateStatus/${taskId}`, {
            uid: currentUser.uid,
            taskStatus: "completed"
        })
        if(res.data.success === false) return setErrorMessage(res.data.message);
        await fetchInProgressTask();
    }

    const cancelTask = async () => {
        const taskId = task[0]._id;
        const res = await axios.patch(`${getBackendUrl()}/api/task/updateStatus/${taskId}`, {
            uid: currentUser.uid,
            taskStatus: "cancelled"
        })
        if(res.data.success === false) return setErrorMessage(res.data.message);
        await fetchInProgressTask();
    }
    
    useEffect(() => {
        if(!task || task.length === 0) return;
        const handleTimeUp = () => {
            const now = new Date().getTime();
            const taskEnd = new Date(task[0].endTime).getTime()
            if(now>=taskEnd+30000){
                setTimeUp(true);
            }
        }
        const interval = setInterval(handleTimeUp, 10000);
        return () => clearInterval(interval);
    }, [currentUser, task]);

    
    if(loading){
        return(
            <div className='w-140 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl border border-zinc-700 shadow-lg shadow-black/40 p-6'>
                <div className='flex items-center gap-3 mb-4'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse'></div>
                    <p className='text-white text-lg font-semibold tracking-wide'>Task in Progress</p>
                </div>
                <div className='flex items-center justify-center py-8'>
                    <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 border-3 border-t-blue-500 border-r-blue-500/30 border-b-blue-500/30 border-l-blue-500/30 rounded-full animate-spin'></div>
                        <p className='text-zinc-400'>Loading task...</p>
                    </div>
                </div>
            </div>
        )
    }

    if(errorMessage){
        return(
            <div className='w-140 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl border border-zinc-700 shadow-lg shadow-black/40 p-6'>
                <div className='flex items-center gap-3 mb-4'>
                    <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                    <p className='text-white text-lg font-semibold tracking-wide'>Task in Progress</p>
                </div>
                <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3'>
                    <svg className='w-5 h-5 text-red-400 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    <p className='text-red-300 text-sm'>{errorMessage}</p>
                </div>
            </div>
        )
    }

    if(task.length===0){
        return(
            <div className='w-140 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl border border-zinc-700 shadow-lg shadow-black/40 p-6'>
                <div className='flex items-center gap-3 mb-4'>
                    <div className='w-2 h-2 bg-zinc-500 rounded-full'></div>
                    <p className='text-white text-lg font-semibold tracking-wide'>Task in Progress</p>
                </div>
                <div className='flex flex-col items-center justify-center py-8 gap-4'>
                    <div className='w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-600'>
                        <svg className='w-8 h-8 text-zinc-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                    </div>
                    <p className='text-zinc-400 text-sm'>No task in progress currently</p>
                    <p className='text-zinc-500 text-xs'>Start a task to see it here</p>
                </div>
            </div>
        )
    }

  return (
    <div className='w-140 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl border border-zinc-700 shadow-lg shadow-black/40 p-6'>
        <div className='flex items-center gap-3 mb-6'>
            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]'></div>
            <p className='text-white text-lg font-semibold tracking-wide'>Task in Progress</p>
        </div>
        
        <div className='w-full flex flex-col gap-6'>
            {/* Task Card */}
            <div className='w-full bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-600 hover:border-zinc-500 hover:shadow-lg hover:shadow-black/30 transition-all duration-300 rounded-lg p-5 flex justify-between items-center gap-4'>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-3'>
                        <div className='w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full'></div>
                        <p className='text-white font-semibold text-lg truncate'>{task[0].task}</p>
                    </div>
                    <div className='flex items-center gap-2 text-zinc-400 text-sm'>
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                        <span>Started at {new Date(task[0].startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                </div>
                
                {/* Countdown Circle */}
                <div className='flex-shrink-0'>
                    <CountdownCircle endTime={task[0].endTime} startTime={task[0].startTime} timeUp={timeUp}/>
                </div>
            </div>

            {/* Action Buttons */}
            <div className='w-full flex items-center justify-center gap-4'>
                <button 
                    onClick={finishTask} 
                    className='group flex-1 max-w-[200px] h-11 bg-green-500/10 border border-green-500 rounded-lg text-green-400 font-medium hover:bg-green-500 hover:text-white hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 flex items-center justify-center gap-2'
                >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    <span>Finish</span>
                </button>
                
                <button 
                    onClick={cancelTask} 
                    className='group flex-1 max-w-[200px] h-11 bg-red-500/10 border border-red-500 rounded-lg text-red-400 font-medium hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 flex items-center justify-center gap-2'
                >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                    <span>Cancel</span>
                </button>
            </div>
        </div>
    </div>
  )
}

export default InProgressTask