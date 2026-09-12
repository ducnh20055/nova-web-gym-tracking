"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useUser } from "@clerk/nextjs";
import {
  Bot,
  User,
  Send,
  Sparkles,
  Dumbbell,
  Flame,
  Utensils,
  ShieldAlert,
  Zap,
  History,
  Plus,
  X,
  MessageSquare,
} from "lucide-react";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

interface Session {
  id: string;
  title: string;
  updatedAt: string;
}

const QUICK_PROMPTS = [
  {
    icon: Flame,
    label: "Tính TDEE & Macro",
    prompt: "Hãy giúp tôi tính TDEE và gợi ý tỉ lệ Macro để tăng cơ giảm mỡ.",
  },
  {
    icon: Dumbbell,
    label: "Lịch Push/Pull/Legs",
    prompt:
      "Lên cho tôi giáo án Push/Pull/Legs 3 ngày/tuần tối ưu nhất cho người mới.",
  },
  {
    icon: Utensils,
    label: "Thực đơn tăng cơ",
    prompt: "Gợi ý thực đơn tăng cơ đủ Protein với ngân sách tiết kiệm.",
  },
  {
    icon: ShieldAlert,
    label: "Sửa form Bench Press",
    prompt: "Làm sao để Bench Press không bị đau vai và ăn tối đa vào cơ ngực?",
  },
];

export default function TrainerPage() {
  const { user } = useUser();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-ai-msg",
      sender: "ai",
      text: "Xin chào! Tôi là AI Personal Trainer của bạn. Hôm nay bạn muốn tập trung vào mục tiêu gì? (Tăng cơ, giảm mỡ, sửa form động tác hay lên thực đơn dinh dưỡng?)",
      timestamp: "10:00",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Lấy danh sách tất cả danh mục phiên chat từ CSDL
  const fetchSessions = () => {
    fetch("/api/trainer/chat?type=sessions")
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions) setSessions(data.sessions);
      })
      .catch((err) => console.error("Lỗi lấy danh sách phiên:", err));
  };

  // Mỗi lần mở trang luôn bắt đầu bằng một cuộc trò chuyện mới.
  useEffect(() => {
    if (!user?.id) return;
    fetchSessions();
    localStorage.removeItem(`nova:${user.id}:trainer-session`);
  }, [user?.id]);

  // Chuyển đổi sang phiên chat khác
  const handleSelectSession = (selectedId: string) => {
    setSessionId(selectedId);
    if (user?.id)
      localStorage.setItem(`nova:${user.id}:trainer-session`, selectedId);
    setIsHistoryOpen(false);

    fetch(`/api/trainer/chat?sessionId=${selectedId}`)
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then((data) => {
        if (!data.ok) {
          if (user?.id)
            localStorage.removeItem(`nova:${user.id}:trainer-session`);
          setSessionId(null);
          setMessages([]);
          return;
        }
        if (data.data.messages && data.data.messages.length > 0) {
          const formattedMessages: Message[] = data.data.messages.map(
            (m: {
              id: string;
              sender: string;
              text: string;
              createdAt: string;
            }) => ({
              id: m.id,
              sender: m.sender as "ai" | "user",
              text: m.text,
              timestamp: new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }),
          );
          setMessages(formattedMessages);
        }
      });
  };

  // Tạo cuộc trò chuyện mới
  const handleNewChat = () => {
    if (user?.id) localStorage.removeItem(`nova:${user.id}:trainer-session`);
    setSessionId(null);
    setIsHistoryOpen(false);
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: "ai",
        text: "Xin chào! Tôi là AI Personal Trainer của bạn. Hôm nay bạn muốn tập trung vào mục tiêu gì? (Tăng cơ, giảm mỡ, sửa form động tác hay lên thực đơn dinh dưỡng?)",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/trainer/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: query }),
      });

      const data = await res.json();

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        if (user?.id)
          localStorage.setItem(
            `nova:${user.id}:trainer-session`,
            data.sessionId,
          );
        fetchSessions(); // Cập nhật lại danh sách phiên chat ở sidebar
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: data.text || data.error || "Không thể nhận phản hồi.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col overflow-hidden relative">
      <Navbar />

      {/* SIDEBAR LỊCH SỬ CHAT */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-white/10 p-4 transform transition-transform duration-300 flex flex-col ${
          isHistoryOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <History className="w-4 h-4 text-blue-500" /> Lịch sử trò chuyện
          </div>
          <button
            onClick={() => setIsHistoryOpen(false)}
            className="p-1 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleNewChat}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Cuộc trò chuyện mới
        </button>

        <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1 scrollbar-thin">
          {sessions.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">
              Chưa có lịch sử chat
            </p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center gap-2 cursor-pointer ${
                  s.id === sessionId
                    ? "bg-zinc-800 border-blue-500/50 text-white"
                    : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate flex-1">{s.title}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* OVERLAY KHI MỞ SIDEBAR */}
      {isHistoryOpen && (
        <div
          onClick={() => setIsHistoryOpen(false)}
          className="fixed inset-0 bg-black/60 z-40"
        />
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pb-4 pt-20 md:pt-24 flex flex-col overflow-hidden">
        {/* HEADER CHAT */}
        <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md shrink-0 shadow-lg z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 rounded-xl bg-zinc-800 border border-white/10 hover:border-white/20 text-zinc-300 cursor-pointer"
              title="Xem lịch sử"
            >
              <History className="w-5 h-5 text-blue-400" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 border-2 border-black rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm md:text-base font-bold text-white">
                    AI Personal Trainer
                  </h1>
                  <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-blue-400" /> PRO
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Chuyên gia Thể hình & Dinh dưỡng AI
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="p-2.5 rounded-xl bg-zinc-800/60 border border-white/5 hover:border-white/20 text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Cuộc trò chuyện mới"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Mới</span>
          </button>
        </div>

        {/* KHUNG CHAT */}
        <div className="flex-1 overflow-y-auto my-3 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === "user"
                    ? "bg-zinc-800 border border-white/20 text-white"
                    : "bg-blue-600/20 border border-blue-500/40 text-blue-400"
                }`}
              >
                {msg.sender === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[80%] space-y-1 ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`p-3.5 md:p-4 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-line border ${
                    msg.sender === "user"
                      ? "bg-white text-black border-white rounded-tr-none font-medium"
                      : "bg-zinc-900/90 text-zinc-200 border-white/10 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-zinc-500 block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-zinc-900 border border-white/10 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* FOOTER CONTAINER */}
        <div className="shrink-0 space-y-2 pt-1">
          <div className="overflow-x-auto pb-1 flex items-center gap-2 scrollbar-none">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" /> Gợi ý:
            </span>
            {QUICK_PROMPTS.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  disabled={isTyping}
                  onClick={() => handleSend(item.prompt)}
                  className="bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-blue-400 hover:border-blue-500/30 text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Icon className="w-3.5 h-3.5 text-blue-400" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-2.5 flex items-center gap-2 focus-within:border-blue-500/50 transition">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Hỏi PT AI về bài tập, lịch tập, thực đơn..."
              className="flex-1 bg-transparent px-3 py-2 text-xs md:text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4 fill-white" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
