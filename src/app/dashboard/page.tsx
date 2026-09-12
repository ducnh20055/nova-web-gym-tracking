import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getOrCreateAppUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Bot, Dumbbell, Layers3 } from "lucide-react";
import WeeklyGoalCard from "@/components/dashboard/WeeklyGoalCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getOrCreateAppUser();
  const [routineCount, workoutLogs, recentRoutines] = user
    ? await Promise.all([
        prisma.routine.count({ where: { userId: user.id, isCustom: true } }),
        prisma.workoutLog.findMany({
          where: { userId: user.id },
          select: { completedAt: true },
        }),
        prisma.routine.findMany({
          where: { userId: user.id, isCustom: true },
          orderBy: { updatedAt: "desc" },
          take: 3,
          select: { id: true, title: true, updatedAt: true },
        }),
      ])
    : [0, 0, []];

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const dateKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const completedLogs = Array.isArray(workoutLogs) ? workoutLogs : [];
  const workoutDays = new Set(
    completedLogs
      .filter((log) => log.completedAt >= weekStart)
      .map((log) => dateKey(log.completedAt)),
  );
  const workoutCount = new Set(
    completedLogs.map((log) => dateKey(log.completedAt)),
  ).size;

  return (
    <main className="min-h-screen bg-black px-4 pb-12 pt-24 text-white md:px-8">
      <Navbar />
      <section className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            NOVA / Dashboard
          </p>
          <h1 className="text-3xl font-black md:text-5xl">
            Sẵn sàng cho buổi tập tiếp theo?
          </h1>
          <p className="text-sm text-zinc-400">
            Tổng quan tiến độ và những routine gần đây của bạn.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-white/10 bg-zinc-900/70 p-5">
            <Layers3 className="mb-5 h-5 w-5 text-blue-400" />
            <p className="text-xs text-zinc-500">Giáo án cá nhân</p>
            <p className="mt-1 text-2xl font-black">{routineCount}</p>
          </div>
          <div className="border border-white/10 bg-zinc-900/70 p-5">
            <Dumbbell className="mb-5 h-5 w-5 text-blue-400" />
            <p className="text-xs text-zinc-500">Buổi đã hoàn thành</p>
            <p className="mt-1 text-2xl font-black">{workoutCount}</p>
          </div>
          <WeeklyGoalCard completed={workoutDays.size} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="border border-white/10 bg-zinc-900/50 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Routine gần đây</h2>
              <Link
                href="/routine"
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Xem tất cả
              </Link>
            </div>
            {recentRoutines.length ? (
              <div className="space-y-3">
                {recentRoutines.map((routine) => (
                  <div
                    key={routine.id}
                    className="flex items-center justify-between border-b border-white/10 py-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-semibold">{routine.title}</p>
                      <p className="text-xs text-zinc-500">
                        Cập nhật {routine.updatedAt.toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-sm text-zinc-500">
                Bạn chưa có routine nào. Hãy tạo routine đầu tiên.
              </p>
            )}
          </section>
          <section className="border border-blue-500/20 bg-blue-500/10 p-6">
            <Bot className="mb-5 h-6 w-6 text-blue-400" />
            <h2 className="text-lg font-bold">Cần một kế hoạch?</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Hỏi AI Trainer để xây lịch tập, tính macro hoặc sửa kỹ thuật.
            </p>
            <Link
              href="/trainer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-300"
            >
              Mở Trainer AI <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}
