import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// GLOBAL stop flag to control speech loop
let shouldStop = false;

// 🔊 Speak lines one-by-one (STOP instantly when required)
async function speakAndDisplayLines(lines, setDisplayText) {
  shouldStop = false; // reset flag

  for (const line of lines) {
    if (shouldStop) return;  // stop immediately

    // Show ONLY the current line (not all)
    setDisplayText(line);

    await new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(line);
      u.lang = "en-US";

      u.onend = resolve;

      if (shouldStop) {
        speechSynthesis.cancel();
        return resolve();
      }

      speechSynthesis.speak(u);
    });

    // small pause
    await new Promise(r => setTimeout(r, 100));

    if (shouldStop) return;
  }
}

const AssistantPanel = () => {
  const [isActive, setIsActive] = useState(false);
  const [rings, setRings] = useState([
    { scale: 1, opacity: 0.6 },
    { scale: 1.3, opacity: 0.4 },
    { scale: 1.6, opacity: 0.2 }
  ]);
  const [displayText, setDisplayText] = useState('');
  const recognitionRef = useRef(null);
  const { currentUser } = useAuth();

  // Format tasks (unchanged)
  const formatTaskList = (data) => {
    let text = "";

    if (data.todayCount > 0) {
      text += `Today, you have ${data.todayCount} tasks:\n`;
      data.today.forEach(t => {
        text += `• ${t.task} from ${t.start} to ${t.end}\n`;
      });
    } 
    else {
      text += "You have no tasks today.\n";
    }

    if (data.upcoming?.length > 0) {
      text += `\nUpcoming Tasks:\n`;
      data.upcoming.forEach(t => {
        text += `• ${t.task} on ${t.date} at ${t.start} – ${t.end}\n`;
      });
    }

    return text.trim();
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = async (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += transcript;
          else interimTranscript += transcript;
        }

        setDisplayText(finalTranscript + interimTranscript);

        if (event.results[event.results.length - 1].isFinal) {
          recognition.stop();
          setIsActive(false);

          try {
            const res = await axios.post('http://localhost:3001/api/chat', {
              uid: currentUser.uid,
              message: finalTranscript
            });

            const reply = res.data.reply;

            // ⭐ Task-mode
            if (reply && reply.type === "task_list") {
              const lines = [];

              if (reply.todayCount > 0) {
                lines.push(`Today, you have ${reply.todayCount} tasks.`);
                reply.today.forEach(t =>
                  lines.push(`• ${t.task} from ${t.start} to ${t.end}`)
                );
              }

              if (reply.upcoming?.length > 0) {
                lines.push(`Upcoming Tasks:`);
                reply.upcoming.forEach(t =>
                  lines.push(`• ${t.task} on ${t.date} at ${t.start} – ${t.end}`)
                );
              }

              speakAndDisplayLines(lines, setDisplayText);
            } 
            else {
              setDisplayText(reply);
              const utterance = new SpeechSynthesisUtterance(reply);
              utterance.lang = 'en-US';
              speechSynthesis.speak(utterance);
            }

          } catch (err) {
            console.error('❌ Error sending to LangChain:', err);
            setDisplayText('❌ Error connecting to assistant.');
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsActive(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('SpeechRecognition not supported.');
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setRings(prev =>
          prev.map((ring, i) => ({
            scale: 1 + (Math.random() * 0.8 + 0.5) * (i + 1) * 0.3,
            opacity: Math.random() * 0.4 + 0.2
          }))
        );
      }, 150);

      recognitionRef.current?.start();

      return () => clearInterval(interval);
    } else {
      setRings([
        { scale: 1, opacity: 0.6 },
        { scale: 1.3, opacity: 0.4 },
        { scale: 1.6, opacity: 0.2 }
      ]);

      recognitionRef.current?.stop();
    }
  }, [isActive]);

  return (
    <div className="flex flex-col items-center justify-center min-h-40 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/30 rounded-lg p-5">
      <div className="relative w-80">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 p-[1.5px] rounded-2xl">
            <div
              className="absolute inset-0 opacity-50"
              style={{
                background: 'conic-gradient(from 0deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)',
                animation: 'spin 4s linear infinite'
              }}
            />
          </div>

          <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-8 m-[1.5px]">
            <div className="relative flex flex-col items-center justify-center space-y-6">
              
              {/* Voice Button */}
              <div
                className="relative w-24 h-24 flex items-center justify-center cursor-pointer"
                onClick={() => {
                  shouldStop = true;       // ⛔ STOP speaking instantly
                  speechSynthesis.cancel();
                  setDisplayText("");      // Clear text
                  setIsActive(prev => !prev); // Toggle assistant
                }}
              >
                {rings.map((ring, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full transition-all"
                    style={{
                      width: '100%',
                      height: '100%',
                      background:
                        'radial-gradient(circle, transparent 60%, rgba(6, 182, 212, 0.3) 60%, rgba(139, 92, 246, 0.3) 80%, rgba(236, 72, 153, 0.3) 100%)',
                      transform: `scale(${isActive ? ring.scale : 1 + i * 0.3})`,
                      opacity: isActive ? ring.opacity : 0.3 - i * 0.1,
                      filter: 'blur(8px)'
                    }}
                  />
                ))}

                <div
                  className="relative z-10 w-16 h-16 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #06b6d4, #8b5cf6, #ec4899)',
                  }}
                />
              </div>

              {/* Text */}
              <div className="text-center">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {isActive ? "Listening..." : "Voice Assistant"}
                </h3>

                <p className="text-slate-400 text-xs whitespace-pre-line">
                  {displayText || (isActive ? "Speak now" : "Click to activate")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AssistantPanel;
