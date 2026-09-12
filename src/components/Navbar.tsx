"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  BarChart3,
  Dumbbell,
  Home,
  MessageSquare,
  Layers3,
} from "lucide-react";

export default function Navbar() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto">
      <Link href="/" className="text-2xl font-black tracking-wider text-white">
        NOVA
      </Link>

      <nav className="flex items-center gap-1 md:gap-2 px-2 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs md:text-sm text-white/80">
        <Link href="/dashboard" className="nav-link">
          <Home className="nav-icon" />{" "}
          <span className="hidden md:inline">Bảng điều khiển</span>
        </Link>
        <Link href="/programs" className="nav-link">
          <Dumbbell className="nav-icon" />{" "}
          <span className="hidden md:inline">Chương trình</span>
        </Link>
        <Link href="/routine" className="nav-link">
          <Layers3 className="nav-icon" />{" "}
          <span className="hidden md:inline">Giáo án</span>
        </Link>
        <Link href="/trainer" className="nav-link">
          <MessageSquare className="nav-icon" />{" "}
          <span className="hidden md:inline">Huấn luyện viên</span>
        </Link>
        <Link href="/progress" className="nav-link">
          <BarChart3 className="nav-icon" />{" "}
          <span className="hidden md:inline">Tiến độ</span>
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        {!isLoaded ? (
          /* Khung chờ khi Clerk đang kiểm tra Session */
          <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
        ) : isSignedIn ? (
          /* Đã Đăng Nhập -> Hiện Avatar */
          <UserButton />
        ) : (
          /* Chưa Đăng Nhập -> Hiện Nút Sign In */
          <Link
            href="/auth/sign-in"
            className="bg-white text-black font-semibold px-6 py-2.5 rounded-full hover:bg-white/90 transition text-sm"
          >
            Bắt đầu hành trình
          </Link>
        )}
      </div>
    </header>
  );
}
