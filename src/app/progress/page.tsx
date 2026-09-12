import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getOrCreateAppUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { ArrowRight, BarChart3, Dumbbell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await getOrCreateAppUser();
  const allLogs = user
    ? await prisma.workoutLog.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: "desc" },
        include: {
          routine: { select: { title: true } },
          logItems: { select: { weightKg: true, repsDone: true } },
        },
      })
    : [];
  const logs = allLogs.slice(0, 8);
  const totalVolume = allLogs.reduce(
    (total, log) =>
      total +
      log.logItems.reduce(
        (volume, item) => volume + (item.weightKg || 0) * (item.repsDone || 0),
        0,
      ),
    0,
  );
  const personalBest = allLogs.reduce(
    (best, log) =>
      Math.max(best, ...log.logItems.map((item) => item.weightKg || 0)),
    0,
  );

  return (
    <main className="min-h-screen bg-black px-4 pb-12 pt-24 text-white md:px-8">
      <Navbar />
      <section className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            NOVA / Progress
          </p>
          <h1 className="text-3xl font-black md:text-5xl">Theo dõi tiến bộ</h1>
          <p className="text-sm text-zinc-400">
            Mỗi buổi tập hoàn thành là một bước tiến.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-white/10 bg-zinc-900/70 p-5">
            <BarChart3 className="mb-5 h-5 w-5 text-blue-400" />
            <p className="text-xs text-zinc-500">Tổng buổi tập</p>
            <p className="mt-1 text-3xl font-black">{allLogs.length}</p>
          </div>
          <div className="border border-white/10 bg-zinc-900/70 p-5">
            <Dumbbell className="mb-5 h-5 w-5 text-emerald-400" />
            <p className="text-xs text-zinc-500">Volume</p>
            <p className="mt-1 text-3xl font-black">
              {totalVolume.toLocaleString("vi-VN")} kg
            </p>
          </div>
          <div className="border border-white/10 bg-zinc-900/70 p-5">
            <p className="mb-5 text-2xl text-amber-400">●</p>
            <p className="text-xs text-zinc-500">Kỷ lục cá nhân</p>
            <p className="mt-1 text-3xl font-black">
              {personalBest ? `${personalBest} kg` : "Chưa có"}
            </p>
          </div>
        </div>

        <section className="border border-white/10 bg-zinc-900/50 p-6">
          <h2 className="mb-5 text-lg font-bold">Lịch sử tập luyện</h2>
          {logs.length ? (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border-b border-white/10 py-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold">{log.routine.title}</p>
                    <p className="text-xs text-zinc-500">
                      {log.completedAt.toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {log.duration ? `${log.duration} phút` : "Đã hoàn thành"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-400">Chưa có dữ liệu tiến bộ.</p>
              <p className="mt-2 text-xs text-zinc-600">
                Hoàn thành một workout để bắt đầu theo dõi.
              </p>
              <Link
                href="/programs"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-400"
              >
                Chọn giáo án <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
