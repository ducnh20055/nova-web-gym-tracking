"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  Dumbbell,
  Flame,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
  Timer,
  X,
} from "lucide-react";
import { RoutineExerciseItem } from "./CustomBuilder";
import { DatasetExercise } from "@/types/exercise";
import exercisesData from "@/data/exercises.json";
import {
  formatExerciseName,
  translateExerciseInstructions,
} from "@/data/exerciseTranslations";

interface WorkoutSet {
  id: string;
  previous: string;
  kg: string;
  reps: string;
  completed: boolean;
}

interface SessionExercise {
  id: string;
  name: string;
  image: string;
  exercise: DatasetExercise;
  sets: WorkoutSet[];
  reps: number;
  restSec: number;
}

interface CompletionSummary {
  duration: number;
  volume: number;
  completedSets: number;
}

interface LastSet {
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  repsDone: number | null;
}

const getImage = (exercise: DatasetExercise) => {
  const fileName = exercise.image?.split("/").pop();
  return fileName ? `/images/${fileName}` : "/images/placeholder.jpg";
};

const getGif = (exercise: DatasetExercise) => {
  const fileName = exercise.gif_url?.split("/").pop();
  return fileName ? `/videos/${fileName}` : null;
};

export default function CustomWorkoutSession({
  routineId,
  title,
  items,
  lastSets = [],
  onExit,
}: {
  routineId: string;
  title: string;
  items: RoutineExerciseItem[];
  lastSets?: LastSet[];
  onExit: (() => void) | string;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [completion, setCompletion] = useState<CompletionSummary | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [selectedExercise, setSelectedExercise] =
    useState<SessionExercise | null>(null);
  const [exerciseMenuId, setExerciseMenuId] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exercises, setExercises] = useState<SessionExercise[]>(() =>
    items.map((item) => ({
      id: item.routineId,
      name: item.exercise.name,
      image: getImage(item.exercise),
      exercise: item.exercise,
      reps: item.reps,
      restSec: item.restSec,
      sets: Array.from({ length: item.sets }).map((_, index) => {
        const previous = lastSets.find(
          (set) =>
            set.exerciseId === item.exercise.id && set.setNumber === index + 1,
        );
        return {
          id: `${item.routineId}-set-${index}`,
          previous: previous
            ? `${previous.weightKg ?? 0}kg x ${previous.repsDone ?? 0}`
            : "",
          kg: String(previous?.weightKg ?? 0),
          reps: String(previous?.repsDone ?? item.reps),
          completed: false,
        };
      }),
    })),
  );

  const handleUpdateRoutine = async () => {
    if (isUpdating || exercises.length === 0) return;
    setIsUpdating(true);
    try {
      const response = await fetch("/api/custom-db", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: routineId,
          title,
          items: exercises.map((exercise) => ({
            exerciseId: exercise.exercise.id,
            sets: exercise.sets.length,
            reps: Number(exercise.reps) || 1,
            restSec: exercise.restSec,
          })),
        }),
      });
      if (!response.ok) throw new Error("Không thể cập nhật giáo án");
      setIsEditing(false);
    } catch {
      alert("Không thể cập nhật giáo án. Vui lòng thử lại.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExit = () => {
    if (typeof onExit === "string") {
      router.push(onExit);
      return;
    }
    onExit();
  };

  const handleCancel = () => {
    if (
      confirm(
        "Bạn có chắc muốn hủy buổi tập? Dữ liệu chưa hoàn thành sẽ không được lưu.",
      )
    ) {
      handleExit();
    }
  };

  const handleFinish = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const sets = exercises.flatMap((exercise) =>
      exercise.sets
        .filter((set) => set.completed)
        .map((set, index) => ({
          exerciseId: exercise.exercise.id,
          setNumber: index + 1,
          weightKg: Number(set.kg) || 0,
          repsDone: Number(set.reps) || 0,
        })),
    );
    try {
      const response = await fetch("/api/workouts/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routineId, duration: seconds, sets }),
      });
      if (!response.ok) throw new Error("Workout was not saved");
      setCompletion({
        duration: seconds,
        volume: totalVolume,
        completedSets: sets.length,
      });
    } catch {
      alert("Không thể lưu lịch sử workout. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isStarted) return;
    const interval = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [isStarted]);

  useEffect(() => {
    if (!isResting) return;
    const interval = setInterval(() => {
      setRestSeconds((value) => {
        if (value <= 1) {
          setIsResting(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting]);

  const formatTime = (value: number) => {
    const minutes = Math.floor(value / 60);
    const secs = value % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: "kg" | "reps",
    value: string,
  ) => {
    setExercises((previous) =>
      previous.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId
                  ? { ...set, [field]: value.replace(/^-/, "") || "0" }
                  : set,
              ),
            },
      ),
    );
  };

  const parseNumberInput = (value: string) => {
    return value.replace(/^-/, "").replace(/^0+(?=\d)/, "") || "0";
  };

  const toggleSet = (exerciseId: string, setId: string) => {
    setExercises((previous) =>
      previous.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set) => {
            if (set.id !== setId) return set;
            const completed = !set.completed;
            if (completed) {
              setRestSeconds(exercise.restSec);
              setIsResting(true);
            }
            return { ...set, completed };
          }),
        };
      }),
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises((previous) =>
      previous.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const lastSet = exercise.sets[exercise.sets.length - 1];
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              id: `${exercise.id}-set-${Date.now()}`,
              previous: lastSet ? `${lastSet.kg}kg x ${lastSet.reps}` : "",
              kg: lastSet?.kg || "0",
              reps: lastSet?.reps || String(exercise.reps),
              completed: false,
            },
          ],
        };
      }),
    );
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises((previous) =>
      previous.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.sets.length <= 1) {
          return exercise;
        }
        return {
          ...exercise,
          sets: exercise.sets.filter((set) => set.id !== setId),
        };
      }),
    );
  };

  const chooseExercise = (exercise: DatasetExercise) => {
    if (pickerTarget === "add") {
      setExercises((previous) => [
        ...previous,
        {
          id: `${exercise.id}-${Date.now()}`,
          name: exercise.name,
          image: getImage(exercise),
          exercise,
          reps: exerciseSearch ? 0 : 0,
          restSec: 60,
          sets: [
            {
              id: `${exercise.id}-set-${Date.now()}`,
              previous: "",
              kg: "0",
              reps: "0",
              completed: false,
            },
          ],
        },
      ]);
    } else if (pickerTarget) {
      setExercises((previous) =>
        previous.map((item) =>
          item.id === pickerTarget
            ? {
                ...item,
                name: exercise.name,
                image: getImage(exercise),
                exercise,
              }
            : item,
        ),
      );
    }
    setPickerTarget(null);
    setExerciseSearch("");
  };

  const pickerExercises = (exercisesData as DatasetExercise[])
    .filter((exercise) =>
      exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()),
    )
    .slice(0, 60);

  const totalVolume = exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce(
        (sum, set) =>
          set.completed
            ? sum + (Number(set.kg) || 0) * (Number(set.reps) || 0)
            : sum,
        0,
      ),
    0,
  );

  if (completion) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4 text-white">
        <div className="w-full max-w-lg space-y-6 border border-emerald-400/30 bg-zinc-900 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Đã ghi nhận dữ liệu
            </p>
            <h1 className="mt-2 text-3xl font-black">Hoàn thành buổi tập!</h1>
            <p className="mt-2 text-sm text-zinc-400">{title}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/5 p-3">
              <p className="text-xs text-zinc-500">Thời gian</p>
              <p className="mt-1 font-bold">
                {formatTime(completion.duration)}
              </p>
            </div>
            <div className="bg-white/5 p-3">
              <p className="text-xs text-zinc-500">Volume</p>
              <p className="mt-1 font-bold">{completion.volume} kg</p>
            </div>
            <div className="bg-white/5 p-3">
              <p className="text-xs text-zinc-500">Set đã tập</p>
              <p className="mt-1 font-bold">{completion.completedSets}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/progress")}
              className="flex-1 bg-blue-600 px-4 py-3 text-sm font-bold hover:bg-blue-500"
            >
              Xem tiến độ
            </button>
            <button
              onClick={handleExit}
              className="flex-1 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15"
            >
              Về giáo án
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-black px-4 pb-24 pt-20 text-white sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <button
            onClick={handleExit}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
          >
            <span aria-hidden="true">←</span> Giáo án
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">
              {title}
            </h1>
            <p className="mt-1.5 text-xs text-zinc-400">
              Số kg và reps được lấy từ lần tập gần nhất.
            </p>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 rounded-2xl bg-white/10 py-4 text-sm font-bold hover:bg-white/15"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateRoutine}
                  disabled={isUpdating || exercises.length === 0}
                  className="flex-1 rounded-2xl bg-emerald-600 py-4 text-sm font-bold hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdating ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang cập nhật...
                    </span>
                  ) : (
                    "Cập nhật"
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 rounded-2xl border border-white/15 bg-white/10 py-4 text-sm font-bold hover:bg-white/15"
              >
                Chỉnh sửa
              </button>
            )}
            {!isEditing && (
              <button
                onClick={() => setIsStarted(true)}
                className="flex-1 rounded-2xl bg-blue-600 py-4 text-sm font-extrabold hover:bg-blue-500"
              >
                Bắt đầu tập
              </button>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              Bài tập
            </h2>
            {exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Image
                      src={exercise.image}
                      alt={formatExerciseName(exercise.name)}
                      width={48}
                      height={48}
                      unoptimized
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                    <div>
                      <h2 className="wrap-break-word text-sm font-bold leading-5 text-zinc-100 sm:text-base">
                        {index + 1}. {formatExerciseName(exercise.name)}
                      </h2>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {exercise.sets.length} sets × {exercise.reps} reps ·
                        nghỉ {exercise.restSec}s
                      </p>
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setPickerTarget(exercise.id)}
                        className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-200 hover:bg-zinc-700"
                      >
                        Đổi
                      </button>
                      <button
                        onClick={() =>
                          setExercises((previous) =>
                            previous.filter((item) => item.id !== exercise.id),
                          )
                        }
                        className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50">
                  <div
                    className={`grid items-center gap-2 border-b border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-zinc-500 ${isEditing ? "grid-cols-[minmax(3.5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)_2rem]" : "grid-cols-[minmax(3.5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)]"}`}
                  >
                    <span>Set</span>
                    <span>Mức tạ</span>
                    <span>Số reps</span>
                    {isEditing && <span />}
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {exercise.sets.map((set, setIndex) => (
                      <div
                        key={set.id}
                        className={`grid items-center gap-2 px-3 py-2 ${isEditing ? "grid-cols-[minmax(3.5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)_2rem]" : "grid-cols-[minmax(3.5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)]"}`}
                      >
                        <span className="text-xs font-semibold text-zinc-300">
                          Set {setIndex + 1}
                        </span>
                        {isEditing ? (
                          <div className="relative">
                            <input
                              type="number"
                              value={set.kg}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                updateSet(
                                  exercise.id,
                                  set.id,
                                  "kg",
                                  parseNumberInput(event.target.value),
                                )
                              }
                              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 pr-7 text-center text-xs font-semibold text-zinc-100 outline-none focus:border-blue-400"
                              aria-label={`${formatExerciseName(exercise.name)} Set ${setIndex + 1} mức tạ`}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-zinc-500">
                              kg
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-300">
                            {set.kg} kg
                          </span>
                        )}
                        {isEditing ? (
                          <div className="relative">
                            <input
                              type="number"
                              value={set.reps}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                updateSet(
                                  exercise.id,
                                  set.id,
                                  "reps",
                                  parseNumberInput(event.target.value),
                                )
                              }
                              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 pr-9 text-center text-xs font-semibold text-zinc-100 outline-none focus:border-blue-400"
                              aria-label={`${formatExerciseName(exercise.name)} Set ${setIndex + 1} số reps`}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-zinc-500">
                              reps
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-300">
                            {set.reps} reps
                          </span>
                        )}
                        {isEditing && (
                          <button
                            onClick={() => removeSet(exercise.id, set.id)}
                            disabled={exercise.sets.length <= 1}
                            className="mx-auto flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={`Xóa Set ${setIndex + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => addSet(exercise.id)}
                      className="flex w-full items-center justify-center gap-1 border-t border-zinc-800 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                    >
                      <Plus className="h-3.5 w-3.5" /> Thêm set
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isEditing && (
            <button
              onClick={() => setPickerTarget("add")}
              className="w-full rounded-xl border border-dashed border-blue-400/40 bg-blue-500/10 py-3 text-sm font-bold text-blue-300"
            >
              + Thêm bài tập
            </button>
          )}
        </div>
        {pickerTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg space-y-4 rounded-2xl border border-white/15 bg-zinc-900 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Chọn bài tập</h2>
                <button onClick={() => setPickerTarget(null)} aria-label="Đóng">
                  <X />
                </button>
              </div>
              <input
                value={exerciseSearch}
                onChange={(event) => setExerciseSearch(event.target.value)}
                placeholder="Tìm bài tập..."
                className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm"
              />
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {pickerExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => chooseExercise(exercise)}
                    className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-2 text-left hover:bg-white/10"
                  >
                    <Image
                      src={getImage(exercise)}
                      alt={exercise.name}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <span className="text-xs">
                      {formatExerciseName(exercise.name)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-y-auto p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6 pt-4 pb-16">
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-2xl border border-white/15 p-3.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="font-mono font-black">{formatTime(seconds)}</span>
          </div>
          <button
            onClick={handleFinish}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-black disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </span>
            ) : (
              "Hoàn thành"
            )}
          </button>
        </div>

        <div>
          <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">
            Custom workout
          </p>
          <h1 className="text-2xl sm:text-4xl font-black mt-1">{title}</h1>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-white/5 border border-white/15 p-4 rounded-2xl text-center text-xs">
          <div>
            <p className="text-zinc-400">Thời gian</p>
            <p className="font-bold mt-1">{formatTime(seconds)}</p>
          </div>
          <div>
            <p className="text-zinc-400">Khối lượng</p>
            <p className="font-black text-blue-400 mt-1">{totalVolume} kg</p>
          </div>
          <div>
            <p className="text-zinc-400">Bài tập</p>
            <p className="font-bold mt-1">{exercises.length}</p>
          </div>
        </div>

        <div className="space-y-5">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-white/5 border border-white/15 rounded-3xl p-5 space-y-4"
            >
              <div className="relative flex items-center justify-between">
                <button
                  onClick={() => setSelectedExercise(exercise)}
                  className="flex items-center gap-2.5 text-left min-w-0"
                >
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white/10 border border-white/10 shrink-0">
                    <Image
                      src={exercise.image}
                      alt={exercise.name}
                      fill
                      sizes="44px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <Dumbbell className="w-4 h-4 text-blue-400 shrink-0" />
                  <h2 className="text-base font-extrabold truncate">
                    {formatExerciseName(exercise.name)}
                  </h2>
                </button>
                <button
                  onClick={() =>
                    setExerciseMenuId(
                      exerciseMenuId === exercise.id ? null : exercise.id,
                    )
                  }
                  className="p-2 text-zinc-400 hover:text-white"
                  aria-label="Tùy chọn bài tập"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {exerciseMenuId === exercise.id && (
                  <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-white/10 bg-zinc-950 p-1.5 shadow-xl">
                    <button
                      onClick={() => {
                        setPickerTarget(exercise.id);
                        setExerciseMenuId(null);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10"
                    >
                      Thay thế bài tập
                    </button>
                    <button
                      onClick={() => {
                        setExercises((previous) =>
                          previous.filter((item) => item.id !== exercise.id),
                        );
                        setExerciseMenuId(null);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
                    >
                      Xóa bài tập
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-zinc-400 uppercase text-center border-b border-white/10 pb-2">
                <span className="col-span-2 text-left">SET</span>
                <span className="col-span-3 text-left">Lần trước</span>
                <span className="col-span-3">KG</span>
                <span className="col-span-2">REPS</span>
                <span className="col-span-2">✓</span>
              </div>
              <div className="space-y-2">
                {exercise.sets.map((set, index) => (
                  <div
                    key={set.id}
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-2xl text-xs border ${set.completed ? "bg-blue-500/20 border-blue-400/40" : "bg-white/5 border-white/10"}`}
                  >
                    <span className="col-span-2 font-bold text-zinc-400">
                      {index + 1}
                    </span>
                    <span className="col-span-3 text-zinc-400 text-[11px] truncate">
                      {set.previous}
                    </span>
                    <input
                      type="number"
                      value={set.kg}
                      onChange={(event) =>
                        updateSet(
                          exercise.id,
                          set.id,
                          "kg",
                          parseNumberInput(event.target.value),
                        )
                      }
                      className="col-span-3 w-full bg-black/40 border border-white/15 rounded-xl py-1 text-center font-bold"
                    />
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(event) =>
                        updateSet(
                          exercise.id,
                          set.id,
                          "reps",
                          parseNumberInput(event.target.value),
                        )
                      }
                      className="col-span-2 w-full bg-black/40 border border-white/15 rounded-xl py-1 text-center font-bold"
                    />
                    <button
                      onClick={() => toggleSet(exercise.id, set.id)}
                      className={`col-span-2 mx-auto w-8 h-8 rounded-xl flex items-center justify-center ${set.completed ? "bg-blue-500" : "bg-white/10"}`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addSet(exercise.id)}
                className="w-full py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" /> Thêm Set
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setPickerTarget("add")}
          className="w-full rounded-xl border border-blue-500/30 bg-blue-500/15 py-3 text-sm font-bold text-blue-200"
        >
          <Plus className="mr-1 inline h-4 w-4" />
          Thêm bài tập từ thư viện
        </button>

        <button
          onClick={handleCancel}
          className="w-full rounded-xl border border-rose-500/20 bg-rose-500/10 py-3 text-sm font-bold text-rose-300 hover:bg-rose-500/20"
        >
          Hủy buổi tập
        </button>

        {isResting && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-50">
            <div className="bg-black/90 border border-blue-500/40 rounded-[28px] p-3 sm:p-4 flex items-center justify-between shadow-[0_0_25px_rgba(59,130,246,0.2)]">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <span className="font-black text-blue-300 text-lg">
                    {formatTime(restSeconds)}
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold">Thời gian nghỉ</h3>
                  <p className="text-zinc-400 text-xs">
                    Chuẩn bị cho set tiếp theo
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRestSeconds((value) => value + 30)}
                  className="bg-blue-600 px-3.5 py-2.5 rounded-full text-xs font-bold"
                >
                  +30s
                </button>
                <button
                  onClick={() => {
                    setIsResting(false);
                    setRestSeconds(0);
                  }}
                  className="bg-zinc-800 px-4 py-2.5 rounded-full text-xs font-bold"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedExercise && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-zinc-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black capitalize truncate">
                  {formatExerciseName(selectedExercise.name)}
                </h3>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="p-1.5 rounded-full bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="w-full h-64 bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-2">
                {getGif(selectedExercise.exercise) ? (
                  <Image
                    src={getGif(selectedExercise.exercise) || ""}
                    alt={selectedExercise.name}
                    width={480}
                    height={256}
                    unoptimized
                    className="max-h-full max-w-full object-contain rounded-xl"
                  />
                ) : (
                  <Image
                    src={selectedExercise.image}
                    alt={selectedExercise.name}
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
                    {selectedExercise.exercise.target}
                  </span>{" "}
                  | <strong className="text-white">Equipment:</strong>{" "}
                  <span className="capitalize">
                    {selectedExercise.exercise.equipment}
                  </span>
                </p>
                <div className="max-h-24 overflow-y-auto text-zinc-400 text-[11px] bg-zinc-950/50 p-3 rounded-xl border border-white/5 leading-relaxed">
                  {translateExerciseInstructions(
                    selectedExercise.exercise.name,
                    selectedExercise.exercise.instructions?.en,
                  )}
                </div>
                <div className="flex items-center gap-3 pt-1 text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-blue-400" />{" "}
                    {selectedExercise.sets.length} Sets x{" "}
                    {selectedExercise.reps} Reps
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3 text-sky-400" /> Nghỉ{" "}
                    {selectedExercise.restSec}s
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {pickerTarget && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg space-y-4 rounded-2xl border border-white/15 bg-zinc-900 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Thư viện bài tập</h2>
                <button onClick={() => setPickerTarget(null)}>
                  <X />
                </button>
              </div>
              <input
                value={exerciseSearch}
                onChange={(event) => setExerciseSearch(event.target.value)}
                placeholder="Tìm trong 1300 bài tập..."
                className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm"
              />
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {pickerExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => chooseExercise(exercise)}
                    className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-2 text-left hover:bg-white/10"
                  >
                    <Image
                      src={getImage(exercise)}
                      alt={formatExerciseName(exercise.name)}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <span className="text-xs">
                      {formatExerciseName(exercise.name)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
