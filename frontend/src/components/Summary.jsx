import React, { useEffect, useState } from "react";
import axios from "axios";
import getBackendUrl from "../utils/getBackendUrl";
import { useAuth } from "../context/AuthContext";

const Summary = () => {
  const [tasks, setTasks] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchTasks = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const now = new Date();      
      const res = await axios.get(`${getBackendUrl()}/api/task/getTaskBySingleDate`, {
        params: { uid: currentUser.uid, date: now },
      });
      
      if (res.data.success && res.data.tasks) {
        setTasks(res.data.tasks);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Calculate statistics (treating inprogress as incomplete)
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const cancelledCount = tasks.filter((t) => t.status === "cancelled").length;
  const incompleteCount = tasks.filter((t) => t.status === "incomplete" || t.status === "inprogress").length;
  const comingSoonCount = tasks.filter((t) => t.status === "coming-soon").length;

  // Calculate degrees for each segment
  const completedDeg = totalTasks ? (completedCount / totalTasks) * 360 : 0;
  const cancelledDeg = totalTasks ? (cancelledCount / totalTasks) * 360 : 0;
  const incompleteDeg = totalTasks ? (incompleteCount / totalTasks) * 360 : 0;
  const comingSoonDeg = totalTasks ? (comingSoonCount / totalTasks) * 360 : 0;

  // Calculate percentages
  const completedPercent = totalTasks ? Math.round((completedCount / totalTasks) * 100) : 0;
  const cancelledPercent = totalTasks ? Math.round((cancelledCount / totalTasks) * 100) : 0;
  const incompletePercent = totalTasks ? Math.round((incompleteCount / totalTasks) * 100) : 0;
  const comingSoonPercent = totalTasks ? Math.round((comingSoonCount / totalTasks) * 100) : 0;

  // Handle mouse movement for hover detection
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    
    const distance = Math.sqrt(x * x + y * y);
    const outerRadius = rect.width / 2;
    const innerRadius = outerRadius * 0.57;
    
    if (distance < innerRadius || distance > outerRadius) {
      setHovered(null);
      return;
    }
    
    let angle = Math.atan2(x, -y) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    
    if (completedDeg > 0 && angle < completedDeg) {
      setHovered("completed");
    } else if (cancelledDeg > 0 && angle < completedDeg + cancelledDeg) {
      setHovered("cancelled");
    } else if (incompleteDeg > 0 && angle < completedDeg + cancelledDeg + incompleteDeg) {
      setHovered("incomplete");
    } else if (comingSoonDeg > 0) {
      setHovered("coming-soon");
    } else {
      setHovered(null);
    }
  };

  // Get display values based on hover state
  const getDisplayCount = () => {
    if (hovered === "completed") return completedCount;
    if (hovered === "cancelled") return cancelledCount;
    if (hovered === "incomplete") return incompleteCount;
    if (hovered === "coming-soon") return comingSoonCount;
    return totalTasks;
  };

  const getDisplayLabel = () => {
    if (hovered === "completed") return `${completedPercent}% Complete`;
    if (hovered === "cancelled") return `${cancelledPercent}% Cancelled`;
    if (hovered === "incomplete") return `${incompletePercent}% Incomplete`;
    if (hovered === "coming-soon") return `${comingSoonPercent}% Coming Soon`;
    return "Total Tasks";
  };

  const getTextColor = () => {
    if (hovered === "completed") return "text-green-400";
    if (hovered === "cancelled") return "text-red-400";
    if (hovered === "incomplete") return "text-purple-400";
    if (hovered === "coming-soon") return "text-blue-400";
    return "text-white";
  };

  const getSubtextColor = () => {
    if (hovered === "completed") return "text-green-300";
    if (hovered === "cancelled") return "text-red-300";
    if (hovered === "incomplete") return "text-purple-300";
    if (hovered === "coming-soon") return "text-blue-300";
    return "text-zinc-400";
  };

  const getRingStyle = () => {
    if (hovered === "completed") return "ring-2 ring-green-400/70 shadow-[0_0_25px_#22c55e]";
    if (hovered === "cancelled") return "ring-2 ring-red-400/70 shadow-[0_0_25px_#ef4444]";
    if (hovered === "incomplete") return "ring-2 ring-purple-400/70 shadow-[0_0_25px_#a855f7]";
    if (hovered === "coming-soon") return "ring-2 ring-blue-400/70 shadow-[0_0_25px_#3b82f6]";
    return "ring-1 ring-zinc-700/50";
  };

  const getBoxShadow = () => {
    if (totalTasks === 0) return "none";
    if (hovered === "completed") return "0 0 40px rgba(34, 197, 94, 0.5), inset 0 0 15px rgba(255,255,255,0.15)";
    if (hovered === "cancelled") return "0 0 40px rgba(239, 68, 68, 0.5), inset 0 0 15px rgba(255,255,255,0.15)";
    if (hovered === "incomplete") return "0 0 40px rgba(168, 85, 247, 0.5), inset 0 0 15px rgba(255,255,255,0.15)";
    if (hovered === "coming-soon") return "0 0 40px rgba(59, 130, 246, 0.5), inset 0 0 15px rgba(255,255,255,0.15)";
    return "0 0 30px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.1)";
  };

  const getConicGradient = () => {
    if (!totalTasks) return "#27272A";
    
    const colors = [
      `${hovered === "completed" ? "#34d399" : "#22c55e"} 0deg ${completedDeg}deg`,
      `${hovered === "cancelled" ? "#f87171" : "#ef4444"} ${completedDeg}deg ${completedDeg + cancelledDeg}deg`,
      `${hovered === "incomplete" ? "#c084fc" : "#a855f7"} ${completedDeg + cancelledDeg}deg ${completedDeg + cancelledDeg + incompleteDeg}deg`,
      `${hovered === "coming-soon" ? "#60a5fa" : "#3b82f6"} ${completedDeg + cancelledDeg + incompleteDeg}deg 360deg`
    ];
    
    return `conic-gradient(${colors.join(", ")})`;
  };

  return (
    <div className="w-72 h-auto bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl border border-zinc-700 shadow-lg shadow-black/40 p-4 flex flex-col items-center gap-6">
      <p className="text-white text-lg font-semibold tracking-wide">
        Today's Summary
      </p>

      <div 
        className="relative w-52 h-52 flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Donut chart with hover effects */}
        <div
          className="absolute w-full h-full rounded-full transition-all duration-300"
          style={{
            background: getConicGradient(),
            boxShadow: getBoxShadow(),
            transform: hovered ? "scale(1.02)" : "scale(1)",
            cursor: totalTasks > 0 ? "pointer" : "default",
          }}
        />

        {/* Inner donut hole */}
        <div
          className={`absolute rounded-full shadow-inner transition-all duration-300 ${getRingStyle()}`}
          style={{
            width: "57%",
            height: "57%",
            backgroundColor: "#18181b",
          }}
        />

        {/* Center content */}
        <div className="absolute text-center transition-all duration-300 pointer-events-none px-2">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
              <p className="text-zinc-400 text-xs">Loading...</p>
            </div>
          ) : totalTasks > 0 ? (
            <>
              <p className={`text-xl font-bold transition-colors duration-200 ${getTextColor()}`}>
                {getDisplayCount()}
              </p>
              <p className={`text-xs font-medium mt-1 transition-colors duration-200 ${getSubtextColor()}`}>
                {getDisplayLabel()}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg 
                className="w-10 h-10 text-zinc-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-zinc-400 text-xs text-center leading-tight">
                Add tasks to<br />view summary
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="w-full grid grid-cols-2 gap-x-4 gap-y-3 mt-2 px-2">
        <div className="flex flex-col items-center gap-1 transition-transform duration-200 hover:scale-110">
          <div className="w-4 h-4 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]" />
          <p className="text-zinc-300 text-xs font-medium">Complete</p>
          {totalTasks > 0 && (
            <p className="text-green-400 text-xs font-semibold">{completedPercent}%</p>
          )}
        </div>
        
        <div className="flex flex-col items-center gap-1 transition-transform duration-200 hover:scale-110">
          <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" />
          <p className="text-zinc-300 text-xs font-medium">Cancelled</p>
          {totalTasks > 0 && (
            <p className="text-red-400 text-xs font-semibold">{cancelledPercent}%</p>
          )}
        </div>
        
        <div className="flex flex-col items-center gap-1 transition-transform duration-200 hover:scale-110">
          <div className="w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_#a855f7]" />
          <p className="text-zinc-300 text-xs font-medium">Incomplete</p>
          {totalTasks > 0 && (
            <p className="text-purple-400 text-xs font-semibold">{incompletePercent}%</p>
          )}
        </div>
        
        <div className="flex flex-col items-center gap-1 transition-transform duration-200 hover:scale-110">
          <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
          <p className="text-zinc-300 text-xs font-medium">Coming Soon</p>
          {totalTasks > 0 && (
            <p className="text-blue-400 text-xs font-semibold">{comingSoonPercent}%</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary;