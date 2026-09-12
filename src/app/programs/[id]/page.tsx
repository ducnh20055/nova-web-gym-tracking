"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useWorkoutContext } from "@/context/WorkoutContext";
import exercisesData from "@/data/exercises.json";
import { PRESET_WORKOUTS } from "@/data/presetWorkouts";
import type { WorkoutItem } from "@/components/workout/PresetWorkouts";
import {
  ArrowLeft,
  Check,
  Plus,
  Clock,
  Loader2,
  MoreHorizontal,
  Trash2,
  Sparkles,
  X,
  Flame,
  Timer,
} from "lucide-react";

// Định nghĩa interfaces để thay thế any
interface Set {
  id: string;
  previous: string;
  kg: string;
  reps: string;
  completed: boolean;
  entered?: boolean;
}

interface Exercise {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string | null;
  gifUrl?: string | null;
  sets: Set[];
  reps: number;
  restSec: number;
  exercise?: {
    image?: string | null;
    imageUrl?: string | null;
  } | null;
}

interface CompletionSummary {
  duration: number;
  volume: number;
  completedSets: number;
}

interface RawExerciseData {
  id: string;
  name: string;
  image?: string | null;
  imageUrl?: string | null;
  gifUrl?: string | null;
  exercise?: {
    image?: string | null;
    imageUrl?: string | null;
  } | null;
  sets: number;
  reps: number;
  restSec?: number;
}

interface ExerciseAsset {
  id: string;
  name: string;
  image?: string;
  target?: string;
  body_part?: string;
  equipment?: string;
  instructions?: {
    en?: string;
  };
}

const findExerciseAsset = (id: string, name?: string) => {
  const normalizedName = name?.trim().toLowerCase() || "";
  const compactName = normalizedName.replace(/[^a-z0-9]+/g, "");

  return (exercisesData as ExerciseAsset[]).find((item) => {
    const itemName = item.name.trim().toLowerCase();
    const compactItemName = itemName.replace(/[^a-z0-9]+/g, "");
    return (
      item.id === id ||
      itemName === normalizedName ||
      compactItemName.includes(compactName) ||
      compactName.includes(compactItemName)
    );
  });
};

const findLocalExerciseImage = (id: string, name?: string) => {
  const exercise = findExerciseAsset(id, name);
  return exercise?.image ? `/${exercise.image}` : "/images/placeholder.jpg";
};

const getExerciseImage = (rawEx: RawExerciseData) => {
  const localImage = findLocalExerciseImage(rawEx.id, rawEx.name);
  if (localImage !== "/images/placeholder.jpg") return localImage;

  return (
    normalizeImagePath(
      rawEx.image ||
        rawEx.imageUrl ||
        rawEx.exercise?.image ||
        rawEx.exercise?.imageUrl,
    ) || localImage
  );
};

const normalizeImagePath = (path: string | null | undefined) => {
  if (!path) return null;
  return path.startsWith("/") || path.startsWith("http") ? path : `/${path}`;
};

const formatExerciseName = (name: string) =>
  name
    ? name
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : name;

function WorkoutDetailContent() {
  const { activeWorkout } = useWorkoutContext();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const title = searchParams.get("title") || "Giáo án tập luyện";
  const presetId = params.id || searchParams.get("id");
  const fallbackWorkout = useMemo<WorkoutItem | null>(() => {
    const preset = PRESET_WORKOUTS.find((item) => item.id === presetId);
    if (!preset) return null;
    const fallback = (exercisesData as ExerciseAsset[])
      .filter((exercise) =>
        exercise.body_part
          ?.toLowerCase()
          .includes(preset.category.toLowerCase()),
      )
      .slice(0, preset.exerciseCount)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        category: preset.category,
        sets: 4,
        reps: 10,
        restSec: 60,
        image: exercise.image ? `/${exercise.image}` : null,
      }));
    return { ...preset, exercises: fallback };
  }, [presetId]);
  const workout = activeWorkout || fallbackWorkout;

  const [isWorkingOut, setIsWorkingOut] = useState(false);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [isUpdatingPreview, setIsUpdatingPreview] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState<Exercise[] | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [completion, setCompletion] = useState<CompletionSummary | null>(null);
  const [menuExerciseId, setMenuExerciseId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<"add" | string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [exercises, setExercises] = useState<Exercise[]>(
    (workout?.exercises || []).map((rawEx: RawExerciseData) => {
      const lastSets =
        workout?.lastSets?.filter((set) => set.exerciseId === rawEx.id) || [];
      return {
        id: rawEx.id,
        name: rawEx.name,
        image: getExerciseImage(rawEx),
        imageUrl: rawEx.imageUrl,
        gifUrl: rawEx.gifUrl,
        reps: rawEx.reps || 10,
        restSec: rawEx.restSec || 60,
        sets: Array.from({ length: rawEx.sets || 3 }).map((_, i) => ({
          id: `s-${i}`,
          previous: (() => {
            const previous = lastSets.find((set) => set.setNumber === i + 1);
            return previous
              ? `${previous.weightKg ?? 0}kg x ${previous.repsDone ?? 0}`
              : "";
          })(),
          kg: String(
            lastSets.find((set) => set.setNumber === i + 1)?.weightKg ?? 0,
          ),
          reps: String(
            lastSets.find((set) => set.setNumber === i + 1)?.repsDone ??
              rawEx.reps ??
              10,
          ),
          completed: false,
          entered: false,
        })),
        exercise: rawEx.exercise,
      };
    }),
  );

  useEffect(() => {
    if (!workout?.id && !workout?.title) return;
    let cancelled = false;

    const loadLastSets = async () => {
      const params = new URLSearchParams();
      if (workout.id) params.set("routineId", workout.id);
      if (workout.title) params.set("routineTitle", workout.title);

      try {
        const response = await fetch(
          `/api/workouts/complete?${params.toString()}`,
        );
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as {
          lastSets?: WorkoutItem["lastSets"];
        };
        const lastSets = data.lastSets || [];

        setExercises((current) =>
          current.map((exercise) => {
            const exerciseSets = lastSets.filter(
              (set) => set.exerciseId === exercise.id,
            );
            if (exerciseSets.length === 0) return exercise;

            return {
              ...exercise,
              sets: exercise.sets.map((set, index) => {
                const previous = exerciseSets.find(
                  (item) => item.setNumber === index + 1,
                );
                return previous
                  ? {
                      ...set,
                      previous: `${previous.weightKg ?? 0}kg x ${previous.repsDone ?? 0}`,
                      kg: String(previous.weightKg ?? 0),
                      reps: String(previous.repsDone ?? exercise.reps),
                    }
                  : set;
              }),
            };
          }),
        );
      } catch {
        // Giữ giá trị mặc định nếu lịch sử chưa tải được.
      }
    };

    loadLastSets();
    return () => {
      cancelled = true;
    };
  }, [workout?.id, workout?.title]);

  const [seconds, setSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const handleStartWorkout = () => {
    setSeconds(0);
    setIsWorkingOut(true);
  };
  const handleCancelWorkout = () => {
    setIsWorkingOut(false);
    setSeconds(0);
    setIsResting(false);
    setRestSeconds(0);
  };

  const handleFinishWorkout = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const sets = exercises.flatMap((exercise) =>
      exercise.sets
        .filter((set) => set.completed || set.entered)
        .map((set) => ({
          exerciseId: exercise.id,
          setNumber: exercise.sets.indexOf(set) + 1,
          weightKg: Number(set.kg) || 0,
          repsDone: Number(set.reps) || 0,
        })),
    );
    try {
      const response = await fetch("/api/workouts/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routineId: workout?.id,
          routineTitle: workout?.title,
          exerciseIds: exercises.map((exercise) => exercise.id),
          duration: seconds,
          sets,
        }),
      });
      if (!response.ok) throw new Error("Workout was not saved");
      setIsWorkingOut(false);
      setCompletion({
        duration: seconds,
        volume: totalVolume,
        completedSets: sets.length,
      });
      setIsResting(false);
      setRestSeconds(0);
    } catch {
      alert("Không thể lưu lịch sử workout. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isWorkingOut) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isWorkingOut]);

  useEffect(() => {
    if (!isResting) return;
    const interval = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatRestTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const totalVolume = exercises.reduce((acc: number, ex: Exercise) => {
    return (
      acc +
      ex.sets.reduce(
        (sAcc: number, set: Set) =>
          set.completed
            ? sAcc + (Number(set.kg) || 0) * (Number(set.reps) || 0)
            : sAcc,
        0,
      )
    );
  }, 0);

  const toggleSetComplete = (exId: string, setId: string) => {
    setExercises((prev: Exercise[]) =>
      prev.map((ex: Exercise) => {
        if (ex.id !== exId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s: Set) => {
            if (s.id === setId) {
              const nextCompleted = !s.completed;
              if (nextCompleted) {
                setRestSeconds(80);
                setIsResting(true);
              }
              return { ...s, completed: nextCompleted, entered: true };
            }
            return s;
          }),
        };
      }),
    );
  };

  const addSet = (exId: string) => {
    setExercises((prev: Exercise[]) =>
      prev.map((ex: Exercise) => {
        if (ex.id !== exId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: Set = {
          id: `s-${exId}-${ex.sets.length}`,
          previous: lastSet ? `${lastSet.kg}kg × ${lastSet.reps}` : "",
          kg: lastSet ? lastSet.kg : "0",
          reps: lastSet ? lastSet.reps : "0",
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }),
    );
  };

  const removeSet = (exId: string, setId: string) => {
    setExercises((previous) =>
      previous.map((exercise) => {
        if (exercise.id !== exId || exercise.sets.length <= 1) {
          return exercise;
        }
        return {
          ...exercise,
          sets: exercise.sets.filter((set) => set.id !== setId),
        };
      }),
    );
  };

  const updateSetData = (
    exId: string,
    setId: string,
    field: "kg" | "reps",
    value: string,
  ) => {
    setExercises((prev: Exercise[]) =>
      prev.map((ex: Exercise) => {
        if (ex.id !== exId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s: Set) =>
            s.id === setId ? { ...s, [field]: value, entered: true } : s,
          ),
        };
      }),
    );
  };

  const handleAdd30s = () => {
    setRestSeconds((prev) => prev + 30);
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestSeconds(0);
  };

  const handleUpdatePreview = async () => {
    if (isUpdatingPreview) return;
    setIsUpdatingPreview(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
    } finally {
      setIsUpdatingPreview(false);
      setIsEditingPreview(false);
    }
  };

  const parseNumberInput = (value: string) =>
    value.replace(/^-/, "").replace(/^0+(?=\d)/, "") || "0";

  const pickerExercises = (exercisesData as ExerciseAsset[])
    .filter((exercise) =>
      exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()),
    )
    .slice(0, 60);

  const selectExercise = (asset: ExerciseAsset) => {
    const nextExercise: Exercise = {
      id: asset.id,
      name: asset.name,
      image: asset.image ? `/${asset.image}` : "/images/placeholder.jpg",
      sets: [
        {
          id: `s-${asset.id}-new`,
          previous: "",
          kg: "0",
          reps: "0",
          completed: false,
        },
      ],
      reps: 0,
      restSec: 60,
    };
    setExercises((previous) =>
      pickerMode === "add"
        ? [...previous, nextExercise]
        : previous.map((exercise) =>
            exercise.id === pickerMode
              ? { ...nextExercise, sets: exercise.sets }
              : exercise,
          ),
    );
    setPickerMode(null);
    setExerciseSearch("");
  };

  if (!workout) {
    return (
      <div className="min-h-screen bg-black px-6 py-20 text-center text-white">
        Không tìm thấy dữ liệu giáo án. Vui lòng quay lại chọn giáo án.
      </div>
    );
  }

  if (completion) {
    return (
      <div className="min-h-screen bg-black p-6 pt-24 text-white">
        <div className="mx-auto max-w-lg space-y-6 border border-emerald-400/30 bg-zinc-900 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Đã ghi nhận dữ liệu
            </p>
            <h1 className="mt-2 text-3xl font-black">Hoàn thành buổi tập!</h1>
            <p className="mt-2 text-sm text-zinc-400">{workout.title}</p>
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
            <Link
              href="/progress"
              className="flex-1 bg-blue-600 px-4 py-3 text-sm font-bold"
            >
              Xem tiến độ
            </Link>
            <Link
              href="/programs"
              className="flex-1 bg-white/10 px-4 py-3 text-sm font-bold"
            >
              Về giáo án
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-24 px-4 sm:px-6 font-sans antialiased relative">
      <div className="max-w-3xl mx-auto">
        {!isWorkingOut ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Giáo án
              </Link>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                {workout.title}
              </h1>
              <p className="text-xs text-zinc-400 mt-1.5">
                {workout.description}
              </p>
            </div>

            <div className="flex gap-2">
              {isEditingPreview ? (
                <>
                  <button
                    onClick={() => {
                      if (previewSnapshot) setExercises(previewSnapshot);
                      setIsEditingPreview(false);
                    }}
                    className="flex-1 rounded-2xl bg-white/10 py-4 text-sm font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleUpdatePreview}
                    disabled={isUpdatingPreview}
                    className="flex-1 rounded-2xl bg-emerald-600 py-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isUpdatingPreview ? (
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
                  onClick={() => {
                    setPreviewSnapshot(exercises);
                    setIsEditingPreview(true);
                  }}
                  className="flex-1 rounded-2xl border border-white/15 bg-white/10 py-4 text-sm font-bold"
                >
                  Chỉnh sửa
                </button>
              )}
              {!isEditingPreview && (
                <button
                  onClick={handleStartWorkout}
                  className="flex-1 rounded-2xl bg-blue-600 py-4 text-sm font-extrabold hover:bg-blue-500"
                >
                  Bắt đầu tập
                </button>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                Bài tập
              </h2>
              {exercises.map((ex: Exercise) => (
                <div
                  key={ex.id}
                  onClick={() => !isEditingPreview && setSelectedExercise(ex)}
                  className="relative rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                        <Image
                          src={
                            ex.image || findLocalExerciseImage(ex.id, ex.name)
                          }
                          alt={formatExerciseName(ex.name)}
                          fill
                          sizes="48px"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="wrap-break-word text-sm font-bold leading-5 text-zinc-100 sm:text-base">
                          {formatExerciseName(ex.name)}
                        </h3>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {ex.sets.length} sets × {ex.reps} reps
                        </p>
                      </div>
                    </div>

                    {isEditingPreview && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setPickerMode(ex.id);
                          }}
                          className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-200 transition hover:bg-zinc-700"
                        >
                          Đổi
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setExercises((previous) =>
                              previous.filter((item) => item.id !== ex.id),
                            );
                          }}
                          className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 transition hover:bg-red-500/20"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50">
                    <div
                      className={`grid items-center gap-2 border-b border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-zinc-500 ${
                        isEditingPreview
                          ? "grid-cols-[minmax(3.5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)_2rem]"
                          : "grid-cols-[minmax(3.5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)]"
                      }`}
                    >
                      <span>Set</span>
                      <span>Mức tạ</span>
                      <span>Số reps</span>
                      {isEditingPreview && <span />}
                    </div>
                    <div className="divide-y divide-zinc-800">
                      {ex.sets.map((set, setIndex) => (
                        <div
                          key={set.id}
                          className={`grid items-center gap-2 px-3 py-2 ${
                            isEditingPreview
                              ? "grid-cols-[minmax(3.5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)_2rem]"
                              : "grid-cols-[minmax(3.5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)]"
                          }`}
                        >
                          <span className="text-xs font-semibold text-zinc-300">
                            Set {setIndex + 1}
                          </span>
                          {isEditingPreview ? (
                            <div className="relative">
                              <input
                                type="number"
                                value={set.kg}
                                onClick={(event) => event.stopPropagation()}
                                onChange={(event) =>
                                  updateSetData(
                                    ex.id,
                                    set.id,
                                    "kg",
                                    parseNumberInput(event.target.value),
                                  )
                                }
                                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 pr-7 text-center text-xs font-semibold text-zinc-100 outline-none focus:border-blue-400"
                                aria-label={`${formatExerciseName(ex.name)} Set ${setIndex + 1} mức tạ`}
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
                          {isEditingPreview ? (
                            <div className="relative">
                              <input
                                type="number"
                                value={set.reps}
                                onClick={(event) => event.stopPropagation()}
                                onChange={(event) =>
                                  updateSetData(
                                    ex.id,
                                    set.id,
                                    "reps",
                                    parseNumberInput(event.target.value),
                                  )
                                }
                                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 pr-9 text-center text-xs font-semibold text-zinc-100 outline-none focus:border-blue-400"
                                aria-label={`${formatExerciseName(ex.name)} Set ${setIndex + 1} số reps`}
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
                          {isEditingPreview && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                removeSet(ex.id, set.id);
                              }}
                              disabled={ex.sets.length <= 1}
                              className="mx-auto flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label={`Xóa Set ${setIndex + 1}`}
                              title="Xóa set"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {isEditingPreview && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          addSet(ex.id);
                        }}
                        className="flex w-full items-center justify-center gap-1 border-t border-zinc-800 px-3 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/10 hover:text-blue-300"
                      >
                        <Plus className="h-3.5 w-3.5" /> Thêm set
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isEditingPreview && (
              <button
                onClick={() => setPickerMode("add")}
                className="w-full rounded-2xl border border-dashed border-blue-400/40 bg-blue-500/10 py-3 text-sm font-bold text-blue-300"
              >
                + Thêm bài tập
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="sticky top-20 z-40 bg-black/60 backdrop-blur-2xl border border-white/20 p-3.5 rounded-2xl flex items-center justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="font-mono font-black text-base text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                  {formatTime(seconds)}
                </span>
              </div>
              <button
                onClick={handleFinishWorkout}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-[0_0_15px_rgba(37,99,235,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-blue-400/50 transition cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
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

            <div className="grid grid-cols-3 gap-2 bg-white/5 backdrop-blur-2xl border border-white/15 p-4 rounded-2xl text-center text-xs shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <div>
                <p className="text-zinc-400 text-[11px]">Thời gian</p>
                <p className="font-bold text-white mt-0.5">
                  {formatTime(seconds)}
                </p>
              </div>
              <div>
                <p className="text-zinc-400 text-[11px]">Khối lượng</p>
                <p className="font-black text-blue-400 mt-0.5">
                  {totalVolume} kg
                </p>
              </div>
              <div>
                <p className="text-zinc-400 text-[11px]">Bài tập</p>
                <p className="font-bold text-white mt-0.5">
                  {exercises.length}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {exercises.map((ex: Exercise) => (
                <div
                  key={ex.id}
                  className="bg-white/5 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_1px_rgba(255,255,255,0.15)]"
                >
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white/10 border border-white/10 shrink-0">
                        <Image
                          src={
                            ex.image || findLocalExerciseImage(ex.id, ex.name)
                          }
                          alt={ex.name}
                          fill
                          sizes="40px"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <h3 className="text-base font-extrabold text-white">
                        {formatExerciseName(ex.name)}
                      </h3>
                    </div>
                    <button
                      onClick={() =>
                        setMenuExerciseId(
                          menuExerciseId === ex.id ? null : ex.id,
                        )
                      }
                      className="text-zinc-400 hover:text-white p-1 cursor-pointer rounded-full hover:bg-white/10 transition"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuExerciseId === ex.id && (
                      <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-white/10 bg-zinc-950 p-1.5 shadow-xl">
                        <button
                          onClick={() => {
                            setPickerMode(ex.id);
                            setMenuExerciseId(null);
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10"
                        >
                          Thay thế bài tập
                        </button>
                        <button
                          onClick={() => {
                            setExercises((previous) =>
                              previous.filter((item) => item.id !== ex.id),
                            );
                            setMenuExerciseId(null);
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
                        >
                          Xóa bài tập
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-center border-b border-white/10 pb-2">
                    <span className="col-span-2 text-left pl-1">SET</span>
                    <span className="col-span-3 text-left">Lần trước</span>
                    <span className="col-span-3">KG</span>
                    <span className="col-span-2">REPS</span>
                    <span className="col-span-2">✓</span>
                  </div>

                  <div className="space-y-2">
                    {ex.sets.map((s: Set, idx: number) => (
                      <div
                        key={s.id}
                        className={`grid grid-cols-12 gap-2 items-center p-2 rounded-2xl text-xs transition-all duration-300 ${
                          s.completed
                            ? "bg-blue-500/20 border border-blue-400/40 text-blue-200 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)]"
                            : "bg-white/5 border border-white/10 text-white backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                        }`}
                      >
                        <span className="col-span-2 font-bold text-zinc-400 pl-1">
                          {idx + 1}
                        </span>
                        <span className="col-span-3 text-zinc-400 text-[11px] truncate">
                          {s.previous}
                        </span>
                        <div className="col-span-3">
                          <input
                            type="number"
                            value={s.kg}
                            onChange={(e) =>
                              updateSetData(
                                ex.id,
                                s.id,
                                "kg",
                                parseNumberInput(e.target.value),
                              )
                            }
                            className="w-full bg-black/40 border border-white/15 focus:border-blue-400 rounded-xl py-1 text-center font-bold text-white focus:outline-none transition shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={s.reps}
                            onChange={(e) =>
                              updateSetData(
                                ex.id,
                                s.id,
                                "reps",
                                parseNumberInput(e.target.value),
                              )
                            }
                            className="w-full bg-black/40 border border-white/15 focus:border-blue-400 rounded-xl py-1 text-center font-bold text-white focus:outline-none transition shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <button
                            onClick={() => toggleSetComplete(ex.id, s.id)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
                              s.completed
                                ? "bg-blue-500 text-white font-extrabold shadow-[0_0_15px_rgba(59,130,246,0.5),inset_0_1px_1px_rgba(255,255,255,0.8)] border border-blue-400 scale-105"
                                : "bg-white/10 hover:bg-white/20 text-zinc-400 border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addSet(ex.id)}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition duration-300 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-400" /> Thêm Set
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={() => setPickerMode("add")}
                className="w-full py-3.5 bg-blue-500/10 text-blue-300 font-bold rounded-2xl text-xs border border-blue-500/20"
              >
                <Plus className="mr-1 inline h-4 w-4" />
                Thêm bài tập
              </button>
              <button
                onClick={handleCancelWorkout}
                className="w-full py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-rose-500/20 transition duration-300 cursor-pointer backdrop-blur-md"
              >
                <Trash2 className="w-4 h-4" /> Hủy buổi tập
              </button>
            </div>

            {isResting && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-black/90 backdrop-blur-2xl border border-blue-500/40 rounded-[28px] p-3 sm:p-4 flex items-center justify-between shadow-[0_0_25px_rgba(59,130,246,0.2)]">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-b from-blue-500/20 to-blue-950/50 border border-blue-400/40 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                      <span className="font-black text-blue-300 text-lg tracking-tight">
                        {formatRestTime(restSeconds)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-white text-base">
                          Thời gian nghỉ
                        </h4>
                        <Sparkles className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                      </div>
                      <p className="text-zinc-400 text-xs mt-0.5 font-medium">
                        Chuẩn bị cho set tiếp theo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAdd30s}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-3.5 py-2.5 rounded-full text-xs transition border border-blue-400/50 cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                    >
                      +30s
                    </button>
                    <button
                      onClick={handleSkipRest}
                      className="bg-zinc-800/90 hover:bg-zinc-700 text-white font-extrabold px-4 py-2.5 rounded-full text-xs transition border border-zinc-700/60 cursor-pointer active:scale-95"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedExercise && !isWorkingOut && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-zinc-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-white capitalize truncate">
                  {selectedExercise.name}
                </h3>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition"
                  aria-label="Đóng xem trước"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full h-64 bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-2">
                <Image
                  src={
                    selectedExercise.image ||
                    findLocalExerciseImage(
                      selectedExercise.id,
                      selectedExercise.name,
                    )
                  }
                  alt={selectedExercise.name}
                  width={480}
                  height={256}
                  unoptimized
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
              </div>

              <div className="space-y-1.5 text-xs text-zinc-300">
                <p>
                  <strong className="text-white">Target:</strong>{" "}
                  <span className="capitalize">
                    {findExerciseAsset(
                      selectedExercise.id,
                      selectedExercise.name,
                    )?.target ||
                      findExerciseAsset(
                        selectedExercise.id,
                        selectedExercise.name,
                      )?.body_part ||
                      "Chưa xác định"}
                  </span>{" "}
                  | <strong className="text-white">Equipment:</strong>{" "}
                  <span className="capitalize">
                    {findExerciseAsset(
                      selectedExercise.id,
                      selectedExercise.name,
                    )?.equipment || "Chưa xác định"}
                  </span>
                </p>
                <div className="max-h-24 overflow-y-auto text-zinc-400 text-[11px] bg-zinc-950/50 p-3 rounded-xl border border-white/5 leading-relaxed">
                  {findExerciseAsset(selectedExercise.id, selectedExercise.name)
                    ?.instructions?.en || "Chưa có hướng dẫn cho bài tập này."}
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

        {pickerMode && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg space-y-4 rounded-2xl border border-white/15 bg-zinc-900 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Thư viện bài tập</h2>
                <button onClick={() => setPickerMode(null)}>
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
                    onClick={() => selectExercise(exercise)}
                    className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-2 text-left hover:bg-white/10"
                  >
                    <Image
                      src={
                        exercise.image
                          ? `/${exercise.image}`
                          : "/images/placeholder.jpg"
                      }
                      alt={exercise.name}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <span className="text-xs">{exercise.name}</span>
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

export default function WorkoutDetailPage() {
  return (
    <Suspense
      fallback={<div className="text-white p-20 text-center">Đang tải...</div>}
    >
      <WorkoutDetailContent />
    </Suspense>
  );
}
