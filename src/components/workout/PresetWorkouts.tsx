"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Play, Dumbbell, Sparkles, X, Flame, Timer } from "lucide-react";
import exercisesData from "@/data/exercises.json"; // Import dữ liệu để tra cứu
import { useWorkoutContext } from "@/context/WorkoutContext";
import {
  formatExerciseName,
  translateExerciseInstructions,
} from "@/data/exerciseTranslations";

// Định nghĩa kiểu dữ liệu cho bài tập trong exercises.json
interface RawExercise {
  id: string;
  name: string;
  image: string;
  gif_url?: string;
  target?: string;
  body_part?: string;
  equipment?: string;
  instructions?: {
    en?: string;
  };
}

// Hàm tìm ảnh dựa trên ID
const findImageUrlById = (id: string) => {
  const exercise = (exercisesData as RawExercise[]).find((ex) => ex.id === id);
  if (exercise && exercise.image) {
    return `/${exercise.image}`; // Trả về đường dẫn chuẩn (ví dụ: /images/0001-...)
  }
  return null;
};

const normalizeImagePath = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `/${path}`;
};

const findMatchingExercise = (exercise: ExerciseDetail) => {
  const normalizedName = exercise.name.trim().toLowerCase();
  const normalizedCompactName = normalizedName.replace(/[^a-z0-9]+/g, "");

  return (exercisesData as RawExercise[]).find((item) => {
    const itemName = item.name.trim().toLowerCase();
    const compactItemName = itemName.replace(/[^a-z0-9]+/g, "");
    return (
      item.id === exercise.id ||
      itemName === normalizedName ||
      compactItemName.includes(normalizedCompactName) ||
      normalizedCompactName.includes(compactItemName)
    );
  });
};

const findImageUrlByExercise = (exercise: ExerciseDetail) => {
  const match = findMatchingExercise(exercise);

  return match?.image ? `/${match.image}` : findImageUrlById(exercise.id);
};

const findGifUrlByExercise = (exercise: ExerciseDetail) => {
  const match = findMatchingExercise(exercise);
  const path = match?.gif_url || exercise.gifUrl;
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `/${path}`;
};

export interface NestedExerciseInfo {
  id?: string;
  name?: string;
  imageUrl?: string | null;
  mediaUrl?: string | null;
  image?: string | null;
  gifUrl?: string | null;
  thumbnail?: string | null;
  images?: string[];
}

export interface ExerciseDetail {
  id: string;
  name: string;
  category?: string;
  imageUrl?: string | null;
  mediaUrl?: string | null;
  image?: string | null;
  gifUrl?: string | null;
  thumbnail?: string | null;
  images?: string[];
  exercise?: NestedExerciseInfo | null;
  sets: number;
  reps: number;
  restSec: number;
}

export interface WorkoutItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  category: string;
  exerciseCount: number;
  duration: string;
  exercises?: ExerciseDetail[];
  lastSets?: {
    exerciseId: string;
    setNumber: number;
    weightKg: number | null;
    repsDone: number | null;
  }[];
}

interface PresetWorkoutsProps {
  initialWorkouts?: WorkoutItem[];
}

const CATEGORIES = [
  { id: "All", label: "Tất cả" },
  { id: "Chest", label: "Ngực (Chest)" },
  { id: "Back", label: "Lưng (Back)" },
  { id: "Legs", label: "Chân (Legs)" },
  { id: "Shoulders", label: "Vai (Shoulders)" },
  { id: "Biceps", label: "Tay Trước (Biceps)" },
  { id: "Abs", label: "Bụng (Abs)" },
];

function ExerciseThumbnail({ ex }: { ex: ExerciseDetail }) {
  const [hasError, setHasError] = useState(false);

  // LOGIC MỚI: Ưu tiên lấy ảnh từ dữ liệu sẵn có,
  // nếu không có thì dùng ID để tìm trong exercises.json
  const rawPath = normalizeImagePath(
    ex.image || ex.exercise?.image || findImageUrlByExercise(ex),
  );

  const imageSrc = rawPath || "";
  // Nếu không có đường dẫn hoặc file bị lỗi -> Hiển thị icon Tạ fallback
  if (!imageSrc || hasError) {
    return (
      <div className="w-full h-full bg-zinc-800/80 flex items-center justify-center rounded-xl border border-white/10">
        <Dumbbell className="w-6 h-6 text-blue-400" />
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={formatExerciseName(ex.name)}
      width={160}
      height={160}
      unoptimized
      className="w-full h-full object-cover rounded-xl"
      onError={() => setHasError(true)}
    />
  );
}

export default function PresetWorkouts({
  initialWorkouts = [],
}: PresetWorkoutsProps) {
  const { setActiveWorkout } = useWorkoutContext(); // Dùng Context
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [previewWorkout, setPreviewWorkout] = useState<WorkoutItem | null>(
    null,
  );
  const [previewExercise, setPreviewExercise] = useState<ExerciseDetail | null>(
    null,
  );

  const filteredWorkouts = initialWorkouts.filter((workout: WorkoutItem) => {
    if (selectedCategory === "All") return true;
    return workout.category
      .toLowerCase()
      .includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="space-y-8">
      {/* 1. Thanh lọc danh mục */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-none border-b border-white/10">
        <span className="text-xs text-zinc-400 font-bold mr-2 uppercase shrink-0 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Danh
          mục:
        </span>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-xs transition-all duration-300 cursor-pointer shrink-0 backdrop-blur-xl relative overflow-hidden ${
                isActive
                  ? "bg-blue-600 text-white font-extrabold border border-blue-400/60 shadow-[0_0_20px_rgba(59,130,246,0.4),inset_0_1px_2px_rgba(255,255,255,0.8)] scale-105"
                  : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/15 hover:border-white/25 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
              }`}
            >
              <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 2. Danh sách Preset Workouts */}
      {filteredWorkouts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkouts.map((workout: WorkoutItem) => (
            <Card
              key={workout.id}
              onClick={() => setPreviewWorkout(workout)}
              className="relative overflow-hidden rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:border-zinc-700 hover:bg-zinc-800/80 transition-all duration-500 group flex flex-col justify-between cursor-pointer"
            >
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/15 transition-all duration-500 pointer-events-none" />

              <CardHeader className="space-y-3 relative z-10">
                <div className="flex justify-between items-start">
                  <Badge
                    variant="outline"
                    className="bg-zinc-800/80 border border-zinc-700 text-blue-400 font-bold text-[10px] uppercase px-3 py-1 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                  >
                    {workout.badge}
                  </Badge>
                </div>

                <CardTitle className="text-xl font-black text-white group-hover:text-blue-300 transition-colors duration-300">
                  {workout.title}
                </CardTitle>

                <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed min-h-9">
                  {workout.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-zinc-800 text-xs text-zinc-300">
                  <div className="flex items-center gap-2 bg-zinc-800/70 border border-zinc-700 p-2.5 rounded-2xl">
                    <Dumbbell className="w-4 h-4 text-blue-400" />
                    <span className="font-medium">
                      {workout.exerciseCount} Bài tập
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-800/70 border border-zinc-700 p-2.5 rounded-2xl">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span className="font-medium">{workout.duration}</span>
                  </div>
                </div>

                <Button className="w-full relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_6px_20px_rgba(37,99,235,0.25)] border border-blue-500/50 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] rounded-2xl text-xs py-3 cursor-pointer group/btn">
                  <span className="absolute inset-x-0 top-0 h-px bg-white/40" />
                  <Play className="w-4 h-4 fill-current transition-transform duration-300 group-hover/btn:scale-110" />
                  Xem chi tiết & Tập
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
          <p className="text-zinc-400 text-sm">
            Không tìm thấy giáo án nào cho mục{" "}
            <span className="text-blue-400 font-bold">{selectedCategory}</span>.
          </p>
        </div>
      )}

      {/* 3. Pop-up Modal Preview Bài Tập */}
      {previewWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-zinc-900/90 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[85vh] flex flex-col backdrop-blur-2xl">
            <div className="flex justify-between items-start pb-4 border-b border-white/10">
              <div className="space-y-1">
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] uppercase px-3 py-0.5 rounded-full">
                  {previewWorkout.badge}
                </Badge>
                <h3 className="text-2xl font-black text-white">
                  {previewWorkout.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {previewWorkout.description}
                </p>
              </div>

              <button
                onClick={() => setPreviewWorkout(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/20 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                Danh sách bài tập ({previewWorkout.exercises?.length || 0})
              </span>

              {previewWorkout.exercises &&
              previewWorkout.exercises.length > 0 ? (
                previewWorkout.exercises.map((ex, index) => (
                  <div
                    key={ex.id || index}
                    onClick={() => setPreviewExercise(ex)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPreviewExercise(ex);
                      }
                    }}
                    className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                  >
                    <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                      <ExerciseThumbnail ex={ex} />
                    </div>

                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-bold text-white line-clamp-1 capitalize">
                        {index + 1}. {formatExerciseName(ex.name)}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                        <span className="flex items-center gap-1 text-blue-300 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                          <Flame className="w-3 h-3" /> {ex.sets} Sets ×{" "}
                          {ex.reps} Reps
                        </span>
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Timer className="w-3 h-3 text-sky-400" /> Nghỉ{" "}
                          {ex.restSec}s
                        </span>
                      </div>
                      {previewWorkout.lastSets?.filter(
                        (set) => set.exerciseId === ex.id,
                      ).length ? (
                        <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-emerald-300">
                          {previewWorkout.lastSets
                            .filter((set) => set.exerciseId === ex.id)
                            .map((set) => (
                              <span key={`${ex.id}-${set.setNumber}`}>
                                Set {set.setNumber}: {set.weightKg ?? 0}kg x{" "}
                                {set.repsDone ?? 0} reps
                              </span>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-zinc-500 py-6">
                  Chưa có bài tập nào được liên kết.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setPreviewWorkout(null)}
                className="w-1/3 bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 rounded-2xl py-3 text-xs"
              >
                Đóng
              </Button>

              <Link
                href={`/programs/${previewWorkout.id}`}
                onClick={() => setActiveWorkout(previewWorkout)}
                className="w-2/3"
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-[0_4px_20px_rgba(37,99,235,0.4)] rounded-2xl py-3 text-xs flex items-center justify-center gap-2">
                  <Play className="w-4 h-4 fill-current" /> Xem preview & bắt
                  đầu
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {previewExercise && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white capitalize truncate">
                {formatExerciseName(previewExercise.name)}
              </h3>
              <button
                onClick={() => setPreviewExercise(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition"
                aria-label="Đóng xem trước bài tập"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-64 bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-2">
              {findGifUrlByExercise(previewExercise) ? (
                <Image
                  src={findGifUrlByExercise(previewExercise) || ""}
                  alt={formatExerciseName(previewExercise.name)}
                  width={480}
                  height={256}
                  unoptimized
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
              ) : (
                <Image
                  src={
                    normalizeImagePath(
                      previewExercise.image ||
                        previewExercise.exercise?.image ||
                        findImageUrlByExercise(previewExercise),
                    ) || "/images/placeholder.jpg"
                  }
                  alt={formatExerciseName(previewExercise.name)}
                  width={480}
                  height={256}
                  unoptimized
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
              )}
            </div>

            <div className="space-y-1.5 text-xs text-zinc-300">
              <p>
                <strong className="text-white">Target:</strong>{" "}
                <span className="capitalize">
                  {findMatchingExercise(previewExercise)?.target ||
                    findMatchingExercise(previewExercise)?.body_part ||
                    previewExercise.category ||
                    "Chưa xác định"}
                </span>{" "}
                | <strong className="text-white">Equipment:</strong>{" "}
                <span className="capitalize">
                  {findMatchingExercise(previewExercise)?.equipment ||
                    "Chưa xác định"}
                </span>
              </p>
              <div className="max-h-24 overflow-y-auto text-zinc-400 text-[11px] bg-zinc-950/50 p-3 rounded-xl border border-white/5 leading-relaxed">
                {translateExerciseInstructions(
                  previewExercise.name,
                  findMatchingExercise(previewExercise)?.instructions?.en,
                )}
              </div>
              <div className="flex items-center gap-3 pt-1 text-zinc-400">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-blue-400" />{" "}
                  {previewExercise.sets} Sets x {previewExercise.reps} Reps
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-sky-400" /> Nghỉ{" "}
                  {previewExercise.restSec}s
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
