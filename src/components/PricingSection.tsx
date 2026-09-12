"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Zap,
  Crown,
  ShieldCheck,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  const plans = [
    {
      id: "free",
      name: "Miễn Phí",
      desc: "Trải nghiệm cơ bản cho người mới bắt đầu tập luyện.",
      priceMonth: "0",
      priceYear: "0",
      badge: null,
      popular: false,
      buttonText: "Bắt đầu miễn phí",
      features: [
        "Truy cập 1.300+ bài tập chuẩn hóa",
        "Tạo tối đa 2 giáo án tập cá nhân",
        "Xem hướng dẫn kỹ thuật dạng GIF",
        "Lưu lịch sử tập luyện 7 ngày gần nhất",
      ],
    },
    {
      id: "pro",
      name: "PRO AI Trainer",
      desc: "Dành cho người tập muốn tăng tốc kết quả với sự hỗ trợ của AI.",
      priceMonth: "149.000",
      priceYear: "119.000",
      badge: "Phổ biến nhất",
      popular: true,
      buttonText: "Nâng cấp Pro ngay",
      features: [
        "Toàn bộ tính năng gói Miễn Phí",
        "Hỏi đáp không giới hạn với AI Personal Trainer 24/7",
        "Tự động tính TDEE, Macro & gợi ý thực đơn",
        "Phân tích & sửa lỗi Form bài tập nâng cao",
        "Tạo giáo án tập luyện không giới hạn",
        "Lưu trữ dữ liệu tiến độ trọn đời",
      ],
    },
    {
      id: "vip",
      name: "VIP / Coach 1-1",
      desc: "Giải pháp toàn diện kết hợp AI và Huấn luyện viên chuyên nghiệp.",
      priceMonth: "499.000",
      priceYear: "399.000",
      badge: "Cao cấp",
      popular: false,
      buttonText: "Liên hệ tư vấn VIP",
      features: [
        "Toàn bộ đặc quyền của gói PRO",
        "1 buổi Review lịch tập mỗi tháng với Coach thật",
        "Thiết kế thực đơn riêng biệt theo thể trạng",
        "Hỗ trợ ưu tiên qua kênh Discord / Zalo riêng",
      ],
    },
  ];

  const handleCheckout = async (planId: string) => {
    if (planId === "free") {
      router.push("/auth/sign-up");
      return;
    }

    try {
      setLoadingPlan(planId);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, isYearly }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push("/sign-in");
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
      } else {
        alert(data.error || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      alert("Không thể kết nối đến máy chủ thanh toán.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section
      id="price"
      className="w-full bg-black text-white py-20 px-4 md:px-8 max-w-6xl mx-auto"
    >
      {/* HEADER */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold backdrop-blur-md">
          <Zap className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
          Gói Dịch Vụ
        </div>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
          Bảng giá linh hoạt cho mọi mục tiêu
        </h2>
        <p className="text-xs md:text-sm text-zinc-400">
          Chọn gói phù hợp để bắt đầu hành trình lột xác vóc dáng ngay hôm nay.
        </p>

        {/* NÚT CHUYỂN ĐỔI THÁNG / NĂM */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span
            className={`text-xs font-medium ${!isYearly ? "text-white" : "text-zinc-500"}`}
          >
            Thanh toán theo tháng
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="w-12 h-6 rounded-full bg-zinc-800 border border-white/10 p-1 flex items-center transition duration-300 cursor-pointer"
          >
            <div
              className={`w-4 h-4 rounded-full bg-blue-500 transition-transform duration-300 ${
                isYearly ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-xs font-medium flex items-center gap-1.5 ${isYearly ? "text-white" : "text-zinc-500"}`}
          >
            Thanh toán theo năm
            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
              Tiết kiệm 20%
            </span>
          </span>
        </div>
      </div>

      {/* CARDS GIÁ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, idx) => (
          <div
            key={plan.id}
            className={`relative rounded-3xl p-6 md:p-8 flex flex-col justify-between border transition duration-300 backdrop-blur-xl ${
              plan.popular
                ? "bg-gradient-to-b from-blue-950/40 via-zinc-900/90 to-zinc-950/90 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-105 z-10"
                : "bg-zinc-950/80 border-white/10 hover:border-white/20"
            }`}
          >
            {/* BADGE NỔI BẬT */}
            {plan.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border border-blue-400/40">
                <Sparkles className="w-3 h-3 fill-white" />
                {plan.badge}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                {plan.popular ? (
                  <Zap className="w-5 h-5 text-blue-400 fill-blue-400" />
                ) : idx === 2 ? (
                  <Crown className="w-5 h-5 text-blue-400" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-zinc-500" />
                )}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6 min-h-[36px]">
                {plan.desc}
              </p>

              {/* GIÁ CƯỚC */}
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-3xl md:text-4xl font-black text-white">
                  {isYearly ? plan.priceYear : plan.priceMonth}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  {plan.priceMonth === "0" ? "" : "đ / tháng"}
                </span>
              </div>

              {/* DANH SÁCH TÍNH NĂNG */}
              <div className="space-y-3 pt-4 border-t border-white/10 mb-8">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Quyền lợi bao gồm:
                </p>
                {plan.features.map((feat, fIdx) => (
                  <div
                    key={fIdx}
                    className="flex items-start gap-2.5 text-xs text-zinc-300"
                  >
                    <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NÚT HÀNH ĐỘNG */}
            <button
              onClick={() => handleCheckout(plan.id)}
              disabled={loadingPlan === plan.id}
              className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                plan.popular
                  ? "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_4px_20px_rgba(37,99,235,0.4)]"
                  : "bg-white text-black hover:bg-zinc-200"
              } disabled:opacity-50 cursor-pointer`}
            >
              {loadingPlan === plan.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                plan.buttonText
              )}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
