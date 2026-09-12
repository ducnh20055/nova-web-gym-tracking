"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronRight, X } from "lucide-react";
import { RoutineExerciseItem } from "./CustomBuilder";

export default function ActiveWorkoutSession({
  items,
  onExit,
}: {
  items: RoutineExerciseItem[];
  onExit: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const currentItem = items[currentIndex];

  const handleComplete = () => {
    setCompleted([...completed, currentIndex]);
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert("Chúc mừng! Bạn đã hoàn thành buổi tập!");
      onExit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center text-white">
          <h2 className="text-xl font-bold">
            Đang tập: {currentItem.exercise.name}
          </h2>
          <Button variant="ghost" onClick={onExit}>
            <X />
          </Button>
        </div>

        {/* GIF bài tập */}
        <div className="relative w-full h-64 bg-zinc-900 rounded-3xl overflow-hidden">
          <Image
            src={`/images/${currentItem.exercise.image.split("/").pop()}`}
            alt={currentItem.exercise.name}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            unoptimized
            className="object-contain"
          />
        </div>

        {/* Chỉ số tập */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-zinc-800 p-4 rounded-2xl">
            <p className="text-xs text-zinc-400">Sets</p>
            <p className="font-bold">{currentItem.sets}</p>
          </div>
          <div className="bg-zinc-800 p-4 rounded-2xl">
            <p className="text-xs text-zinc-400">Reps</p>
            <p className="font-bold">{currentItem.reps}</p>
          </div>
          <div className="bg-zinc-800 p-4 rounded-2xl">
            <p className="text-xs text-zinc-400">Nghỉ</p>
            <p className="font-bold">{currentItem.restSec}s</p>
          </div>
        </div>

        <Button
          onClick={handleComplete}
          className="w-full h-14 bg-blue-600 text-lg font-black rounded-2xl"
        >
          {currentIndex === items.length - 1 ? "Hoàn thành" : "Tiếp theo"}{" "}
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
