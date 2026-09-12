import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PRESET_WORKOUTS } from "../src/data/presetWorkouts";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// URL gốc chứa media trên GitHub
const MEDIA_BASE_URL =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/";

interface JsonExercise {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  target: string;
  muscle_group: string;
  image: string;
  gif_url: string;
  instructions: { en?: string } | string;
}

function getCategoryFilter(
  category: string,
  title: string,
): Prisma.ExerciseWhereInput {
  const cat = category.toLowerCase();
  const t = title.toLowerCase();

  if (cat === "chest" || t.includes("ngực")) {
    return { category: { contains: "chest", mode: "insensitive" } };
  }
  if (cat === "back" || t.includes("lưng")) {
    return { category: { contains: "back", mode: "insensitive" } };
  }
  if (cat === "legs" || t.includes("chân") || t.includes("mông")) {
    return {
      OR: [
        { category: { contains: "leg", mode: "insensitive" } },
        { category: { contains: "glute", mode: "insensitive" } },
      ],
    };
  }
  if (cat === "shoulders" || t.includes("vai")) {
    return { category: { contains: "shoulder", mode: "insensitive" } };
  }
  if (cat === "biceps" || t.includes("tay trước")) {
    return {
      OR: [
        { category: { contains: "upper arms", mode: "insensitive" } },
        { name: { contains: "biceps", mode: "insensitive" } },
        { name: { contains: "curl", mode: "insensitive" } },
      ],
    };
  }
  if (cat === "abs" || t.includes("bụng")) {
    return {
      OR: [
        { category: { contains: "waist", mode: "insensitive" } },
        { name: { contains: "crunch", mode: "insensitive" } },
        { name: { contains: "sit-up", mode: "insensitive" } },
      ],
    };
  }

  return { category: { contains: cat, mode: "insensitive" } };
}

async function main() {
  console.log("🔄 Đang dọn dẹp dữ liệu cũ...");
  await prisma.workoutLogItem.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.routineItem.deleteMany();
  await prisma.routine.deleteMany();
  await prisma.exercise.deleteMany();

  // 1. Nạp file exercises.json từ src/data/
  const jsonPath = path.join(process.cwd(), "src", "data", "exercises.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Không tìm thấy file tại: ${jsonPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const exercisesData: JsonExercise[] = JSON.parse(rawData);

  console.log(
    `🚀 Đang nạp ${exercisesData.length} bài tập từ exercises.json vào PostgreSQL...`,
  );

  // Nạp bài tập và ghép full URL GitHub Raw vào mediaUrl
  for (const ex of exercisesData) {
    const instructionText =
      typeof ex.instructions === "object"
        ? ex.instructions?.en || ""
        : ex.instructions || "";

    const mediaPath = ex.gif_url || ex.image;
    const fullMediaUrl = mediaPath ? `${MEDIA_BASE_URL}${mediaPath}` : null;

    await prisma.exercise.create({
      data: {
        id: ex.id,
        name: ex.name,
        category: ex.body_part || ex.category,
        equipment: ex.equipment || null,
        instructions: instructionText,
        mediaUrl: fullMediaUrl,
      },
    });
  }

  console.log("✅ Đã nạp xong 1,324 bài tập vào DB!");
  console.log(
    "🚀 Đang ghép bài tập vào từng Giáo án theo tiêu đề & exerciseCount...",
  );

  // 2. Tạo Giáo án và bốc bài tập phù hợp
  for (const item of PRESET_WORKOUTS) {
    const targetCount = item.exerciseCount || 4;
    const whereFilter = getCategoryFilter(item.category, item.title);

    let matchedExercises = await prisma.exercise.findMany({
      where: whereFilter,
      take: targetCount,
    });

    if (matchedExercises.length < targetCount) {
      const existingIds = matchedExercises.map((e) => e.id);
      const extra = await prisma.exercise.findMany({
        where: { id: { notIn: existingIds } },
        take: targetCount - matchedExercises.length,
      });
      matchedExercises = [...matchedExercises, ...extra];
    }

    await prisma.routine.create({
      data: {
        title: item.title,
        description: item.description,
        isCustom: false,
        items: {
          create: matchedExercises.map((ex, index) => ({
            exerciseId: ex.id,
            order: index + 1,
            sets: 4,
            reps: 10,
            restSec: 60,
          })),
        },
      },
    });

    console.log(
      `  + [${item.title}]: Đã chọn ${matchedExercises.length} bài tập.`,
    );
  }

  console.log("🎉 Hoàn tất Seed dữ liệu!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
