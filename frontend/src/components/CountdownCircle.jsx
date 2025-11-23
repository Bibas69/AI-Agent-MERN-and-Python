import React, { useEffect, useState } from 'react'

const CountdownCircle = ({ endTime, startTime, timeUp }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      const remainingTime = end - now;

      if (remainingTime < 0) {
        setTimeLeft(0);
        setProgress(0);
        clearInterval(timer);
      } else {
        setTimeLeft(remainingTime);
        const totalDuration = end - start;
        const remainingPercent = (remainingTime / totalDuration) * 100;
        setProgress(remainingPercent);
        setIsUrgent(remainingPercent < 20);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, startTime]);

  const hours = Math.floor(timeLeft / 1000 / 60 / 60);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  const formatTime = (value) => String(value).padStart(2, "0");

  // Responsive radius
  const radius = window.innerWidth < 380 ? 35 : window.innerWidth < 480 ? 40 : 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress === 0) return { primary: "#ef4444", secondary: "#991b1b", glow: "rgba(239, 68, 68, 0.3)" };
    if (isUrgent) return { primary: "#f97316", secondary: "#c2410c", glow: "rgba(249, 115, 22, 0.3)" };
    if (progress < 50) return { primary: "#eab308", secondary: "#a16207", glow: "rgba(234, 179, 8, 0.3)" };
    return { primary: "#10b981", secondary: "#047857", glow: "rgba(16, 185, 129, 0.3)" };
  };

  const colors = getColor();

  return (
    <div className="relative flex items-center justify-center">
      {/* SVG Circle (Responsive sizing) */}
      <svg
        className="
          w-20 h-20
          xs:w-24 xs:h-24
          sm:w-28 sm:h-28
          md:w-32 md:h-32
          -rotate-90
        "
        viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#27272a" strokeWidth="6" />

        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={`url(#gradient-${progress})`}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1s linear",
            filter: `drop-shadow(0 0 6px ${colors.glow})`,
          }}
        />

        <defs>
          <linearGradient id={`gradient-${progress}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
        </defs>
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className={`flex items-center gap-0.5 mb-1 ${
            isUrgent ? "animate-pulse" : ""
          }`}
        >
          {/* Time display */}
          {[hours, minutes, seconds].map((val, i) => (
            <React.Fragment key={i}>
              <span
                className="
                  text-xs xs:text-sm sm:text-base md:text-lg
                  font-bold leading-none
                "
                style={{ color: colors.primary }}
              >
                {formatTime(val)}
              </span>
              {i < 2 && <span className="text-slate-400 text-[10px] sm:text-xs font-bold">:</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Percent */}
        <div className="flex items-center gap-1">
          <div
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: colors.primary }}
          ></div>
          <span className="text-slate-400 text-[9px] xs:text-[10px] sm:text-xs font-medium">
            {Math.round(progress)}%
          </span>
          <div
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: colors.primary }}
          ></div>
        </div>
      </div>

      {/* Urgent pulse ring */}
      {isUrgent && progress > 0 && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ backgroundColor: colors.primary, animationDuration: "2s" }}
        ></div>
      )}

      {/* Completion icon */}
      {progress === 0 && !timeUp && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountdownCircle;
