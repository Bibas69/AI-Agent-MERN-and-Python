import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Bot, User, Calendar, Clock, CheckCircle2, XCircle, ListTodo } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import getLangchainUrl from "../utils/getLangchainUrl";

const ChatTaskAssistant = ({ uid }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! I'm your AI Assistant. How can I help you today?" },
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
      const res = await axios.post(`${getLangchainUrl()}/api/chat`, {
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

  // Format time from ISO string or regular time string
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return timeStr;
    }
  };

  const calculateDuration = (start, end) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffMs = endDate - startDate;
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    } catch {
      return "";
    }
  };

  const renderFreeSlots = (slotsData) => {
    const { date, slots = [], freeSlots = [] } = slotsData;
    const slotsToDisplay = slots.length > 0 ? slots : freeSlots;

    return (
      <div className="space-y-3 w-full">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <p className="font-semibold text-emerald-400">
            {date ? `Free Slots for ${date}` : "Available Free Slots"}
          </p>
        </div>

        {slotsToDisplay.length > 0 ? (
          <div className="space-y-2">
            {slotsToDisplay.map((slot, i) => (
              <div 
                key={`slot-${i}`}
                className="glass-effect glass-border rounded-lg p-3 hover:bg-white/5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </p>
                      {slot.start && slot.end && (
                        <p className="text-xs text-gray-500">
                          Duration: {calculateDuration(slot.start, slot.end)}
                        </p>
                      )}
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-effect glass-border rounded-lg p-4 text-center">
            <XCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No free slots available</p>
          </div>
        )}
      </div>
    );
  };

  const renderTaskList = (taskData) => {
    const todayTasks = Array.isArray(taskData?.today) ? taskData.today : [];
    const upcomingTasks = Array.isArray(taskData?.upcoming) ? taskData.upcoming : [];
    const dateLabel = taskData?.dateLabel;

    return (
      <div className="space-y-4">
        {/* Today's Tasks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListTodo className="w-4 h-4 text-blue-400" />
            <p className="font-semibold text-blue-400">
              {dateLabel ? `Tasks for ${dateLabel}` : "Today's Tasks"} ({todayTasks.length})
            </p>
          </div>

          {todayTasks.length > 0 ? (
            <div className="space-y-2">
              {todayTasks.map((t, i) => (
                <div 
                  key={`today-${i}`}
                  className="glass-effect glass-border rounded-lg p-3 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 mb-1">
                        {t.task ?? "Untitled Task"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(t.start) ?? "N/A"} - {formatTime(t.end) ?? "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-effect glass-border rounded-lg p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No tasks scheduled</p>
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-purple-400" />
              <p className="font-semibold text-purple-400">
                Upcoming Tasks ({upcomingTasks.length})
              </p>
            </div>

            <div className="space-y-2">
              {upcomingTasks.map((t, i) => (
                <div 
                  key={`upcoming-${i}`}
                  className="glass-effect glass-border rounded-lg p-3 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 mb-1">
                        {t.task ?? "Untitled Task"}
                      </p>
                      <div className="flex flex-col gap-1 text-xs text-gray-500">
                        <span>{t.date ?? "N/A"}</span>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(t.start) ?? "N/A"} - {formatTime(t.end) ?? "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMessageContent = (msg) => {
    if (typeof msg.text === "string") {
      return <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>;
    }

    // Normalize both free_slots and empty_slots
    if (
      msg.text &&
      typeof msg.text === "object" &&
      (msg.text.type === "free_slots" || msg.text.type === "empty_slots")
    ) {
      return renderFreeSlots(msg.text);
    }

    if (msg.text && typeof msg.text === "object" && msg.text.type === "task_list") {
      return renderTaskList(msg.text);
    }

    return <p className="leading-relaxed break-words whitespace-pre-wrap">{JSON.stringify(msg.text ?? "")}</p>;
  };

  return (
    <div className="w-full">
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-bounce { animation: pulse 1.5s infinite; }
        .glass-effect { background: rgba(30,30,30,0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .glass-border { border: 1px solid rgba(255,255,255,0.08); }
        .message-bubble { transition: transform 0.2s ease; }
        .message-bubble:hover { transform: translateY(-1px); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
        .send-button { transition: all 0.2s ease; }
        .send-button:hover:not(:disabled) { transform: scale(1.05); }
        .send-button:active:not(:disabled) { transform: scale(0.95); }
      `}</style>

      <div className="h-[500px] flex flex-col glass-effect glass-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="glass-border border-b px-5 py-4 flex-shrink-0 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium text-base">AI Assistant</h3>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                Online
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
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
                className={`message-bubble max-w-[85%] md:max-w-[75%] px-3.5 py-2.5 rounded-xl text-sm ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                    : "glass-effect glass-border text-gray-100"
                }`}
              >
                {renderMessageContent(msg)}
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
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef}></div>
        </div>

        {/* Input */}
        <div className="glass-border border-t px-4 py-3.5 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              rows="1"
              placeholder="Ask about tasks or free time slots..."
              className="flex-1 glass-effect glass-border text-white rounded-xl px-4 py-3 text-sm outline-none resize-none overflow-y-auto placeholder:text-gray-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              style={{ minHeight: "44px", maxHeight: "120px" }}
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