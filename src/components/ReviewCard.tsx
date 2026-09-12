"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function ReviewCard() {
  const [showStory, setShowStory] = useState(false);

  return (
    <div className="bg-white/15 backdrop-blur-xl border border-white/20 p-6 rounded-3xl max-w-sm text-white shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        {/* User Avatars */}
        <div className="flex -space-x-2">
          <Image
            unoptimized
            width={36}
            height={36}
            className="w-9 h-9 rounded-full border-2 border-white/40 object-cover"
            src="https://i.pravatar.cc/100?img=33"
            alt="User"
          />
          <Image
            unoptimized
            width={36}
            height={36}
            className="w-9 h-9 rounded-full border-2 border-white/40 object-cover"
            src="https://i.pravatar.cc/100?img=47"
            alt="User"
          />
          <Image
            unoptimized
            width={36}
            height={36}
            className="w-9 h-9 rounded-full border-2 border-white/40 object-cover"
            src="https://i.pravatar.cc/100?img=12"
            alt="User"
          />
        </div>

        {/* Action Pills */}
        <div className="flex gap-1 bg-white/10 p-1 rounded-full text-xs border border-white/10">
          <button
            type="button"
            onClick={() => setShowStory(false)}
            className={`px-3 py-1 rounded-full font-medium transition ${
              !showStory
                ? "bg-white/20 text-white"
                : "text-white/70 hover:text-white"
            }`}
          >
            Reviews
          </button>
          <button
            type="button"
            onClick={() => setShowStory(true)}
            className={`px-3 py-1 rounded-full transition ${
              showStory
                ? "bg-white/20 text-white"
                : "text-white/70 hover:text-white"
            }`}
          >
            Stories
          </button>
        </div>
      </div>

      <p className="text-sm font-light text-white/90 mb-6 leading-relaxed">
        {showStory
          ? "NOVA là ứng dụng trợ lý huấn luyện thông minh, giúp bạn tối ưu hiệu suất và bứt phá giới hạn nhờ hệ thống giáo án cá nhân hóa cùng lộ trình theo dõi chuyên sâu."
          : "Đây là 1 ứng dụng tuyệt vời cho dân tập gym. -Đánh giá từ người dùng NOVA"}
      </p>

      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black tracking-tight">4.9</span>
          <Star className="w-5 h-5 fill-amber-400 text-amber-400 mb-1" />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-white/60 mb-1 font-semibold">
          {showStory ? "( CÂU CHUYỆN )" : "( ĐÁNH GIÁ )"}
        </span>
      </div>
    </div>
  );
}
