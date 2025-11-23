import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import getLangchainUrl from "../utils/getLangchainUrl";

// GLOBAL stop flag to control speech loop
let shouldStop = false;

// Speak lines one-by-one (STOP instantly when required)
async function speakAndDisplayLines(lines, setDisplayText) {
  shouldStop = false;

  for (const line of lines) {
    if (shouldStop) {
      speechSynthesis.cancel();
      return;
    }

    setDisplayText(line);

    await new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(line);
      u.lang = "en-US";

      u.onend = () => {
        if (!shouldStop) resolve();
      };

      u.onerror = () => {
        console.error("Speech synthesis error");
        resolve();
      };

      if (shouldStop) {
        speechSynthesis.cancel();
        return resolve();
      }

      speechSynthesis.speak(u);

      // Safety timeout in case onend doesn't fire
      setTimeout(() => resolve(), 10000);
    });

    if (!shouldStop) {
      await new Promise((r) => setTimeout(r, 300));
    }

    if (shouldStop) {
      speechSynthesis.cancel();
      return;
    }
  }

  if (!shouldStop) {
    setDisplayText("");
  }
}

// Format time for voice (handles both simple format and ISO strings)
const formatTimeForVoice = (timeStr) => {
  if (!timeStr) return "unknown time";

  // If already formatted (contains AM/PM), clean it up for speech
  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    return timeStr.replace(/\s+/g, " ").trim();
  }

  // If it's an ISO string, parse and format it
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timeStr;
  }
};

const AssistantPanel = () => {
  const { currentUser } = useAuth();

  const [isActive, setIsActive] = useState(false);
  const [rings, setRings] = useState([
    { scale: 1, opacity: 0.6, rotation: 0 },
    { scale: 1.3, opacity: 0.4, rotation: 0 },
    { scale: 1.6, opacity: 0.2, rotation: 0 },
  ]);
  const [displayText, setDisplayText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioWaves, setAudioWaves] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const recognitionRef = useRef(null);
  const isActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);

  // Initialize speech recognition once
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = async (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += transcript;
          else interimTranscript += transcript;
        }

        setDisplayText(finalTranscript || interimTranscript);

        // Only act when final result is available
        if (
          event.results[event.results.length - 1].isFinal &&
          finalTranscript.trim()
        ) {
          setIsActive(false);
          isActiveRef.current = false;
          setIsProcessing(true);
          setDisplayText("Processing...");

          try {
            const res = await axios.post(`${getLangchainUrl()}/api/chat`, {
              uid: currentUser?.uid,
              message: finalTranscript.trim(),
            });

            let reply = res.data?.reply ?? res.data;
            if (reply?.data) reply = reply.data;
            if (reply?.reply?.data) reply = reply.reply.data;
            if (reply?.result) reply = reply.result;
            if (Array.isArray(reply) && reply.length === 1) reply = reply[0];

            const processFreeSlotsResponse = (resp) => {
              const slots = resp?.slots ?? resp?.freeSlots ?? resp?.reply?.slots ?? resp?.reply?.freeSlots;
              const dateLabel = resp?.date ?? resp?.reply?.date ?? null;

              const lines = [];
              if (slots && Array.isArray(slots)) {
                if (slots.length > 0) {
                  lines.push(
                    `You have ${slots.length} free slot${slots.length !== 1 ? "s" : ""}${dateLabel ? ` on ${dateLabel}` : ""
                    }.`
                  );

                  slots.forEach((slot, idx) => {
                    const startTime = formatTimeForVoice(slot.start);
                    const endTime = formatTimeForVoice(slot.end);

                    try {
                      const durationMs = new Date(slot.end) - new Date(slot.start);
                      const durationMins = Math.floor(durationMs / 60000);
                      const hours = Math.floor(durationMins / 60);
                      const mins = durationMins % 60;
                      const durationStr =
                        hours > 0
                          ? `${hours} hour${hours !== 1 ? "s" : ""}${mins > 0 ? ` and ${mins} minutes` : ""
                          }`
                          : `${mins} minutes`;

                      lines.push(
                        `Slot ${idx + 1}: From ${startTime} to ${endTime}, that's ${durationStr}.`
                      );
                    } catch {
                      lines.push(`Slot ${idx + 1}: From ${startTime} to ${endTime}.`);
                    }
                  });
                } else {
                  lines.push(`No free slots available${dateLabel ? ` for ${dateLabel}` : ""}.`);
                }
              } else {
                lines.push("No free slots available.");
              }

              return lines;
            };

            const processTaskListResponse = (resp) => {
              const lines = [];

              const today = resp?.today ?? resp?.tasks ?? resp?.reply?.today;
              const todayCount = resp?.todayCount ?? (today ? today.length : 0);
              const upcoming = resp?.upcoming ?? resp?.reply?.upcoming;

              if (resp?.dateLabel) {
                if (todayCount > 0) {
                  lines.push(
                    `You have ${todayCount} task${todayCount !== 1 ? "s" : ""} for ${resp.dateLabel}.`
                  );
                  (today || []).forEach((t) =>
                    lines.push(`${t.task} from ${formatTimeForVoice(t.start)} to ${formatTimeForVoice(t.end)}`)
                  );
                } else {
                  lines.push(`No tasks scheduled for ${resp.dateLabel}.`);
                }
              } else {
                if (todayCount > 0) {
                  lines.push(`Today, you have ${todayCount} task${todayCount !== 1 ? "s" : ""}.`);
                  (today || []).forEach((t) =>
                    lines.push(`${t.task} from ${formatTimeForVoice(t.start)} to ${formatTimeForVoice(t.end)}`)
                  );
                } else {
                  lines.push("No tasks for today.");
                }

                if (upcoming?.length > 0) {
                  lines.push(
                    `You have ${upcoming.length} upcoming task${upcoming.length !== 1 ? "s" : ""}.`
                  );
                  upcoming.forEach((t) =>
                    lines.push(`${t.task} on ${t.date} from ${formatTimeForVoice(t.start)} to ${formatTimeForVoice(t.end)}`)
                  );
                }
              }

              return lines;
            };

            let linesToSpeak = null;

            if (reply && typeof reply === "object" && Array.isArray(reply.slots)) {
              linesToSpeak = processFreeSlotsResponse(reply);
            }
            else if (reply && typeof reply === "object" && reply.type === "empty_slots") {
              linesToSpeak = processFreeSlotsResponse(reply);
            }
            else if (reply && typeof reply === "object" && Array.isArray(reply.freeSlots)) {
              linesToSpeak = processFreeSlotsResponse(reply);
            }
            else if (reply && typeof reply === "object" && reply.type === "free_slots") {
              linesToSpeak = processFreeSlotsResponse(reply);
            }
            else if (reply && typeof reply === "object" && Array.isArray(reply.tasks)) {
              linesToSpeak = processTaskListResponse({ today: reply.tasks, todayCount: reply.tasks.length });
            }
            else if (reply && typeof reply === "object" && reply.type === "task_list") {
              linesToSpeak = processTaskListResponse(reply);
            }

            if (linesToSpeak) {
              setIsProcessing(false);
              setIsSpeaking(true);
              isSpeakingRef.current = true;
              await speakAndDisplayLines(linesToSpeak, setDisplayText);
              setIsSpeaking(false);
              isSpeakingRef.current = false;
            } else if (typeof reply === "string") {
              setDisplayText(reply);
              setIsProcessing(false);

              setIsSpeaking(true);
              isSpeakingRef.current = true;
              const utterance = new SpeechSynthesisUtterance(reply);
              utterance.lang = "en-US";
              utterance.onend = () => {
                setIsSpeaking(false);
                isSpeakingRef.current = false;
                setTimeout(() => setDisplayText(""), 2000);
              };
              speechSynthesis.speak(utterance);
            } else if (reply && typeof reply === "object" && reply.message) {
              const text = reply.message;
              setDisplayText(text);
              setIsProcessing(false);

              setIsSpeaking(true);
              isSpeakingRef.current = true;
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.lang = "en-US";
              utterance.onend = () => {
                setIsSpeaking(false);
                isSpeakingRef.current = false;
                setTimeout(() => setDisplayText(""), 2000);
              };
              speechSynthesis.speak(utterance);
            } else {
              const fallbackText = "I received your request.";
              setDisplayText(fallbackText);
              setIsProcessing(false);

              const utterance = new SpeechSynthesisUtterance(fallbackText);
              utterance.lang = "en-US";
              speechSynthesis.speak(utterance);
            }
          } catch (err) {
            console.error("❌ Error sending to LangChain:", err);
            const errorMsg = "Sorry, I encountered an error. Please try again.";
            setDisplayText(errorMsg);
            setIsProcessing(false);

            const utterance = new SpeechSynthesisUtterance(errorMsg);
            utterance.lang = "en-US";
            speechSynthesis.speak(utterance);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsActive(false);
        isActiveRef.current = false;
        setIsProcessing(false);

        if (event.error !== "no-speech" && event.error !== "aborted") {
          setDisplayText("Speech recognition error. Please try again.");
        } else {
          setDisplayText("");
        }
      };

      recognition.onend = () => {
        if (isActiveRef.current && !shouldStop && !isSpeakingRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.log("Recognition restart prevented:", e);
          }
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("SpeechRecognition not supported in this browser.");
      setDisplayText("Speech recognition not supported in this browser.");
    }

    return () => {
      shouldStop = true;
      speechSynthesis.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log("Cleanup stop error:", e);
        }
      }
    };
  }, [currentUser]);

  // Beautiful aurora rings animation for listening
  useEffect(() => {
    let interval;

    if (isActive) {
      interval = setInterval(() => {
        const time = Date.now();
        setRings((prev) =>
          prev.map((ring, i) => ({
            scale: 1 + (Math.sin(time / 400 + i * 1.5) * 0.4 + 0.6) * (i + 1) * 0.25,
            opacity: (Math.sin(time / 500 + i * 1.2) * 0.25 + 0.45),
            rotation: (time / 50 + i * 60) % 360,
          }))
        );
      }, 30);
    } else {
      setRings([
        { scale: 1, opacity: 0.6, rotation: 0 },
        { scale: 1.3, opacity: 0.4, rotation: 120 },
        { scale: 1.6, opacity: 0.2, rotation: 240 },
      ]);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  // Dynamic audio wave animation for speaking
  useEffect(() => {
    let interval;

    if (isSpeaking) {
      interval = setInterval(() => {
        setAudioWaves(prev => 
          prev.map(() => Math.random() * 0.8 + 0.2)
        );
      }, 80);
    } else {
      setAudioWaves([0, 0, 0, 0, 0, 0, 0, 0]);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpeaking]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isActive && !isProcessing && !isSpeaking) {
      shouldStop = false;
      try {
        recognitionRef.current.start();
      } catch (e) {
        if (e.name !== "InvalidStateError") {
          console.error("Start error:", e);
        }
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Stop error:", e);
      }
    }
  }, [isActive, isProcessing, isSpeaking]);

  const handleButtonClick = () => {
    if (isSpeaking) {
      shouldStop = true;
      speechSynthesis.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setDisplayText("");
      return;
    }

    if (isProcessing || isActive) {
      shouldStop = true;
      speechSynthesis.cancel();
      setIsActive(false);
      isActiveRef.current = false;
      setIsProcessing(false);
      setDisplayText("");

      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.log("Stop error:", e);
      }
    } else {
      shouldStop = false;
      setDisplayText("");
      setIsActive(true);
      isActiveRef.current = true;
    }
  };

  return (
    <div className="flex items-center justify-center w-full px-2 sm:px-0">
      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg overflow-hidden rounded-3xl">

        {/* Outer conic rotating border */}
        <div className="absolute inset-0 p-[1.5px] rounded-3xl">
          <div
            className="absolute inset-0 rounded-3xl opacity-60"
            style={{
              background:
                "conic-gradient(from 0deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)",
              animation: "spin 4s linear infinite",
              filter: "blur(6px)",
            }}
          />
        </div>

        {/* Glass-like inner card */}
        <div className="relative rounded-3xl p-4 sm:p-6 md:p-8 m-[1.5px] bg-slate-900/30 backdrop-blur-xl border border-slate-700/40 shadow-2xl">
          <div className="relative flex flex-col items-center justify-center space-y-6">

            {/* Voice Button */}
            <div
              className="
              relative
              w-20 h-20
              sm:w-24 sm:h-24
              md:w-28 md:h-28
              flex items-center justify-center cursor-pointer
              transition-transform hover:scale-105 active:scale-95
            "
              onClick={handleButtonClick}
            >
              {/* Aurora rings for listening - with beautiful flowing colors */}
              {isActive && rings.map((ring, i) => (
                <div
                  key={`aurora-${i}`}
                  className="absolute rounded-full transition-all duration-75 ease-out"
                  style={{
                    width: "100%",
                    height: "100%",
                    background: `conic-gradient(from ${ring.rotation}deg, 
                      rgba(6, 182, 212, ${0.3 * ring.opacity}) 0deg,
                      rgba(139, 92, 246, ${0.25 * ring.opacity}) 90deg,
                      rgba(236, 72, 153, ${0.2 * ring.opacity}) 180deg,
                      rgba(59, 130, 246, ${0.25 * ring.opacity}) 270deg,
                      rgba(6, 182, 212, ${0.3 * ring.opacity}) 360deg)`,
                    transform: `scale(${ring.scale}) rotate(${ring.rotation}deg)`,
                    opacity: ring.opacity,
                    filter: "blur(12px)",
                  }}
                />
              ))}

              {/* Pulsing glow rings for listening */}
              {isActive && (
                <>
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: "120%",
                      height: "120%",
                      background: "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)",
                      animation: "pulse-glow 2s ease-in-out infinite",
                      filter: "blur(20px)",
                    }}
                  />
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: "140%",
                      height: "140%",
                      background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
                      animation: "pulse-glow 2s ease-in-out infinite 0.5s",
                      filter: "blur(25px)",
                    }}
                  />
                </>
              )}

              {/* Elegant wave rings for speaking */}
              {isSpeaking && (
                <>
                  {audioWaves.map((intensity, i) => (
                    <div
                      key={`wave-${i}`}
                      className="absolute rounded-full"
                      style={{
                        width: "100%",
                        height: "100%",
                        background: `radial-gradient(circle, 
                          transparent ${45 + i * 6}%, 
                          rgba(16, 185, 129, ${intensity * 0.35}) ${45 + i * 6}%, 
                          rgba(5, 150, 105, ${intensity * 0.25}) ${55 + i * 7}%,
                          rgba(4, 120, 87, ${intensity * 0.15}) ${65 + i * 8}%,
                          transparent ${75 + i * 8}%)`,
                        transform: `scale(${1 + intensity * 0.3})`,
                        opacity: intensity * 0.9,
                        filter: "blur(10px)",
                        transition: "all 0.08s ease-out",
                      }}
                    />
                  ))}
                  {/* Central glow for speaking */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: "130%",
                      height: "130%",
                      background: "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 60%)",
                      filter: "blur(25px)",
                      animation: "pulse-speak 1.5s ease-in-out infinite",
                    }}
                  />
                </>
              )}

              {/* Soft idle aurora */}
              {!isActive && !isSpeaking && !isProcessing && (
                <>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={`idle-aurora-${i}`}
                      className="absolute rounded-full"
                      style={{
                        width: "100%",
                        height: "100%",
                        background: `conic-gradient(from ${i * 120}deg, 
                          rgba(99, 102, 241, 0.12) 0deg,
                          rgba(139, 92, 246, 0.1) 120deg,
                          rgba(168, 85, 247, 0.08) 240deg,
                          rgba(99, 102, 241, 0.12) 360deg)`,
                        transform: `scale(${1 + i * 0.3})`,
                        opacity: 0.3 - i * 0.08,
                        filter: "blur(15px)",
                        animation: `rotate-slow ${20 + i * 5}s linear infinite`,
                      }}
                    />
                  ))}
                </>
              )}

              {/* Center button with enhanced glow */}
              <div
                className="
                relative z-10
                w-14 h-14
                sm:w-16 sm:h-16
                md:w-20 md:h-20
                rounded-full flex items-center justify-center
                transition-all duration-300
              "
                style={{
                  background: isSpeaking
                    ? "radial-gradient(circle at 35% 35%, #10b981 0%, #059669 50%, #047857 100%)"
                    : isProcessing
                      ? "radial-gradient(circle at 35% 35%, #f59e0b 0%, #ef4444 50%, #dc2626 100%)"
                      : isActive
                        ? "radial-gradient(circle at 35% 35%, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)"
                        : "radial-gradient(circle at 35% 35%, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
                  boxShadow: isActive
                    ? "0 0 40px rgba(99, 102, 241, 0.4), 0 0 80px rgba(139, 92, 246, 0.2), inset 0 2px 8px rgba(255, 255, 255, 0.1)"
                    : isSpeaking
                      ? "0 0 40px rgba(16, 185, 129, 0.4), 0 0 80px rgba(5, 150, 105, 0.2), inset 0 2px 8px rgba(255, 255, 255, 0.1)"
                      : "0 8px 25px rgba(2, 6, 23, 0.6), inset 0 1px 4px rgba(255, 255, 255, 0.05)",
                }}
              >
                {isProcessing && (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

            {/* Text */}
            <div className="text-center min-h-[60px] flex flex-col items-center justify-center px-2">
              <h3 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-1 sm:mb-2">
                {isSpeaking
                  ? "Speaking..."
                  : isProcessing
                    ? "Processing..."
                    : isActive
                      ? "Listening..."
                      : "Voice Assistant"}
              </h3>

              <p className="text-slate-300 text-xs sm:text-sm whitespace-pre-line max-w-[20rem] sm:max-w-[18rem] leading-relaxed">
                {displayText ||
                  (isActive
                    ? "Speak now..."
                    : isSpeaking
                      ? "Click to stop"
                      : "Click to activate")}
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: scale(1.1);
            opacity: 0.5;
          }
        }
        
        @keyframes pulse-speak {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.4;
          }
          50% { 
            transform: scale(1.15);
            opacity: 0.6;
          }
        }
      `}</style>
      </div>
    </div>
  );

};

export default AssistantPanel;