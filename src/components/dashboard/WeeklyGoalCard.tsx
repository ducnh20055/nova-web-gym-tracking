"use client";

import { startTransition, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { BarChart3, Check, Pencil, Save, X } from "lucide-react";

export default function WeeklyGoalCard({ completed }: { completed: number }) {
  const { user } = useUser();
  const [goal, setGoal] = useState(3);
  const [draft, setDraft] = useState("3");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const key = `nova:${user.id}:weekly-goal`;
    const saved = Number(localStorage.getItem(key));
    if (Number.isInteger(saved) && saved > 0) {
      startTransition(() => {
        setGoal(saved);
        setDraft(String(saved));
      });
    }
  }, [user?.id]);

  const saveGoal = () => {
    const next = Math.min(14, Math.max(1, Number(draft) || 1));
    setGoal(next);
    setDraft(String(next));
    if (user?.id)
      localStorage.setItem(`nova:${user.id}:weekly-goal`, String(next));
    setEditing(false);
  };

  const progress = Math.min(100, Math.round((completed / goal) * 100));

  return (
    <div className="border border-blue-500/25 bg-blue-500/10 p-5">
      <div className="flex items-start justify-between">
        <BarChart3 className="mb-5 h-5 w-5 text-blue-400" />
        <button
          onClick={() => setEditing((value) => !value)}
          className="text-zinc-500 hover:text-white"
          aria-label="Chỉnh mục tiêu tuần"
          title="Chỉnh mục tiêu tuần"
        >
          {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs text-blue-200/70">Tiến độ tuần này</p>
      {editing ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="14"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="w-20 rounded-lg border border-white/15 bg-black px-2 py-1 text-lg font-black"
            autoFocus
          />
          <span className="text-xs text-zinc-400">buổi</span>
          <button
            onClick={saveGoal}
            className="ml-auto text-emerald-400"
            aria-label="Lưu mục tiêu"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="mt-1 flex items-end justify-between gap-2">
            <p className="text-2xl font-black">
              {completed}/{goal}
            </p>
            <span className="text-xs text-blue-100/70">ngày tập</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full bg-blue-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-blue-100/70">
            {completed >= goal ? <Check className="h-3.5 w-3.5" /> : null}
            {completed >= goal
              ? "Đã đạt mục tiêu"
              : `Còn ${goal - completed} ngày tập`}
          </p>
        </>
      )}
    </div>
  );
}
