import { ArrowRight } from "lucide-react";
import Link from "next/link";
import ReviewCard from "./ReviewCard";

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-between px-8 md:px-16 pt-24 pb-12 bg-cover bg-center">
      {/* Phủ lớp xám đen giúp tăng độ tương phản của chữ */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 max-w-7xl w-full mx-auto flex flex-col md:flex-row items-end justify-between gap-12">
        {/* Left Side Content */}
        <div className="max-w-xl text-white mb-6">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Tập luyện cho cơ thể của bạn cùng NOVA
          </h1>
          <p className="text-base md:text-lg text-white/80 mb-8 font-light leading-relaxed">
            Lộ trình tập luyện cá nhân hóa, theo dõi thông minh và hướng dẫn từ
            chuyên gia — tất cả trong một nền tảng fitness mạnh mẽ.
          </p>
          <Link
            href="/programs"
            className="inline-flex w-fit items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3.5 rounded-full hover:bg-blue-500 transition-all duration-300 text-sm shadow-[0_4px_20px_rgba(37,99,235,0.4)] cursor-pointer"
          >
            Khám phá
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Right Side Review Card */}
        <div className="w-full md:w-auto">
          <ReviewCard />
        </div>
      </div>
    </section>
  );
}
