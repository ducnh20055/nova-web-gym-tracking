"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle2, MessageSquare } from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", message: "" });
    }, 4000);
  };

  return (
    <section
      id="contact"
      className="w-full bg-zinc-950 border-t border-white/10 py-16 px-4 md:px-8 mt-20"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* CỘT TRÁI: THÔNG TIN LIÊN HỆ */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold backdrop-blur-md">
            <MessageSquare className="w-3.5 h-3.5" />
            Liên hệ & Hỗ trợ
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Bạn có thắc mắc hay góp ý?
          </h2>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Chúng tôi luôn lắng nghe ý kiến từ bạn để hoàn thiện ứng dụng tập
            luyện mỗi ngày. Hãy gửi tin nhắn hoặc kết nối qua các kênh dưới đây.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-blue-400 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold">
                  Email Hỗ Trợ
                </p>
                <p className="font-medium text-white">support@nova.com</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-blue-400 shrink-0">
                <GithubIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold">
                  Mã Nguồn Open Source
                </p>
                <p className="font-medium text-white">
                  github.com/ducnh20055
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: FORM GỬI TIN NHẮN */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-white">Đã gửi tin nhắn!</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Cảm ơn phản hồi của bạn. Đội ngũ hỗ trợ sẽ phản hồi lại qua
                Email sớm nhất có thể.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">
                Gửi phản hồi nhanh
              </h3>

              <div>
                <label className="text-xs text-zinc-400 block mb-1.5 font-medium">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nguyễn A"
                  className="w-full bg-zinc-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1.5 font-medium">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@example.com"
                  className="w-full bg-zinc-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1.5 font-medium">
                  Lời nhắn
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Nội dung bạn cần góp ý hoặc nhờ hỗ trợ..."
                  className="w-full bg-zinc-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 resize-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500 shadow-[0_4px_20px_rgba(37,99,235,0.3)] transition cursor-pointer"
              >
                <Send className="w-4 h-4 fill-white" />
                Gửi tin nhắn
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
