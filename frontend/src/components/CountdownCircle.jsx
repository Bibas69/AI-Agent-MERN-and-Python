import React, { useEffect, useState } from 'react'

const CountdownCircle = ({endTime, startTime, timeUp}) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [progress, setProgress] = useState(100);
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(startTime).getTime();
            const end = new Date(endTime).getTime();
            const remainingTime = end-now;
            
            if(remainingTime<0){
                setTimeLeft(0);
                setProgress(0);
                clearInterval(timer);
            }
            else{
                setTimeLeft(remainingTime);
                const totalDuration = end-start;
                const remainingPercent = (remainingTime/totalDuration)*100;
                setProgress(remainingPercent);
                
                // Mark as urgent if less than 20% time remaining
                setIsUrgent(remainingPercent < 20);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [endTime, startTime]);

    const hours = Math.floor(timeLeft/1000/60/60);
    const minutes = Math.floor((timeLeft/1000/60)%60);
    const seconds = Math.floor((timeLeft/1000)%60);

    // Format time with leading zeros
    const formatTime = (value) => String(value).padStart(2, '0');

    // Calculate circle progress
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Dynamic colors based on progress
    const getColor = () => {
        if (progress === 0) return { primary: '#ef4444', secondary: '#991b1b', glow: 'rgba(239, 68, 68, 0.3)' };
        if (isUrgent) return { primary: '#f97316', secondary: '#c2410c', glow: 'rgba(249, 115, 22, 0.3)' };
        if (progress < 50) return { primary: '#eab308', secondary: '#a16207', glow: 'rgba(234, 179, 8, 0.3)' };
        return { primary: '#10b981', secondary: '#047857', glow: 'rgba(16, 185, 129, 0.3)' };
    };

    const colors = getColor();

    return (
        <div className='relative flex items-center justify-center'>
            {/* Circular SVG Progress */}
            <svg className='w-28 h-28 -rotate-90' viewBox='0 0 100 100'>
                {/* Background circle */}
                <circle
                    cx='50'
                    cy='50'
                    r={radius}
                    fill='none'
                    stroke='#27272a'
                    strokeWidth='6'
                />
                
                {/* Progress circle */}
                <circle
                    cx='50'
                    cy='50'
                    r={radius}
                    fill='none'
                    stroke={`url(#gradient-${progress})`}
                    strokeWidth='6'
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap='round'
                    style={{
                        transition: 'stroke-dashoffset 1s linear',
                        filter: `drop-shadow(0 0 6px ${colors.glow})`
                    }}
                />
                
                {/* Gradient definition */}
                <defs>
                    <linearGradient id={`gradient-${progress}`} x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor={colors.primary} />
                        <stop offset='100%' stopColor={colors.secondary} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Center content */}
            <div className='absolute inset-0 flex flex-col items-center justify-center'>
                {/* Time display */}
                <div className={`flex items-center gap-0.5 mb-1 ${isUrgent ? 'animate-pulse' : ''}`}>
                    <div className='flex flex-col items-center'>
                        <span className='text-white text-lg font-bold leading-none' style={{ color: colors.primary }}>
                            {formatTime(hours)}
                        </span>
                    </div>
                    <span className='text-slate-400 text-sm font-bold mb-0.5'>:</span>
                    <div className='flex flex-col items-center'>
                        <span className='text-white text-lg font-bold leading-none' style={{ color: colors.primary }}>
                            {formatTime(minutes)}
                        </span>
                    </div>
                    <span className='text-slate-400 text-sm font-bold mb-0.5'>:</span>
                    <div className='flex flex-col items-center'>
                        <span className='text-white text-lg font-bold leading-none' style={{ color: colors.primary }}>
                            {formatTime(seconds)}
                        </span>
                    </div>
                </div>

                {/* Progress percentage */}
                <div className='flex items-center gap-1'>
                    <div className='w-1 h-1 rounded-full' style={{ backgroundColor: colors.primary }}></div>
                    <span className='text-slate-400 text-[10px] font-medium'>
                        {Math.round(progress)}%
                    </span>
                    <div className='w-1 h-1 rounded-full' style={{ backgroundColor: colors.primary }}></div>
                </div>
            </div>

            {/* Pulse ring for urgent state */}
            {isUrgent && progress > 0 && (
                <div 
                    className='absolute inset-0 rounded-full animate-ping opacity-20'
                    style={{ 
                        backgroundColor: colors.primary,
                        animationDuration: '2s'
                    }}
                ></div>
            )}

            {/* Completion indicator */}
            {progress === 0 && !timeUp && (
                <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse'>
                        <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CountdownCircle