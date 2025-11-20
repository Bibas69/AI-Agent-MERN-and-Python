import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import getLangchainUrl from '../utils/getLangchainUrl';

// GLOBAL stop flag to control speech loop
let shouldStop = false;

// 🔊 Speak lines one-by-one (STOP instantly when required)
async function speakAndDisplayLines(lines, setDisplayText) {
  shouldStop = false;

  for (const line of lines) {
    if (shouldStop) {
      speechSynthesis.cancel();
      return;
    }

    setDisplayText(line);

    await new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(line);
      u.lang = "en-US";

      u.onend = () => {
        if (!shouldStop) resolve();
      };

      u.onerror = () => {
        console.error('Speech synthesis error');
        resolve();
      };

      if (shouldStop) {
        speechSynthesis.cancel();
        return resolve();
      }

      speechSynthesis.speak(u);
      setTimeout(() => resolve(), 10000);
    });

    if (!shouldStop) {
      await new Promise(r => setTimeout(r, 300));
    }

    if (shouldStop) {
      speechSynthesis.cancel();
      return;
    }
  }
  
  if (!shouldStop) {
    setDisplayText('');
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
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const isActiveRef = useRef(false);
  const { currentUser } = useAuth();

  // Initialize speech recognition once
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Changed to false for better control
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

        setDisplayText(finalTranscript || interimTranscript);

        if (event.results[event.results.length - 1].isFinal && finalTranscript.trim()) {
          setIsActive(false);
          isActiveRef.current = false;
          setIsProcessing(true);
          setDisplayText('Processing...');

          try {
            const res = await axios.post(`${getLangchainUrl()}/api/chat`, {
              uid: currentUser.uid,
              message: finalTranscript.trim()
            });

            const reply = res.data.reply;

            // Handle structured task list response
            if (reply && typeof reply === 'object' && reply.type === "task_list") {
              const lines = [];

              if (reply.dateLabel) {
                // Specific date query
                if (reply.todayCount > 0) {
                  lines.push(`You have ${reply.todayCount} task${reply.todayCount !== 1 ? 's' : ''} for ${reply.dateLabel}.`);
                  reply.today.forEach(t =>
                    lines.push(`${t.task} from ${t.start} to ${t.end}`)
                  );
                } else {
                  lines.push(`No tasks scheduled for ${reply.dateLabel}.`);
                }
              } else {
                // General task list (today + upcoming)
                if (reply.todayCount > 0) {
                  lines.push(`Today, you have ${reply.todayCount} task${reply.todayCount !== 1 ? 's' : ''}.`);
                  reply.today.forEach(t =>
                    lines.push(`${t.task} from ${t.start} to ${t.end}`)
                  );
                } else {
                  lines.push('No tasks for today.');
                }

                if (reply.upcoming?.length > 0) {
                  lines.push(`You have ${reply.upcoming.length} upcoming task${reply.upcoming.length !== 1 ? 's' : ''}.`);
                  reply.upcoming.forEach(t =>
                    lines.push(`${t.task} on ${t.date} from ${t.start} to ${t.end}`)
                  );
                }
              }

              setIsProcessing(false);
              await speakAndDisplayLines(lines, setDisplayText);
            } 
            // Handle regular text response
            else if (typeof reply === 'string') {
              setDisplayText(reply);
              setIsProcessing(false);

              const utterance = new SpeechSynthesisUtterance(reply);
              utterance.lang = 'en-US';
              utterance.onend = () => {
                setTimeout(() => setDisplayText(''), 2000);
              };
              speechSynthesis.speak(utterance);
            }
            // Fallback for unexpected response
            else {
              const fallbackText = 'I received your request.';
              setDisplayText(fallbackText);
              setIsProcessing(false);

              const utterance = new SpeechSynthesisUtterance(fallbackText);
              utterance.lang = 'en-US';
              speechSynthesis.speak(utterance);
            }

          } catch (err) {
            console.error('❌ Error sending to LangChain:', err);
            const errorMsg = 'Sorry, I encountered an error. Please try again.';
            setDisplayText(errorMsg);
            setIsProcessing(false);

            const utterance = new SpeechSynthesisUtterance(errorMsg);
            utterance.lang = 'en-US';
            speechSynthesis.speak(utterance);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsActive(false);
        isActiveRef.current = false;
        setIsProcessing(false);
        
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setDisplayText('Speech recognition error. Please try again.');
        } else {
          setDisplayText('');
        }
      };

      recognition.onend = () => {
        // ✅ FIXED: prevent auto-restart if shouldStop is true
        if (isActiveRef.current && !shouldStop) {
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition restart prevented:', e);
          }
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('SpeechRecognition not supported in this browser.');
      setDisplayText('Speech recognition not supported in this browser.');
    }

    return () => {
      shouldStop = true;
      speechSynthesis.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Cleanup stop error:', e);
        }
      }
    };
  }, [currentUser]);

  // Handle animation rings
  useEffect(() => {
    let interval;
    
    if (isActive) {
      interval = setInterval(() => {
        setRings(prev =>
          prev.map((ring, i) => ({
            scale: 1 + (Math.random() * 0.8 + 0.5) * (i + 1) * 0.3,
            opacity: Math.random() * 0.4 + 0.2
          }))
        );
      }, 150);
    } else {
      setRings([
        { scale: 1, opacity: 0.6 },
        { scale: 1.3, opacity: 0.4 },
        { scale: 1.6, opacity: 0.2 }
      ]);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  // Sync ref with state
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Start/stop recognition based on isActive
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isActive && !isProcessing) {
      shouldStop = false;
      try {
        recognitionRef.current.start();
      } catch (e) {
        if (e.name !== 'InvalidStateError') {
          console.error('Start error:', e);
        }
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Stop error:', e);
      }
    }
  }, [isActive, isProcessing]);

  const handleButtonClick = () => {
    // Stop everything immediately
    shouldStop = true;
    speechSynthesis.cancel();

    if (isActive || isProcessing) {
      // Turn OFF
      setIsActive(false);
      isActiveRef.current = false;
      setIsProcessing(false);
      setDisplayText('');
      
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.log('Stop error:', e);
      }
    } else {
      // Turn ON
      shouldStop = false;
      setDisplayText('');
      setIsActive(true);
      isActiveRef.current = true;
    }
  };

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
                className="relative w-24 h-24 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                onClick={handleButtonClick}
              >
                {rings.map((ring, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full transition-all duration-300"
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
                  className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: isProcessing 
                      ? 'radial-gradient(circle at 30% 30%, #f59e0b, #ef4444, #dc2626)'
                      : 'radial-gradient(circle at 30% 30%, #06b6d4, #8b5cf6, #ec4899)',
                  }}
                >
                  {isProcessing && (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {/* Text */}
              <div className="text-center min-h-[60px] flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {isProcessing ? "Processing..." : isActive ? "Listening..." : "Voice Assistant"}
                </h3>

                <p className="text-slate-400 text-sm whitespace-pre-line max-w-xs leading-relaxed">
                  {displayText || (isActive ? "Speak now..." : "Click to activate")}
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