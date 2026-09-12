"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import PresetWorkouts, {
  WorkoutItem,
} from "@/components/workout/PresetWorkouts";
import type { RoutineExerciseItem } from "@/components/workout/CustomBuilder";
import {
  Sparkles,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  Play,
  X,
  Flame,
  Timer,
} from "lucide-react";
import CustomWorkoutSession from "@/components/workout/CustomWorkoutSession";
import { DatasetExercise } from "@/types/exercise";

interface SavedRoutine {
  id: string;
  title: string;
  createdAt: string;
  totalSets: number;
  items: RoutineExerciseItem[];
}

interface ProgramsProps {
  initialWorkouts?: WorkoutItem[];
}

const getExerciseImage = (exercise: DatasetExercise) => {
  const fileName = exercise.image?.split("/").pop();
  return fileName ? `/images/${fileName}` : "/images/placeholder.jpg";
};

function SavedRoutinesList() {
  const [routines, setRoutines] = useState<SavedRoutine[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewExercise, setPreviewExercise] =
    useState<DatasetExercise | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<SavedRoutine | null>(null);

  useEffect(() => {
    const loadRoutines = () => {
      try {
        const data = localStorage.getItem("nova:custom-routines");
        if (data) setRoutines(JSON.parse(data));
      } catch (e) {
        console.error("Lỗi đọc dữ liệu giáo án:", e);
      }
    };
    loadRoutines();
  }, []);

  const handleDelete = (id: string) => {
    const updated = routines.filter((r) => r.id !== id);
    setRoutines(updated);
    localStorage.setItem("nova:custom-routines", JSON.stringify(updated));
  };

  if (routines.length === 0) {
    return (
      <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center space-y-3 bg-zinc-900/40 max-w-2xl mx-auto">
        <div className="w-14 h-14 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white">
          Chưa có giáo án nào được lưu
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
          Bạn có thể tự tạo giáo án riêng tại tab{" "}
          <span className="text-blue-400 font-bold">Custom</span> và bấm
          &quot;Lưu Bộ Bài Tập Tùy Chỉnh&quot;.
        </p>
      </div>
    );
  }

  if (activeRoutine) {
    return (
      <CustomWorkoutSession
        routineId={activeRoutine.id}
        title={activeRoutine.title}
        items={activeRoutine.items}
        onExit={() => setActiveRoutine(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {routines.map((routine) => {
        const isExpanded = expandedId === routine.id;
        const dateStr = new Date(routine.createdAt).toLocaleDateString(
          "vi-VN",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          },
        );

        return (
          <div
            key={routine.id}
            className="bg-zinc-900/80 border border-white/10 backdrop-blur-xl rounded-2xl p-5 shadow-xl transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">
                  {routine.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" /> {dateStr}
                  </span>
                  <span>•</span>
                  <span className="text-zinc-300 font-semibold">
                    {routine.items.length} Bài tập
                  </span>
                  <span>•</span>
                  <span className="text-blue-400 font-semibold">
                    {routine.totalSets} Sets
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveRoutine(routine)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Tập luyện
                </button>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : routine.id)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(routine.id)}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                  title="Xóa giáo án này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                {routine.items.map((item, idx) => (
                  <div
                    key={item.routineId || idx}
                    onClick={() => setPreviewExercise(item.exercise)}
                    className="flex items-center justify-between gap-3 bg-zinc-950/60 p-3 rounded-xl border border-white/5 text-xs cursor-pointer hover:bg-white/10 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400 font-bold">
                        #{idx + 1}
                      </span>
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white/10 shrink-0">
                        <Image
                          src={getExerciseImage(item.exercise)}
                          alt={item.exercise.name}
                          fill
                          sizes="44px"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <span className="font-bold text-white capitalize">
                        {item.exercise.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <span>
                        <strong className="text-blue-400">{item.sets}</strong>{" "}
                        Sets
                      </span>
                      <span>|</span>
                      <span>
                        <strong className="text-white">{item.reps}</strong> Reps
                      </span>
                      <span>|</span>
                      <span className="text-sky-400 font-bold">
                        {item.restSec}s nghỉ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {previewExercise && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white capitalize truncate">
                {previewExercise.name}
              </h3>
              <button
                onClick={() => setPreviewExercise(null)}
                className="p-1.5 rounded-full bg-white/10 text-zinc-300"
                aria-label="Đóng xem trước bài tập"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full h-64 bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-2">
              <Image
                src={getExerciseImage(previewExercise)}
                alt={previewExercise.name}
                width={480}
                height={256}
                unoptimized
                className="max-h-full max-w-full object-contain rounded-xl"
              />
            </div>
            <div className="space-y-1.5 text-xs text-zinc-300">
              <p>
                <strong className="text-white">Target:</strong>{" "}
                <span className="capitalize">{previewExercise.target}</span> |{" "}
                <strong className="text-white">Equipment:</strong>{" "}
                <span className="capitalize">{previewExercise.equipment}</span>
              </p>
              <div className="max-h-24 overflow-y-auto text-zinc-400 text-[11px] bg-zinc-950/50 p-3 rounded-xl border border-white/5 leading-relaxed">
                {previewExercise.instructions?.en ||
                  "Chưa có hướng dẫn cho bài tập này."}
              </div>
              <div className="flex items-center gap-3 pt-1 text-zinc-400">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-blue-400" /> Xem chi tiết bài
                  tập
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-sky-400" /> Có thể tập ngay
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

void SavedRoutinesList;

export default function Programs({ initialWorkouts = [] }: ProgramsProps) {
  return (
    <section className="py-12 md:py-20 px-4 md:px-8 max-w-7xl mx-auto text-white min-h-screen">
      {/* Header - Căn giữa */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-blue-300 font-bold bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />{" "}
          Fitness Workouts & Builder
        </span>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-sm">
          Tập luyện theo cách của bạn
        </h2>
        <p className="text-zinc-300/80 text-sm leading-relaxed">
          Lựa chọn giáo án có sẵn và bắt đầu buổi tập tiếp theo của bạn.
        </p>
      </div>

      <PresetWorkouts initialWorkouts={initialWorkouts} />
    </section>
  );
}
