import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/auth-user";
import exercisesData from "@/data/exercises.json";

// Định nghĩa Type chuẩn cho payload gửi lên từ client
interface RoutineItemInput {
  exerciseId: string;
  sets: number | string;
  reps: number | string;
  restSec: number | string;
}

interface CreateRoutineRequestBody {
  title: string;
  description?: string;
  items: RoutineItemInput[];
}

const isValidItems = (items: unknown): items is RoutineItemInput[] =>
  Array.isArray(items) &&
  items.length > 0 &&
  items.length <= 50 &&
  items.every(
    (item) =>
      !!item &&
      typeof item.exerciseId === "string" &&
      Number.isInteger(Number(item.sets)) &&
      Number(item.sets) >= 1 &&
      Number(item.sets) <= 20 &&
      Number.isInteger(Number(item.reps)) &&
      Number(item.reps) >= 1 &&
      Number(item.reps) <= 100 &&
      Number.isInteger(Number(item.restSec)) &&
      Number(item.restSec) >= 0 &&
      Number(item.restSec) <= 600,
  );

// GET: Lấy danh sách giáo án từ Database
export async function GET() {
  try {
    const user = await getOrCreateAppUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const routines = await prisma.routine.findMany({
      where: { isCustom: true, userId: user.id },
      include: {
        items: {
          include: {
            exercise: true,
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(routines);
  } catch (error) {
    console.error("Lỗi lấy danh sách giáo án:", error);
    return NextResponse.json(
      { error: "Không thể lấy dữ liệu" },
      { status: 500 },
    );
  }
}

// POST: Lưu giáo án mới vào Database
export async function POST(req: Request) {
  try {
    const user = await getOrCreateAppUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body: CreateRoutineRequestBody = await req.json();
    const { title, description, items } = body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 100 ||
      !isValidItems(items)
    ) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ" },
        { status: 400 },
      );
    }

    const exerciseIds = items.map((item) => item.exerciseId);
    const localExercises = exercisesData as Array<{
      id: string;
      name: string;
      category: string;
      body_part: string;
      equipment: string;
      image: string;
      instructions?: { en?: string };
    }>;
    const selectedAssets = exerciseIds.map((id) =>
      localExercises.find((exercise) => exercise.id === id),
    );

    if (selectedAssets.some((exercise) => !exercise)) {
      return NextResponse.json(
        { error: "Bài tập không tồn tại trong thư viện" },
        { status: 400 },
      );
    }

    await prisma.exercise.createMany({
      data: selectedAssets
        .filter(
          (exercise): exercise is NonNullable<typeof exercise> => !!exercise,
        )
        .map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          category: exercise.body_part || exercise.category,
          equipment: exercise.equipment || null,
          instructions: exercise.instructions?.en || null,
          mediaUrl: exercise.image || null,
          isCustom: false,
        })),
      skipDuplicates: true,
    });

    const exercises = await prisma.exercise.findMany({
      where: {
        id: { in: exerciseIds },
        OR: [{ userId: null }, { userId: user.id }],
      },
      select: { id: true },
    });

    if (exercises.length !== new Set(exerciseIds).size) {
      return NextResponse.json(
        { error: "Bài tập không hợp lệ" },
        { status: 400 },
      );
    }

    const newRoutine = await prisma.routine.create({
      data: {
        title,
        description,
        isCustom: true,
        userId: user.id,
        items: {
          create: items.map((item: RoutineItemInput, index: number) => ({
            exerciseId: item.exerciseId,
            sets: Number(item.sets),
            reps: Number(item.reps),
            restSec: Number(item.restSec),
            order: index + 1,
          })),
        },
      },
      include: {
        items: {
          include: { exercise: true },
        },
      },
    });

    return NextResponse.json(newRoutine, { status: 201 });
  } catch (error) {
    console.error("Lỗi tạo giáo án:", error);
    return NextResponse.json(
      { error: "Không thể lưu giáo án" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getOrCreateAppUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as {
      id?: unknown;
      title?: unknown;
      items?: unknown;
    };
    const id = typeof body.id === "string" ? body.id : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!id || !title || title.length > 100 || !isValidItems(body.items)) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ" },
        { status: 400 },
      );
    }

    const exerciseIds = body.items.map((item) => item.exerciseId);
    const exercises = await prisma.exercise.findMany({
      where: {
        id: { in: exerciseIds },
        OR: [{ userId: null }, { userId: user.id }],
      },
      select: { id: true },
    });
    if (exercises.length !== new Set(exerciseIds).size) {
      return NextResponse.json(
        { error: "Bài tập không hợp lệ" },
        { status: 400 },
      );
    }

    const routine = await prisma.routine.findFirst({
      where: { id, isCustom: true, userId: user.id },
      select: { id: true },
    });
    if (!routine) {
      return NextResponse.json(
        { error: "Không tìm thấy giáo án" },
        { status: 404 },
      );
    }

    const routineItems = body.items as RoutineItemInput[];
    const updated = await prisma.$transaction(async (tx) => {
      await tx.routineItem.deleteMany({ where: { routineId: id } });
      return tx.routine.update({
        where: { id },
        data: {
          title,
          items: {
            create: routineItems.map((item, index) => ({
              exerciseId: item.exerciseId,
              sets: Number(item.sets),
              reps: Number(item.reps),
              restSec: Number(item.restSec),
              order: index + 1,
            })),
          },
        },
        include: { items: { include: { exercise: true } } },
      });
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Lỗi cập nhật giáo án:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật giáo án" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getOrCreateAppUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Thiếu id giáo án" }, { status: 400 });
    }

    const deleted = await prisma.routine.deleteMany({
      where: { id, isCustom: true, userId: user.id },
    });
    if (!deleted.count) {
      return NextResponse.json(
        { error: "Không tìm thấy giáo án" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi xóa giáo án:", error);
    return NextResponse.json(
      { error: "Không thể xóa giáo án" },
      { status: 500 },
    );
  }
}
