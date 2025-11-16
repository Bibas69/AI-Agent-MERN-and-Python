import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Bot, User } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ChatTaskAssistant = ({ uid }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I'm your AI Assistant. How can I help you today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3001/api/chat", {
        uid: currentUser.uid,
        message: userMessage,
      });

      const aiReply = res.data?.reply || "I received your message.";
      setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        
        .glass-effect {
          background: rgba(30, 30, 30, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        
        .glass-border {
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .message-bubble {
          transition: transform 0.2s ease;
        }
        
        .message-bubble:hover {
          transform: translateY(-1px);
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        
        .send-button {
          transition: all 0.2s ease;
        }
        
        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
        }
        
        .send-button:active:not(:disabled) {
          transform: scale(0.95);
        }
      `}</style>

      {/* Main Chat Container - Fixed Height */}
      <div className="h-[400px] flex flex-col glass-effect glass-border rounded-2xl overflow-hidden">
        
        {/* Header */}
        <div className="glass-border border-b px-5 py-4 flex-shrink-0 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium text-base">AI Assistant</h3>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" style={{ animation: 'pulse 2s ease-in-out infinite' }}></span>
                Online
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container - Fixed Height with Scroll */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-3 custom-scrollbar"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-2.5 animate-slide-up ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              {msg.sender === "ai" && (
                <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`message-bubble max-w-[80%] md:max-w-[70%] px-3.5 py-2.5 rounded-xl text-sm ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                    : "glass-effect glass-border text-gray-100"
                }`}
              >
                <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
              </div>

              {msg.sender === "user" && (
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-2.5 justify-start animate-slide-up">
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="glass-effect glass-border px-4 py-2.5 rounded-xl flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef}></div>
        </div>

        {/* Input Section */}
        <div className="glass-border border-t px-4 py-3.5 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              rows="1"
              placeholder="Type your message..."
              className="flex-1 glass-effect glass-border text-white rounded-xl px-4 py-3 text-sm outline-none resize-none overflow-y-auto placeholder:text-gray-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              style={{
                minHeight: '44px',
                maxHeight: '120px'
              }}
            />
            
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="send-button bg-gradient-to-br from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-gray-700 disabled:to-gray-800 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTaskAssistant;