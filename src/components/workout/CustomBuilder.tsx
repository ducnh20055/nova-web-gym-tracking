"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Dumbbell,
  Plus,
  Minus,
  Trash2,
  Timer,
  Sparkles,
  Layers,
  Save,
  Loader2,
  Eye,
  X,
  Check,
} from "lucide-react";

import rawExercises from "@/data/exercises.json";
import { DatasetExercise } from "@/types/exercise";
import {
  translateExerciseInstructions,
  translateExerciseName,
} from "@/data/exerciseTranslations";

const exercisesData = rawExercises as DatasetExercise[];

const getLocalImageUrl = (path: string) => {
  if (!path) return "/images/placeholder.jpg";
  const fileName = path.split("/").pop();
  return `/images/${fileName}`;
};

const getLocalGifUrl = (path: string) => {
  if (!path) return null;
  const fileName = path.split("/").pop();
  return fileName ? `/videos/${fileName}` : null;
};

export interface RoutineExerciseItem {
  routineId: string;
  exercise: DatasetExercise;
  sets: number;
  reps: number;
  restSec: number;
}

export default function CustomBuilder() {
  // 1. State Quản lý Bộ bài tập (Routine)
  const [routineTitle, setRoutineTitle] = useState("Giáo án Tùy Chỉnh Mới");
  const [routineItems, setRoutineItems] = useState<RoutineExerciseItem[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const routineItemSequence = useRef(0);

  // 2. State Xem trước GIF chi tiết bài tập
  const [previewExercise, setPreviewExercise] =
    useState<DatasetExercise | null>(null);

  // 3. State Tìm kiếm & Lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("all");
  const [selectedBodyPart, setSelectedBodyPart] = useState("all");

  const filteredExercises = useMemo(() => {
    return exercisesData.filter((item) => {
      const matchSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchEquipment =
        selectedEquipment === "all" || item.equipment === selectedEquipment;
      const matchBodyPart =
        selectedBodyPart === "all" || item.body_part === selectedBodyPart;
      return matchSearch && matchEquipment && matchBodyPart;
    });
  }, [searchQuery, selectedEquipment, selectedBodyPart]);

  // Thêm 1 bài tập vào Giáo án
  const handleAddExerciseToRoutine = (item: DatasetExercise) => {
    routineItemSequence.current += 1;
    const newItem: RoutineExerciseItem = {
      routineId: `${item.id}-${routineItemSequence.current}`,
      exercise: item,
      sets: 4,
      reps: 10,
      restSec: 60,
    };
    setRoutineItems((prev) => [...prev, newItem]);
  };

  // Bớt 1 lần xuất hiện của bài tập khỏi Giáo án (từ Thư viện)
  const handleRemoveOneFromRoutine = (exerciseId: string) => {
    setRoutineItems((prev) => {
      const lastIndex = prev.map((i) => i.exercise.id).lastIndexOf(exerciseId);
      if (lastIndex !== -1) {
        const next = [...prev];
        next.splice(lastIndex, 1);
        return next;
      }
      return prev;
    });
  };

  // Xóa hoàn toàn 1 dòng bài tập khỏi Giáo án (từ Cột Trái)
  const handleRemoveFromRoutine = (routineId: string) => {
    setRoutineItems((prev) => prev.filter((i) => i.routineId !== routineId));
  };

  // Cập nhật Sets / Reps / Rest Time
  const handleUpdateItem = (
    routineId: string,
    field: "sets" | "reps" | "restSec",
    delta: number,
  ) => {
    setRoutineItems((prev) =>
      prev.map((item) => {
        if (item.routineId === routineId) {
          const minVal = field === "restSec" ? 0 : 1;
          const newValue = Math.max(minVal, item[field] + delta);
          return { ...item, [field]: newValue };
        }
        return item;
      }),
    );
  };

  // Tính tổng số set
  const totalSets = useMemo(
    () => routineItems.reduce((acc, curr) => acc + curr.sets, 0),
    [routineItems],
  );

  // Xử lý lưu bộ bài tập vào localStorage
  const handleSaveRoutine = async () => {
    if (routineItems.length === 0 || isSaving) return;
    setSaveError("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/custom-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: routineTitle.trim() || "Giáo án Tùy Chỉnh",
          items: routineItems.map((item) => ({
            exerciseId: item.exercise.id,
            sets: item.sets,
            reps: item.reps,
            restSec: item.restSec,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Không thể lưu giáo án");
      }

      setIsSaved(true);
      window.dispatchEvent(new Event("routine-saved"));
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Không thể lưu giáo án",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-white">
      {/* CỘT TRÁI (7 Cột): XÂY DỰNG BỘ BÀI TẬP */}
      <div className="lg:col-span-7 bg-zinc-900/80 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header Giáo án */}
        <div className="space-y-4 pb-4 border-b border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 animate-pulse" /> Xây dựng giáo án
              tùy chỉnh
            </span>
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-zinc-300 border border-white/10 font-semibold">
              {routineItems.length} Bài tập • {totalSets} Sets
            </span>
          </div>

          <Input
            value={routineTitle}
            onChange={(e) => setRoutineTitle(e.target.value)}
            placeholder="Nhập tên bộ bài tập (VD: Tập Ngực & Tay Sau)..."
            className="bg-zinc-950/60 border-white/15 text-lg font-black text-white focus-visible:ring-blue-500 rounded-2xl h-12 px-4 shadow-inner"
          />
        </div>

        {/* Danh sách bài tập trong Giáo án */}
        <div className="space-y-3 min-h-[380px] max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
          {routineItems.length > 0 ? (
            routineItems.map((item, index) => (
              <div
                key={item.routineId}
                className="group relative bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 border border-white/10 hover:border-blue-500/40 rounded-2xl p-4 transition-all duration-300 shadow-md flex flex-col xl:flex-row xl:items-center justify-between gap-4"
              >
                {/* Thông tin bài tập */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-blue-600/20 text-blue-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-500/30">
                    #{index + 1}
                  </span>
                  <Image
                    src={getLocalImageUrl(item.exercise.image)}
                    alt={item.exercise.name}
                    width={56}
                    height={56}
                    unoptimized
                    className="w-14 h-14 rounded-xl bg-white object-cover shrink-0 border border-white/10 shadow-sm"
                  />
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-white capitalize truncate group-hover:text-blue-300 transition-colors">
                      {translateExerciseName(item.exercise.name)}
                    </h4>
                    <p className="text-[11px] text-zinc-400 capitalize mt-0.5">
                      {item.exercise.target} • {item.exercise.equipment}
                    </p>
                  </div>
                </div>

                {/* Điều chỉnh Sets / Reps / Thời gian nghỉ */}
                <div className="flex items-center justify-between xl:justify-end gap-2.5 bg-zinc-950/60 p-2 rounded-2xl border border-white/5 shrink-0">
                  {/* Sets */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        handleUpdateItem(item.routineId, "sets", -1)
                      }
                      className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold transition active:scale-95"
                    >
                      -
                    </button>
                    <span className="text-xs font-extrabold text-blue-400 min-w-[36px] text-center">
                      {item.sets}{" "}
                      <span className="text-[10px] text-zinc-500 font-normal">
                        Set
                      </span>
                    </span>
                    <button
                      onClick={() =>
                        handleUpdateItem(item.routineId, "sets", 1)
                      }
                      className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold transition active:scale-95"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-zinc-700">|</span>

                  {/* Reps */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        handleUpdateItem(item.routineId, "reps", -1)
                      }
                      className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold transition active:scale-95"
                    >
                      -
                    </button>
                    <span className="text-xs font-extrabold text-white min-w-[38px] text-center">
                      {item.reps}{" "}
                      <span className="text-[10px] text-zinc-500 font-normal">
                        Lần
                      </span>
                    </span>
                    <button
                      onClick={() =>
                        handleUpdateItem(item.routineId, "reps", 1)
                      }
                      className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold transition active:scale-95"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-zinc-700">|</span>

                  {/* Rest Time (+/- 15 giây) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        handleUpdateItem(item.routineId, "restSec", -15)
                      }
                      className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold transition active:scale-95"
                      title="Giảm 15s nghỉ"
                    >
                      -
                    </button>
                    <div className="flex items-center gap-1 text-xs text-sky-400 font-extrabold min-w-[48px] justify-center">
                      <Timer className="w-3 h-3 text-sky-400 shrink-0" />
                      <span>{item.restSec}s</span>
                    </div>
                    <button
                      onClick={() =>
                        handleUpdateItem(item.routineId, "restSec", 15)
                      }
                      className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold transition active:scale-95"
                      title="Tăng 15s nghỉ"
                    >
                      +
                    </button>
                  </div>

                  {/* Nút Xóa */}
                  <button
                    onClick={() => handleRemoveFromRoutine(item.routineId)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition ml-1"
                    title="Xóa bài tập"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full min-h-[350px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3 bg-white/[0.02]">
              <div className="w-14 h-14 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">
                Chưa có bài tập nào
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Nhấn dấu <span className="text-blue-400 font-bold">+</span> ở
                thư viện bên phải để thêm bài tập vào giáo án tùy chỉnh của bạn.
              </p>
            </div>
          )}
        </div>

        {/* Action Bottom */}
        <div className="pt-4 border-t border-white/10 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setRoutineItems([])}
            disabled={routineItems.length === 0}
            className="w-1/3 bg-white/5 border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white rounded-2xl h-11 text-xs font-bold"
          >
            Xóa tất cả
          </Button>

          <Button
            onClick={handleSaveRoutine}
            disabled={routineItems.length === 0 || isSaved || isSaving}
            className={`w-2/3 text-white font-black rounded-2xl h-11 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
              isSaved
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.4)]"
                : "bg-blue-600 hover:bg-blue-500 shadow-[0_4px_20px_rgba(37,99,235,0.4)]"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : isSaved ? (
              <>
                <Check className="w-4 h-4" /> Đã Lưu Thành Công!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Lưu Bộ Bài Tập Tùy Chỉnh
              </>
            )}
          </Button>
          {saveError && <p className="text-xs text-red-400">{saveError}</p>}
        </div>
      </div>

      {/* CỘT PHẢI (5 Cột): THƯ VIỆN BÀI TẬP */}
      <div className="lg:col-span-5 bg-zinc-900/80 border border-white/10 backdrop-blur-xl rounded-3xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-blue-400" /> Thư Viện Bài Tập
          </h3>
          <span className="text-xs text-zinc-400 font-semibold">
            {filteredExercises.length} kết quả
          </span>
        </div>

        {/* Bộ lọc Filters */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full bg-zinc-800/90 border border-white/10 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none capitalize cursor-pointer hover:border-white/20"
            >
              <option value="all">Tất cả thiết bị</option>
              <option value="barbell">Barbell</option>
              <option value="dumbbell">Dumbbell</option>
              <option value="cable">Cable</option>
              <option value="body weight">Body Weight</option>
            </select>

            <select
              value={selectedBodyPart}
              onChange={(e) => setSelectedBodyPart(e.target.value)}
              className="w-full bg-zinc-800/90 border border-white/10 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none capitalize cursor-pointer hover:border-white/20"
            >
              <option value="all">Tất cả nhóm cơ</option>
              <option value="chest">Chest (Ngực)</option>
              <option value="back">Back (Lưng)</option>
              <option value="upper arms">Upper Arms (Tay)</option>
              <option value="upper legs">Upper Legs (Đùi)</option>
              <option value="shoulders">Shoulders (Vai)</option>
              <option value="waist">Waist (Cơ bụng)</option>
            </select>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
            <Input
              placeholder="Tìm kiếm bài tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-800/90 border-white/10 text-white rounded-xl focus-visible:ring-blue-500 text-xs h-10"
            />
          </div>
        </div>

        {/* Danh sách bài tập */}
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
          {filteredExercises.slice(0, 60).map((item) => {
            const addedCount = routineItems.filter(
              (r) => r.exercise.id === item.id,
            ).length;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-2xl transition border border-white/5 hover:border-white/20 hover:bg-zinc-800/50 group"
              >
                {/* Click xem GIF mô phỏng */}
                <div
                  onClick={() => setPreviewExercise(item)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2"
                  title="Bấm để xem GIF hướng dẫn"
                >
                  <div className="relative shrink-0">
                    <Image
                      src={getLocalImageUrl(item.image)}
                      alt={item.name}
                      width={48}
                      height={48}
                      unoptimized
                      className="w-12 h-12 rounded-xl bg-white object-cover border border-white/10"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="truncate">
                    <p className="text-xs font-bold text-white capitalize truncate group-hover:text-blue-300 transition-colors">
                      {translateExerciseName(item.name)}
                    </p>
                    <p className="text-[10px] text-zinc-400 capitalize mt-0.5">
                      {item.target} • {item.equipment}
                    </p>
                  </div>
                </div>

                {/* Bộ nút Thêm / Bớt trong Thư viện */}
                {addedCount > 0 ? (
                  <div className="flex items-center gap-1.5 shrink-0 bg-zinc-950/80 p-1 rounded-xl border border-white/10">
                    <Button
                      size="sm"
                      onClick={() => handleRemoveOneFromRoutine(item.id)}
                      className="h-7 w-7 p-0 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/20"
                      title="Bớt 1 bài"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>

                    <span className="text-xs font-black text-blue-400 min-w-[18px] text-center">
                      {addedCount}
                    </span>

                    <Button
                      size="sm"
                      onClick={() => handleAddExerciseToRoutine(item)}
                      className="h-7 w-7 p-0 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
                      title="Thêm 1 bài"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleAddExerciseToRoutine(item)}
                    className="h-8 w-8 p-0 rounded-xl bg-white/10 hover:bg-blue-600 text-white border border-white/10 transition-all shrink-0"
                    title="Thêm vào giáo án"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* POPUP PREVIEW (Xem GIF động tác) */}
      {previewExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white capitalize truncate">
                {translateExerciseName(previewExercise.name)}
              </h3>
              <button
                onClick={() => setPreviewExercise(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-64 bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-2">
              {getLocalGifUrl(previewExercise.gif_url) ? (
                <Image
                  src={getLocalGifUrl(previewExercise.gif_url) || ""}
                  alt={previewExercise.name}
                  width={480}
                  height={256}
                  unoptimized
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
              ) : (
                <Image
                  src={getLocalImageUrl(previewExercise.image)}
                  alt={previewExercise.name}
                  width={480}
                  height={256}
                  unoptimized
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
              )}
            </div>

            <div className="space-y-1.5 text-xs text-zinc-300">
              <p>
                <strong className="text-white">Nhóm cơ:</strong>{" "}
                <span className="capitalize">{previewExercise.target}</span> |{" "}
                <strong className="text-white">Thiết bị:</strong>{" "}
                <span className="capitalize">{previewExercise.equipment}</span>
              </p>
              <div className="max-h-24 overflow-y-auto text-zinc-400 text-[11px] bg-zinc-950/50 p-3 rounded-xl border border-white/5 leading-relaxed">
                {translateExerciseInstructions(
                  previewExercise.name,
                  previewExercise.instructions?.en,
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  handleAddExerciseToRoutine(previewExercise);
                  setPreviewExercise(null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs py-2.5 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Thêm vào giáo án ngay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
