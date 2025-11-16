import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AssistantPanel = () => {
  const [isActive, setIsActive] = useState(false);
  const [rings, setRings] = useState([
    { scale: 1, opacity: 0.6 },
    { scale: 1.3, opacity: 0.4 },
    { scale: 1.6, opacity: 0.2 }
  ]);
  const [displayText, setDisplayText] = useState(''); // Live transcription / AI reply
  const recognitionRef = useRef(null);
  const { currentUser } = useAuth();
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

        // Show live transcription while speaking
        setDisplayText(finalTranscript + interimTranscript);

        // Once the user stops speaking, send final transcript
        if (event.results[event.results.length - 1].isFinal) {
          recognition.stop();
          setIsActive(false);

          try {
            const res = await axios.post('http://localhost:3001/api/chat', {
              uid: currentUser.uid,
              message: finalTranscript 
            });
            const reply = res.data.reply;

            // Display AI reply
            setDisplayText(reply);

            // Speak the response
            const utterance = new SpeechSynthesisUtterance(reply);
            utterance.lang = 'en-US';
            utterance.onend = () => {
              // Optionally reset display after speaking
              // setDisplayText('');
            };
            speechSynthesis.speak(utterance);
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
      console.warn('SpeechRecognition not supported in this browser.');
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      // Animate rings
      const interval = setInterval(() => {
        setRings(prev =>
          prev.map((ring, i) => ({
            scale: 1 + (Math.random() * 0.8 + 0.5) * (i + 1) * 0.3,
            opacity: Math.random() * 0.4 + 0.2
          }))
        );
      }, 150);

      // Start listening
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
    <div className="flex flex-col items-center justify-center min-h-40 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/30 rounded-lg p-5 transition-all duration-500 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 animate-fadeIn">
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
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl" />
            <div className="relative flex flex-col items-center justify-center space-y-6">
              <div
                className="relative w-24 h-24 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105"
                onClick={() => {
                  setDisplayText(''); // clear previous text
                  setIsActive(!isActive);
                }}
              >
                {rings.map((ring, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full transition-all duration-150 ease-out"
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
                  className="relative z-10 w-16 h-16 rounded-full transition-all duration-300"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #06b6d4, #8b5cf6, #ec4899)',
                    boxShadow: isActive
                      ? '0 0 40px rgba(6, 182, 212, 0.6), 0 0 60px rgba(139, 92, 246, 0.4)'
                      : '0 0 20px rgba(6, 182, 212, 0.4)',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                </div>
                {isActive && (
                  <div
                    className="absolute w-full h-full rounded-full border-2 animate-ping"
                    style={{
                      borderColor: 'rgba(6, 182, 212, 0.3)',
                      animationDuration: '2s'
                    }}
                  />
                )}
              </div>

              {/* Display live transcription or assistant reply */}
              <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {isActive ? 'Listening...' : 'Voice Assistant'}
                </h3>
                <p className="text-slate-400 text-xs">{displayText || (isActive ? 'Speak now' : 'Click to activate')}</p>
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
