"use client";

import { startTransition, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import CustomWorkoutSession from "./CustomWorkoutSession";
import { Trash2, Calendar, Dumbbell, Flame, Timer, X } from "lucide-react";
import { RoutineExerciseItem } from "./CustomBuilder"; // Import kiểu dữ liệu chuẩn
import { DatasetExercise } from "@/types/exercise";

// Định nghĩa tạm thời các kiểu dữ liệu nếu cần
interface Program {
  id: string;
  title: string;
  createdAt: string;
  items: RoutineExerciseItem[]; // Dùng kiểu chuẩn đã import
}

const getExerciseImage = (exercise: DatasetExercise) => {
  const fileName = exercise.image?.split("/").pop();
  return fileName ? `/images/${fileName}` : "/images/placeholder.jpg";
};

export default function CustomPrograms() {
  const { user } = useUser();
  // 1. Dùng initializer function cho useState để tránh dùng useEffect để set state ban đầu
  const [programs, setPrograms] = useState<Program[]>(() => {
    return [];
  });
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [previewExercise, setPreviewExercise] =
    useState<DatasetExercise | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    const stored = localStorage.getItem(`nova:${user.id}:custom-routines`);
    startTransition(() => setPrograms(stored ? JSON.parse(stored) : []));
  }, [user?.id]);
  const deleteProgram = (id: string) => {
    const updated = programs.filter((p) => p.id !== id);
    setPrograms(updated);
    if (user?.id)
      localStorage.setItem(
        `nova:${user.id}:custom-routines`,
        JSON.stringify(updated),
      );
  };

  if (activeProgram) {
    return (
      <CustomWorkoutSession
        routineId={activeProgram.id}
        title={activeProgram.title}
        items={activeProgram.items}
        onExit={() => setActiveProgram(null)}
      />
    );
  }

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black">
          Giáo án của tôi ({programs.length})
        </h2>
      </div>

      {programs.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-white/2">
          <Dumbbell className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">Bạn chưa tạo giáo án nào.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {programs.map((prog) => (
            <div
              key={prog.id}
              className="bg-zinc-900 border border-white/10 p-5 rounded-2xl flex justify-between items-center hover:border-blue-500/50 transition-all"
            >
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-white">{prog.title}</h3>
                <p className="text-xs text-zinc-400 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{" "}
                    {new Date(prog.createdAt).toLocaleDateString()}
                  </span>
                  <span>• {prog.items.length} bài tập</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {prog.items.map((item, index) => (
                    <button
                      key={item.routineId || index}
                      onClick={() => setPreviewExercise(item.exercise)}
                      className="flex items-center gap-2 bg-black/30 hover:bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 text-left"
                    >
                      <Image
                        src={getExerciseImage(item.exercise)}
                        alt={item.exercise.name}
                        width={32}
                        height={32}
                        unoptimized
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <span className="text-[11px] text-white capitalize max-w-32 truncate">
                        {item.exercise.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveProgram(prog)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold transition hover:bg-blue-500"
                >
                  Bắt đầu tập
                </button>
                <button
                  onClick={() => deleteProgram(prog.id)}
                  className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-xl transition"
                  title="Xóa giáo án"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                aria-label="Đóng xem trước"
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
                  <Flame className="w-3 h-3 text-blue-400" /> Bài tập custom
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-sky-400" /> Preview
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
