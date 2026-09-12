"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Dumbbell, Bot, Sparkles, Activity } from "lucide-react";

interface FeatureBlockProps {
  title: string;
  description: string;
  imgSrc: string;
  badge: string;
  icon: React.ElementType;
  isReversed?: boolean;
}

function ZoomImageBlock({
  title,
  description,
  imgSrc,
  badge,
  icon: Icon,
  isReversed,
}: FeatureBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.82, 1.08, 0.92]);
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    [0.3, 1, 1, 0.3],
  );

  return (
    <div ref={containerRef} className="py-20 flex items-center justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center w-full">
        {/* CỘT NỘI DUNG */}
        <div
          className={`space-y-4 ${isReversed ? "lg:order-2" : "lg:order-1"}`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold backdrop-blur-md">
            <Icon className="w-3.5 h-3.5" />
            {badge}
          </div>
          <h3 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
            {title}
          </h3>
          <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
            {description}
          </p>
        </div>

        {/* CỘT ẢNH VỚI HIỆU ỨNG ZOOM */}
        <div
          className={`flex justify-center ${isReversed ? "lg:order-1" : "lg:order-2"}`}
        >
          <motion.div
            style={{ scale, opacity }}
            className="relative w-full aspect-[16/10] max-w-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900/80 backdrop-blur-sm group"
          >
            <Image
              src={imgSrc}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function AppOverview() {
  return (
    <section className="relative w-full text-white py-24 px-4 md:px-8 overflow-hidden border-y border-white/10">
      {/* 1. ẢNH NỀN HERO-BG2 PHỦ TOÀN BỘ SECTION */}
      <Image
        src="/hero-bg2.jpg"
        alt="App Overview Background"
        fill
        className="object-cover object-center -z-20"
        sizes="100vw"
      />

      {/* 2. LỚP PHỦ TỐI TĂNG ĐỘ TƯƠNG PHẢN CHO NỘI DUNG */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] -z-10" />

      {/* 3. KHUNG NỘI DUNG CHÍNH (GIỮ NGUYÊN MAX-WIDTH) */}
      <div className="max-w-6xl mx-auto relative z-10">
        {/* HEADER TỔNG QUAN APP */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-zinc-200 text-xs font-medium backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Nền tảng Thể hình Thông minh 2026
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
            Mọi thứ bạn cần để làm chủ vóc dáng
          </h2>
          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            Kết hợp giữa thư viện 1.300+ bài tập chuẩn hóa, bộ công cụ lên lịch
            tập cá nhân và trợ lý AI Personal Trainer đồng hành 24/7.
          </p>
        </div>

        {/* DANH SÁCH ẢNH ZOOM THEO LUỒNG CUỘN */}
        <div className="space-y-6">
          <ZoomImageBlock
            badge="Thư viện Bài tập"
            icon={Dumbbell}
            title="Hơn 1.300+ bài tập có hình ảnh & GIF chi tiết"
            description="Dễ dàng tra cứu động tác theo từng nhóm cơ chính, nhóm cơ phụ và thiết bị tập luyện. Hướng dẫn chuẩn Form giúp hạn chế tối đa chấn thương."
            imgSrc="/2.png"
          />

          <ZoomImageBlock
            badge="Trợ lý AI PT 24/7"
            icon={Bot}
            title="Tư vấn dinh dưỡng & Lịch tập riêng biệt"
            description="Hỏi đáp trực tiếp với Huấn luyện viên AI về cách tính Macro, TDEE, sửa lỗi sai khi tập luyện hoặc thiết lập thực đơn tăng cơ giảm mỡ."
            imgSrc="/3.png"
            isReversed
          />

          <ZoomImageBlock
            badge="Quản lý Lịch tập"
            icon={Activity}
            title="Tự thiết kế & Theo dõi tiến độ buổi tập"
            description="Lên kế hoạch tập luyện theo ngày, lưu trữ lịch sử nâng tạ và tùy chỉnh cường độ tập theo mục tiêu cá nhân của riêng bạn."
            imgSrc="/4.png"
          />
        </div>
      </div>
    </section>
  );
}
