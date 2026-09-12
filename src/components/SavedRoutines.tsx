"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SavedRoutine } from "@/types/routine";
import { DatasetExercise } from "@/types/exercise";
import exercisesData from "@/data/exercises.json";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Dumbbell,
  Timer,
  Play,
  Layers,
  Plus,
  Search,
  Copy,
  Clock,
  Sparkles,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

interface SavedRoutinesProps {
  onNavigateToBuilder: () => void;
  onEditRoutine?: (routine: SavedRoutine) => void;
}

const getLocalImageUrl = (path: string) => {
  if (!path) return "/images/placeholder.jpg";
  const fileName = path.split("/").pop();
  return `/images/${fileName}`;
};

interface DatabaseRoutine {
  id: string;
  title: string;
  createdAt: string;
  items: Array<{
    id: string;
    sets: number;
    reps: number;
    restSec: number;
    exercise: {
      id: string;
      name: string;
      category: string;
      equipment: string | null;
      mediaUrl: string | null;
      instructions: string | null;
    };
  }>;
}

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
};

const mapDatabaseRoutine = (routine: DatabaseRoutine): SavedRoutine => ({
  id: routine.id,
  title: routine.title,
  createdAt: formatDateTime(routine.createdAt),
  items: routine.items.map((item) => {
    const asset = (exercisesData as DatasetExercise[]).find(
      (exercise) =>
        exercise.id === item.exercise.id ||
        exercise.name.toLowerCase() === item.exercise.name.toLowerCase(),
    );
    const exercise: DatasetExercise = asset || {
      id: item.exercise.id,
      name: item.exercise.name,
      category: item.exercise.category,
      body_part: item.exercise.category,
      equipment: item.exercise.equipment || "unknown",
      target: item.exercise.category,
      muscle_group: item.exercise.category,
      secondary_muscles: [],
      instructions: { en: item.exercise.instructions || "" },
      image: "",
      gif_url: "",
    };

    return {
      routineId: item.id,
      exercise,
      sets: item.sets,
      reps: item.reps,
      restSec: item.restSec,
    };
  }),
});

const getOriginalRoutineTitle = (title: string) =>
  title.endsWith(" (Bản sao)") ? title.slice(0, -" (Bản sao)".length) : title;

export default function SavedRoutines({
  onNavigateToBuilder,
  onEditRoutine,
}: SavedRoutinesProps) {
  const router = useRouter();
  // Khởi tạo state bằng Lazy Initializer để tránh gọi setState trực tiếp trong useEffect
  const [routines, setRoutines] = useState<SavedRoutine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadRoutines = () => {
      setIsLoading(true);
      return fetch("/api/custom-db")
        .then((response) => (response.ok ? response.json() : []))
        .then((data: DatabaseRoutine[]) =>
          setRoutines(data.map(mapDatabaseRoutine)),
        )
        .catch((error) => console.error("Lỗi đọc giáo án:", error))
        .finally(() => setIsLoading(false));
    };

    loadRoutines();
    window.addEventListener("routine-saved", loadRoutines);

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("routine-saved", loadRoutines);
    };
  }, []);

  const handleDeleteRoutine = (id: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa giáo án "${title}"?`)) {
      const updated = routines.filter((r) => r.id !== id);
      setRoutines(updated);
      void fetch(`/api/custom-db?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) throw new Error("Delete failed");
        })
        .catch(() => setRoutines(routines));
    }
    setActiveMenuId(null);
  };

  const handleDuplicateRoutine = (routine: SavedRoutine) => {
    const originalTitle = getOriginalRoutineTitle(routine.title);
    const hasDuplicate = routines.some(
      (item) =>
        item.title === `${originalTitle} (Bản sao)` ||
        (item.id.startsWith("pending-") &&
          item.title === `${originalTitle} (Bản sao)`),
    );
    if (routine.title !== originalTitle || hasDuplicate) {
      setActiveMenuId(null);
      return;
    }

    const duplicated: SavedRoutine = {
      ...routine,
      id: `pending-${Date.now()}`,
      title: `${routine.title} (Bản sao)`,
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };
    const updated = [duplicated, ...routines];
    setRoutines(updated);
    void fetch("/api/custom-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: duplicated.title,
        items: duplicated.items.map((item) => ({
          exerciseId: item.exercise.id,
          sets: item.sets,
          reps: item.reps,
          restSec: item.restSec,
        })),
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Duplicate failed");
        const createdRoutine = (await response.json()) as DatabaseRoutine;
        const savedRoutine = mapDatabaseRoutine(createdRoutine);
        setRoutines((current) =>
          current.map((item) =>
            item.id === duplicated.id ? savedRoutine : item,
          ),
        );
      })
      .catch(() =>
        setRoutines((current) =>
          current.filter((item) => item.id !== duplicated.id),
        ),
      );
    setActiveMenuId(null);
  };

  const calculateEstimatedTime = (items: SavedRoutine["items"]) => {
    const totalRest = items.reduce(
      (acc, curr) => acc + curr.restSec * curr.sets,
      0,
    );
    const totalWork = items.reduce((acc, curr) => acc + curr.sets * 40, 0);
    return Math.ceil((totalRest + totalWork) / 60);
  };

  const filteredRoutines = useMemo(() => {
    if (!searchQuery.trim()) return routines;
    const query = searchQuery.toLowerCase();
    return routines.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.items.some((i) => i.exercise.name.toLowerCase().includes(query)),
    );
  }, [routines, searchQuery]);

  return (
    <div className="space-y-6 text-white max-w-5xl mx-auto pb-12 select-none">
      {/* Header */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white">
                Giáo Án Đã Lưu
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              Quản lý và thực hiện các bộ bài tập tùy chỉnh{" "}
              {isLoading ? "" : `(${routines.length} giáo án)`}
            </p>
          </div>

          <Button
            onClick={onNavigateToBuilder}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs h-11 px-5 flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Tạo giáo án mới
          </Button>
        </div>

        {!isLoading && routines.length > 0 && (
          <div className="mt-5 pt-5 border-t border-zinc-800/80 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên giáo án hoặc bài tập..."
                className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-blue-500/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        )}
      </div>

      {/* Danh sách giáo án */}
      {isLoading ? (
        <div
          className="space-y-4"
          aria-live="polite"
          aria-label="Đang tải giáo án"
        >
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900/70"
            />
          ))}
        </div>
      ) : filteredRoutines.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredRoutines.map((routine) => {
            const isExpanded = expandedId === routine.id;
            const isMenuOpen = activeMenuId === routine.id;
            const originalTitle = getOriginalRoutineTitle(routine.title);
            const hasDuplicate = routines.some(
              (item) =>
                item.title === `${originalTitle} (Bản sao)` &&
                item.id !== routine.id,
            );
            const canDuplicate =
              routine.title === originalTitle && !hasDuplicate;
            const totalSets = routine.items.reduce(
              (acc, curr) => acc + curr.sets,
              0,
            );
            const estMinutes = calculateEstimatedTime(routine.items);

            return (
              <div
                key={routine.id}
                onClick={() => setExpandedId(isExpanded ? null : routine.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setExpandedId(isExpanded ? null : routine.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                className={`group relative bg-zinc-900/80 border rounded-3xl transition-all duration-200 shadow-xl overflow-visible cursor-pointer ${
                  isExpanded
                    ? "z-20 border-blue-500/40 bg-zinc-900 ring-1 ring-blue-500/20"
                    : isMenuOpen
                      ? "z-20 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900"
                      : "border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                {/* Phần Tiêu Đề & Nút Hành Động */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Thông tin giáo án */}
                    <div className="space-y-2 min-w-0 pr-2">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-white tracking-wide truncate group-hover:text-blue-400 transition-colors">
                          {routine.title}
                        </h3>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold shrink-0">
                          {routine.items.length} bài
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          {routine.createdAt}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="flex items-center gap-1.5 text-amber-400/90 font-medium">
                          <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                          {totalSets} Sets
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="flex items-center gap-1.5 text-sky-400/90 font-medium">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />~
                          {estMinutes} phút
                        </span>
                      </div>
                    </div>

                    {/* Khối Nút Bấm */}
                    <div
                      className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          router.push(`/programs/custom/${routine.id}`)
                        }
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs h-10 px-5 flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Tập luyện
                      </Button>

                      <div
                        className="relative"
                        ref={isMenuOpen ? menuRef : null}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(isMenuOpen ? null : routine.id)
                          }
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                            isMenuOpen
                              ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                              : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700/50"
                          }`}
                          title="Tùy chọn giáo án"
                          aria-label={`Tùy chọn giáo án ${routine.title}`}
                          aria-expanded={isMenuOpen}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-12 w-48 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                            {onEditRoutine && (
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEditRoutine(routine);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-zinc-800 transition-all font-medium text-left"
                              >
                                <Pencil className="w-3.5 h-3.5 text-blue-400" />
                                Chỉnh sửa giáo án
                              </button>
                            )}

                            <button
                              onClick={() => handleDuplicateRoutine(routine)}
                              disabled={!canDuplicate}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-zinc-800 transition-all font-medium text-left disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent"
                            >
                              <Copy
                                className={`w-3.5 h-3.5 ${canDuplicate ? "text-zinc-400" : "text-zinc-600"}`}
                              />
                              {canDuplicate
                                ? "Nhân bản bản sao"
                                : "Đã có bản sao"}
                            </button>

                            <div className="my-1 border-t border-zinc-800/80" />

                            <button
                              onClick={() =>
                                handleDeleteRoutine(routine.id, routine.title)
                              }
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-medium text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              Xóa giáo án
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nội dung chi tiết bài tập */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-zinc-950/90 border-t border-zinc-800/80 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Lộ
                        trình bài tập chi tiết
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {routine.items.map((item, idx) => (
                        <div
                          key={item.routineId || idx}
                          onClick={(event) => event.stopPropagation()}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/60 hover:border-zinc-700 transition-all duration-200 gap-3"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>

                            <div className="p-1 bg-white rounded-xl shrink-0 overflow-hidden">
                              <Image
                                src={getLocalImageUrl(item.exercise.image)}
                                alt={item.exercise.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-lg object-cover"
                                unoptimized
                              />
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white capitalize truncate">
                                {item.exercise.name}
                              </h4>
                              <p className="text-[11px] text-zinc-400 capitalize mt-0.5">
                                {item.exercise.target || "Bài tập thể hình"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/50 w-full sm:w-auto justify-end">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs">
                              <span className="text-blue-300/60 text-[10px] uppercase font-semibold">
                                Sets
                              </span>
                              <span>{item.sets}</span>
                            </div>

                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs">
                              <span className="text-zinc-400 text-[10px] uppercase font-semibold">
                                Reps
                              </span>
                              <span>{item.reps}</span>
                            </div>

                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
                              <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{item.restSec}s nghỉ</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-zinc-800 rounded-3xl p-12 text-center space-y-4 bg-zinc-900/30">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
            <Dumbbell className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">
              {searchQuery
                ? "Không tìm thấy giáo án phù hợp"
                : "Chưa có giáo án nào được lưu"}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery
                ? "Thử thay đổi từ khóa tìm kiếm của bạn."
                : "Tạo giáo án đầu tiên để bắt đầu theo dõi quá trình tập luyện."}
            </p>
          </div>
          {!searchQuery && (
            <Button
              onClick={onNavigateToBuilder}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs h-10 px-6 shadow-lg shadow-blue-600/20"
            >
              Đến trang tạo giáo án
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
