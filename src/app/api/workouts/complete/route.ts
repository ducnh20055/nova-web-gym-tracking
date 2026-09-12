import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/auth-user";

interface CompletedSet {
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  repsDone: number;
}

export async function POST(req: Request) {
  try {
    const user = await getOrCreateAppUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const routineId = typeof body.routineId === "string" ? body.routineId : "";
    const routineTitle =
      typeof body.routineTitle === "string" ? body.routineTitle : "";
    const exerciseIds: string[] = Array.isArray(body.exerciseIds)
      ? body.exerciseIds.filter(
          (id: unknown): id is string => typeof id === "string",
        )
      : [];
    const duration = Number(body.duration);
    const sets: CompletedSet[] = Array.isArray(body.sets) ? body.sets : [];

    if (sets.length > 200 || exerciseIds.length > 100) {
      return NextResponse.json(
        { error: "Workout có quá nhiều dữ liệu" },
        { status: 413 },
      );
    }

    if (
      (!routineId && !routineTitle) ||
      !Number.isInteger(duration) ||
      duration < 0 ||
      duration > 24 * 60 * 60
    ) {
      return NextResponse.json(
        { error: "Dữ liệu workout không hợp lệ" },
        { status: 400 },
      );
    }

    const routine = await prisma.routine.findFirst({
      where: {
        AND: [
          {
            OR: [
              ...(routineId ? [{ id: routineId }] : []),
              ...(routineTitle
                ? [{ title: routineTitle, isCustom: false }]
                : []),
            ],
          },
          { OR: [{ userId: user.id }, { userId: null }] },
        ],
      },
      include: { items: { select: { exerciseId: true } } },
    });
    const activeRoutine =
      routine ||
      (routineTitle && exerciseIds.length
        ? await prisma.routine.create({
            data: {
              title: routineTitle,
              isCustom: false,
              items: {
                create: exerciseIds.map((exerciseId, index) => ({
                  exerciseId,
                  order: index + 1,
                  sets: 1,
                  reps: 1,
                  restSec: 60,
                })),
              },
            },
            include: { items: { select: { exerciseId: true } } },
          })
        : null);
    if (!activeRoutine)
      return NextResponse.json(
        {
          error:
            "Không tìm thấy giáo án hoặc bài tập chưa được seed vào database",
        },
        { status: 404 },
      );

    const allowedExercises = new Set(
      activeRoutine.items.map((item) => item.exerciseId),
    );
    if (!activeRoutine.isCustom && exerciseIds.length > 0) {
      const presetExercises = await prisma.exercise.findMany({
        where: { id: { in: exerciseIds }, userId: null },
        select: { id: true },
      });
      presetExercises.forEach((exercise) => allowedExercises.add(exercise.id));
    }
    const validSets = sets.filter(
      (set) =>
        allowedExercises.has(set.exerciseId) &&
        Number.isInteger(set.setNumber) &&
        set.setNumber > 0 &&
        Number.isFinite(set.weightKg) &&
        set.weightKg >= 0 &&
        Number.isInteger(set.repsDone) &&
        set.repsDone >= 0,
    );

    const log = await prisma.$transaction(async (tx) =>
      tx.workoutLog.create({
        data: {
          userId: user.id,
          routineId: activeRoutine.id,
          duration: Math.ceil(duration / 60),
          logItems: {
            create: validSets.map((set) => ({
              exerciseId: set.exerciseId,
              setNumber: set.setNumber,
              weightKg: set.weightKg,
              repsDone: set.repsDone,
            })),
          },
        },
        select: { id: true },
      }),
    );

    return NextResponse.json({ id: log.id }, { status: 201 });
  } catch (error) {
    console.error("[WORKOUT_COMPLETE_ERROR]", error);
    return NextResponse.json(
      { error: "Không thể lưu workout" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await getOrCreateAppUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const routineId = url.searchParams.get("routineId") || "";
    const routineTitle = url.searchParams.get("routineTitle") || "";
    if (!routineId && !routineTitle) {
      return NextResponse.json({ lastSets: [] });
    }

    const routine = await prisma.routine.findFirst({
      where: {
        AND: [
          {
            OR: [
              ...(routineId ? [{ id: routineId }] : []),
              ...(routineTitle
                ? [{ title: routineTitle, isCustom: false }]
                : []),
            ],
          },
          { OR: [{ userId: user.id }, { userId: null }] },
        ],
      },
      select: { id: true },
    });

    if (!routine) return NextResponse.json({ lastSets: [] });

    const lastLog = await prisma.workoutLog.findFirst({
      where: { routineId: routine.id, userId: user.id },
      orderBy: { completedAt: "desc" },
      include: {
        logItems: {
          select: {
            exerciseId: true,
            setNumber: true,
            weightKg: true,
            repsDone: true,
          },
          orderBy: { setNumber: "asc" },
        },
      },
    });

    return NextResponse.json({ lastSets: lastLog?.logItems || [] });
  } catch (error) {
    console.error("Lỗi lấy dữ liệu buổi tập gần nhất:", error);
    return NextResponse.json(
      { error: "Không thể lấy dữ liệu buổi tập" },
      { status: 500 },
    );
  }
}
