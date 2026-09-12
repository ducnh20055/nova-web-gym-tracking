"use client";

import { useState, useMemo } from "react";
import { Clock, Flame } from "lucide-react";
import { PRESET_WORKOUTS } from "@/data/presetWorkouts";
import CustomBuilder from "@/components/workout/CustomBuilder";

const CATEGORIES = [
  "All",
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Biceps",
  "Abs",
] as const;

export default function WorkoutPlanner() {
  const [activeTab, setActiveTab] = useState<"preset" | "custom">("preset");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Logic lọc danh sách chương trình mẫu theo nhóm cơ
  const filteredWorkouts = useMemo(() => {
    if (selectedCategory === "All") return PRESET_WORKOUTS;
    return PRESET_WORKOUTS.filter(
      (workout) => workout.category === selectedCategory,
    );
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Thanh chuyển tab */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Lập kế hoạch tập luyện
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Chọn lộ trình có sẵn theo nhóm cơ hoặc tự kết hợp bài tập theo ý
            muốn.
          </p>
        </div>

        {/* Tab Chuyển đổi */}
        <div className="bg-zinc-900 border border-white/10 p-1 rounded-full flex items-center">
          <button
            onClick={() => setActiveTab("preset")}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === "preset"
                ? "bg-white text-black shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Chương trình có sẵn
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === "custom"
                ? "bg-white text-black shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Tự tạo Routine (Custom)
          </button>
        </div>
      </div>

      {/* HIỂN THỊ THEO TAB ĐƯỢC CHỌN */}
      {activeTab === "preset" ? (
        /* TAB 1: CHƯƠNG TRÌNH CÓ SẴN */
        <div className="space-y-6">
          {/* Thanh Filter Nhóm cơ */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-2">
              NHÓM CƠ:
            </span>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900/60 border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Danh sách thẻ Set Bài tập */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition space-y-6"
              >
                <div className="space-y-3">
                  <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[11px] font-semibold rounded-full capitalize">
                    {workout.badge}
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    {workout.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                    {workout.description}
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      {workout.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500" />
                      {workout.exerciseCount} Bài tập
                    </span>
                  </div>

                  <button className="w-full bg-white text-black font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition">
                    Bắt đầu tập
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TAB 2: TỰ TẠO ROUTINE (CUSTOM BUILDER) */
        <CustomBuilder />
      )}
    </div>
  );
}
